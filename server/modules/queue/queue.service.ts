import { db } from '../../db.js';
import { broadcaster } from '../../sockets/broadcaster.js';
import { 
  addisVoiceProvider,
  buildAmharicAnnouncementText, 
  buildEnglishAnnouncementText, 
  buildPhoneticAnnouncementText,
  getAmharicTicketNumber
} from '../../services/addis-voice.service.js';
import { 
  AnnouncementPayload, 
  PriorityLevel, 
  QueueTicket, 
  Counter, 
  Service, 
  CustomerReview 
} from '../../../shared/types/index.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../errors/AppError.js';

export class QueueService {
  /**
   * Asynchronously triggers the Addis AI or custom recorded voice announcement
   */
  public async triggerVoiceAnnouncement(
    ticketNumber: string,
    counterNumber: number,
    serviceName: string,
    serviceNameAmharic: string,
    customAudioBase64?: string,
    customAudioMimeType?: string,
    officerName?: string,
    customText?: string
  ): Promise<void> {
    try {
      const audioSettings = db.getAudioSetting();
      if (!audioSettings.voiceEnabled) return;

      const ticketNumberAmharic = getAmharicTicketNumber(ticketNumber);
      const textAmharic = customText || buildAmharicAnnouncementText(ticketNumber, counterNumber, serviceNameAmharic);
      const textEnglish = customText || buildEnglishAnnouncementText(ticketNumber, counterNumber, serviceName);
      const phoneticText = customText || buildPhoneticAnnouncementText(ticketNumber, counterNumber, serviceNameAmharic);

      const payload: AnnouncementPayload = {
        ticketNumber,
        ticketNumberAmharic,
        counterNumber,
        serviceName,
        serviceNameAmharic,
        language: audioSettings.language,
        textAmharic,
        textEnglish,
        phoneticText: audioSettings.language === 'ENGLISH' 
          ? textEnglish 
          : audioSettings.language === 'BOTH' 
            ? `${phoneticText} ${textEnglish}` 
            : phoneticText,
        officerName,
        customText,
        timestamp: new Date().toISOString()
      };

      // Case 1: Direct personal live voice recording from officer
      if (customAudioBase64 && customAudioBase64.trim().length > 0) {
        payload.audioBase64 = customAudioBase64;
        payload.audioMimeType = customAudioMimeType || 'audio/webm';
        payload.source = 'OFFICER_LIVE_RECORDING';
        payload.isLiveVoiceRecord = true;
        broadcaster.broadcast('announcement:play', payload);
        return;
      }

      // Case 2: Custom recorded audio configured in system audio settings
      if ((audioSettings.ttsProvider === 'CUSTOM_RECORDED' || audioSettings.voiceMode === 'CUSTOM_RECORDED') && audioSettings.customRecordingBase64) {
        payload.audioBase64 = audioSettings.customRecordingBase64;
        payload.audioMimeType = audioSettings.customRecordingMimeType || 'audio/webm';
        payload.source = 'CUSTOM_RECORDED';
        broadcaster.broadcast('announcement:play', payload);
        return;
      }

      // Case 3: Addis AI Cloud Voice generation / Phonetic fallback
      let speechText = textAmharic;
      if (audioSettings.language === 'ENGLISH') {
        speechText = textEnglish;
      } else if (audioSettings.language === 'BOTH') {
        speechText = `${textAmharic} ${textEnglish}`;
      }

      const audioResult = await addisVoiceProvider.generateSpeech(
        speechText,
        audioSettings.language,
        audioSettings.addisVoice || 'aster',
        audioSettings.addisAiSpeed || 1.0
      );

      if (audioResult) {
        if (audioResult.audioBase64) {
          payload.audioBase64 = audioResult.audioBase64;
          payload.audioMimeType = audioResult.mimeType;
        }
        if (audioResult.phoneticText) {
          payload.phoneticText = audioResult.phoneticText;
        }
        payload.source = audioResult.source;
      }

      broadcaster.broadcast('announcement:play', payload);
    } catch (err) {
      console.error('Error during voice announcement trigger:', err);
    }
  }

  public getQueueState() {
    const today = new Date().toISOString().split('T')[0];
    const allTickets = db.getTickets();

    const waitingTickets = allTickets
      .filter(t => t.status === 'WAITING' && t.dateKey === today)
      .map(t => ({
        ...t,
        ticketNumberAmharic: getAmharicTicketNumber(t.ticketNumber)
      }));

    const servingTickets = allTickets
      .filter(t => (t.status === 'SERVING' || t.status === 'CALLED') && t.dateKey === today)
      .map(t => ({
        ...t,
        ticketNumberAmharic: getAmharicTicketNumber(t.ticketNumber)
      }));

    const recentCompleted = allTickets
      .filter(t => t.status === 'COMPLETED' && t.dateKey === today)
      .slice(0, 10)
      .map(t => ({
        ...t,
        ticketNumberAmharic: getAmharicTicketNumber(t.ticketNumber)
      }));

    const counters = db.getCounters();
    const services = db.getServices().filter(s => s.isActive);
    const officeSetting = db.getOfficeSetting();
    const audioSetting = db.getAudioSetting();
    const stats = db.getQueueStats();

    return {
      waitingTickets,
      servingTickets,
      recentCompleted,
      counters,
      services,
      officeSetting,
      audioSetting,
      stats: {
        totalTicketsToday: stats.total,
        completedToday: stats.completed,
        cancelledToday: stats.cancelled,
        currentlyWaiting: stats.waiting,
        currentlyServing: stats.serving,
        avgWaitTimeMinutes: stats.avgWaitMinutes,
        avgServiceTimeMinutes: stats.avgServiceMinutes
      }
    };
  }

  public getTickets(options?: { status?: string; serviceId?: string; dateKey?: string }) {
    let list = db.getTickets({
      dateKey: options?.dateKey,
      status: options?.status
    });
    if (options?.serviceId) {
      list = list.filter(t => t.serviceId === options.serviceId);
    }
    return list.map(t => ({
      ...t,
      ticketNumberAmharic: getAmharicTicketNumber(t.ticketNumber)
    }));
  }

  public createTicket(options: {
    serviceId: string;
    priority?: PriorityLevel;
    urgencyReason?: string;
    notes?: string;
    userId?: string;
    userName?: string;
  }) {
    const { serviceId, priority = 'NORMAL', urgencyReason, notes, userId, userName } = options;
    if (!serviceId) {
      throw new BadRequestError('serviceId is required.');
    }

    const service = db.getServiceById(serviceId);
    if (!service || !service.isActive) {
      throw new BadRequestError('Invalid or inactive service specified.');
    }

    const isUrgent = priority === 'URGENT';
    const policy = db.getPriorityPolicy();
    if (isUrgent && policy.requireReasonForUrgent && (!urgencyReason || !urgencyReason.trim())) {
      throw new BadRequestError('A specific urgency reason is required by office priority policy for Urgent classification.');
    }

    const ticket = db.generateTicket(
      serviceId, 
      priority, 
      urgencyReason, 
      notes,
      userName || 'Self-Service Kiosk'
    );

    const officeSetting = db.getOfficeSetting();
    const today = new Date().toISOString().split('T')[0];
    const peopleAhead = db.getTickets({ dateKey: today, status: 'WAITING' }).filter(t => 
      t.serviceId === serviceId && 
      t.id !== ticket.id &&
      (new Date(t.issuedAt) < new Date(ticket.issuedAt))
    ).length;

    const estimatedWaitMinutes = Math.max(
      1, 
      peopleAhead * (officeSetting.estimatedWaitPerPersonMinutes || 5)
    );

    ticket.peopleAhead = peopleAhead;
    ticket.estimatedWaitMinutes = estimatedWaitMinutes;
    ticket.ticketNumberAmharic = getAmharicTicketNumber(ticket.ticketNumber);

    db.addAuditLog({
      userId,
      userName: userName || 'Kiosk',
      action: 'CREATE_TICKET',
      entity: 'QueueTicket',
      entityId: ticket.id,
      metadata: { 
        ticketNumber: ticket.ticketNumber, 
        service: service.name, 
        priority: ticket.priority,
        isUrgent: ticket.isUrgent
      }
    });

    broadcaster.broadcast('queue:updated', { action: 'TICKET_CREATED', ticket });

    const printData = {
      ticketNumber: ticket.ticketNumber,
      ticketNumberAmharic: ticket.ticketNumberAmharic,
      serviceName: service.name,
      serviceNameAmharic: service.nameAmharic,
      issuedAt: ticket.issuedAt,
      peopleAhead,
      estimatedWaitMinutes,
      officeName: officeSetting.officeName,
      officeNameAmharic: officeSetting.officeNameAmharic,
      contactNumber: officeSetting.contactNumber,
      priority: ticket.priority,
      urgencyReason: ticket.urgencyReason,
      isUrgent: ticket.isUrgent
    };

    return { ticket, printData };
  }

  public checkIn(id: string) {
    const existing = db.getTicketById(id);
    if (!existing) {
      throw new NotFoundError('Ticket not found.');
    }

    const ticket = db.checkInTicket(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    broadcaster.broadcast('ticket:checkedin', { ticket });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_CHECKED_IN', ticket });

    return {
      ...ticket,
      ticketNumberAmharic: getAmharicTicketNumber(ticket.ticketNumber)
    };
  }

  public async callNext(options: {
    counterId: string;
    targetServiceId?: string;
    customAudioBase64?: string;
    customAudioMimeType?: string;
    customText?: string;
    user: any;
  }) {
    const { counterId, targetServiceId, customAudioBase64, customAudioMimeType, customText, user } = options;

    if (!counterId) {
      throw new BadRequestError('counterId is required.');
    }

    // Role-based counter enforcement: Service Officers are strictly limited to their assigned counter
    const currentUser = db.getUserById(user.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (counterId !== currentUser.assignedCounterId) {
        throw new ForbiddenError('Access denied: Service officers can only call tickets for their assigned counter station.');
      }
    }

    const assignedCounter = db.getCounterById(counterId);
    if (!assignedCounter) {
      throw new NotFoundError('Counter not found.');
    }

    // Complete any currently serving ticket on this counter first if active
    if (assignedCounter.currentTicketId) {
      const activeTicket = db.getTicketById(assignedCounter.currentTicketId);
      if (activeTicket && (activeTicket.status === 'CALLED' || activeTicket.status === 'SERVING')) {
        db.updateTicketStatus(activeTicket.id, 'COMPLETED', user.id);
        broadcaster.broadcast('ticket:completed', { ticket: activeTicket });
      }
    }

    // Call the next eligible ticket
    const calledTicket = await db.callNextTicket(counterId, user.id, targetServiceId);
    if (!calledTicket) {
      return { noTicket: true, message: 'No eligible waiting customers in line.' };
    }

    const counter = db.getCounterById(counterId);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CALL_NEXT',
      entity: 'QueueTicket',
      entityId: calledTicket.id,
      metadata: { ticketNumber: calledTicket.ticketNumber, counterId, counterNumber: counter?.number }
    });

    broadcaster.broadcast('ticket:called', {
      ticket: calledTicket,
      counter
    });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_CALLED' });

    // Persist real-time reception notification
    const receptionNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_CALLED',
      title: 'Queue Number Called',
      message: `${counter?.name || `Counter ${counter?.number || 1}`} called ticket ${calledTicket.ticketNumber}`,
      ticketId: calledTicket.id,
      ticketNumber: calledTicket.ticketNumber,
      counterId,
      counterNumber: counter?.number,
      counterName: counter?.name || `Counter ${counter?.number || 1}`,
      serviceId: calledTicket.serviceId,
      serviceName: calledTicket.serviceName,
      officerId: user.id,
      officerName: user.name,
      action: 'Called'
    });
    broadcaster.broadcast('reception:notification', receptionNotif);
    broadcaster.broadcast('notification:created', receptionNotif);

    // Asynchronously trigger AI voice announcement
    this.triggerVoiceAnnouncement(
      calledTicket.ticketNumber,
      counter ? counter.number : 1,
      calledTicket.serviceName,
      calledTicket.serviceNameAmharic,
      customAudioBase64,
      customAudioMimeType,
      user.name || user.username,
      customText
    );

    return { calledTicket, counter };
  }

  public recall(id: string, options: {
    customAudioBase64?: string;
    customAudioMimeType?: string;
    customText?: string;
    user: any;
  }) {
    const { customAudioBase64, customAudioMimeType, customText, user } = options;
    const ticket = db.getTicketById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const currentUser = db.getUserById(user.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (ticket.counterId && ticket.counterId !== currentUser.assignedCounterId) {
        throw new ForbiddenError('Access denied: You can only recall tickets assigned to your counter.');
      }
    }

    const counter = ticket.counterId ? db.getCounterById(ticket.counterId) : undefined;
    const counterNumber = counter ? counter.number : (ticket.counterNumber || 1);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'RECALL_CUSTOMER',
      entity: 'QueueTicket',
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber, counterNumber, hasCustomVoice: !!customAudioBase64 }
    });

    broadcaster.broadcast('ticket:called', { ticket, counter });

    const receptionNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_RECALLED',
      title: 'Ticket Recalled',
      message: `${counter?.name || `Counter ${counterNumber}`} recalled ticket ${ticket.ticketNumber}`,
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      counterId: ticket.counterId,
      counterNumber,
      counterName: counter?.name || `Counter ${counterNumber}`,
      serviceId: ticket.serviceId,
      serviceName: ticket.serviceName,
      officerId: user.id,
      officerName: user.name,
      action: 'Recalled'
    });
    broadcaster.broadcast('reception:notification', receptionNotif);
    broadcaster.broadcast('notification:created', receptionNotif);

    this.triggerVoiceAnnouncement(
      ticket.ticketNumber,
      counterNumber,
      ticket.serviceName,
      ticket.serviceNameAmharic,
      customAudioBase64,
      customAudioMimeType,
      user.name || user.username,
      customText
    );

    return ticket;
  }

  public startServing(id: string, user: any) {
    const existingTicket = db.getTicketById(id);
    if (!existingTicket) {
      throw new NotFoundError('Ticket not found.');
    }

    const currentUser = db.getUserById(user.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (existingTicket.counterId && existingTicket.counterId !== currentUser.assignedCounterId) {
        throw new ForbiddenError('Access denied: You can only manage tickets called at your assigned counter.');
      }
    }

    const ticket = db.updateTicketStatus(id, 'SERVING', user.id);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'START_SERVICE',
      entity: 'QueueTicket',
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber }
    });

    broadcaster.broadcast('ticket:started', { ticket });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_STARTED' });

    return ticket;
  }

  public completeServing(id: string, user: any) {
    const ticket = db.getTicketById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const currentUser = db.getUserById(user.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (ticket.counterId && ticket.counterId !== currentUser.assignedCounterId) {
        throw new ForbiddenError('Access denied: You can only complete tickets at your assigned counter.');
      }
    }

    const updated = db.updateTicketStatus(id, 'COMPLETED', user.id);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'COMPLETE_TICKET',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { 
        ticketNumber: updated.ticketNumber, 
        serviceDurationSeconds: updated.serviceDurationSeconds 
      }
    });

    broadcaster.broadcast('ticket:completed', { ticket: updated });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_COMPLETED' });

    const completeCounter = updated.counterId ? db.getCounterById(updated.counterId) : undefined;
    const completeNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_COMPLETED',
      title: 'Ticket Completed',
      message: `${completeCounter?.name || `Counter ${updated.counterNumber || 1}`} completed ticket ${updated.ticketNumber}`,
      ticketId: updated.id,
      ticketNumber: updated.ticketNumber,
      counterId: updated.counterId,
      counterNumber: updated.counterNumber,
      counterName: completeCounter?.name || `Counter ${updated.counterNumber || 1}`,
      serviceId: updated.serviceId,
      serviceName: updated.serviceName,
      officerId: user.id,
      officerName: user.name,
      action: 'Completed'
    });
    broadcaster.broadcast('reception:notification', completeNotif);
    broadcaster.broadcast('notification:created', completeNotif);

    return updated;
  }

  public noShow(id: string, user: any) {
    const ticket = db.getTicketById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const currentUser = db.getUserById(user.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (ticket.counterId && ticket.counterId !== currentUser.assignedCounterId) {
        throw new ForbiddenError('Access denied: You can only update tickets at your assigned counter.');
      }
    }

    const updated = db.updateTicketStatus(id, 'NO_SHOW', user.id);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'NO_SHOW',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber }
    });

    broadcaster.broadcast('ticket:no-show', { ticket: updated });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_NO_SHOW' });

    const skipCounter = updated.counterId ? db.getCounterById(updated.counterId) : undefined;
    const skipNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_SKIPPED',
      title: 'Ticket Skipped',
      message: `${skipCounter?.name || `Counter ${updated.counterNumber || 1}`} skipped ticket ${updated.ticketNumber}`,
      ticketId: updated.id,
      ticketNumber: updated.ticketNumber,
      counterId: updated.counterId,
      counterNumber: updated.counterNumber,
      counterName: skipCounter?.name || `Counter ${updated.counterNumber || 1}`,
      serviceId: updated.serviceId,
      serviceName: updated.serviceName,
      officerId: user.id,
      officerName: user.name,
      action: 'Skipped'
    });
    broadcaster.broadcast('reception:notification', skipNotif);
    broadcaster.broadcast('notification:created', skipNotif);

    return updated;
  }

  public transfer(id: string, options: { targetServiceId?: string; targetCounterId?: string; user: any }) {
    const { targetServiceId, targetCounterId, user } = options;
    if (!targetServiceId && !targetCounterId) {
      throw new BadRequestError('targetServiceId or targetCounterId is required.');
    }

    const updated = db.transferTicket(id, targetServiceId || 'srv-1', user.id);
    const targetService = targetServiceId ? db.getServiceById(targetServiceId) : undefined;
    const targetCounter = targetCounterId ? db.getCounterById(targetCounterId) : undefined;

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'TRANSFER_TICKET',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber, targetServiceId, targetCounterId }
    });

    broadcaster.broadcast('ticket:transferred', { ticket: updated });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_TRANSFERRED' });

    const destinationLabel = targetCounter ? targetCounter.name : (targetService ? targetService.name : 'another station');
    const transferNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_TRANSFERRED',
      title: 'Ticket Transferred',
      message: `Ticket ${updated.ticketNumber} transferred to ${destinationLabel}`,
      ticketId: updated.id,
      ticketNumber: updated.ticketNumber,
      counterId: targetCounter?.id || updated.counterId,
      counterNumber: targetCounter?.number || updated.counterNumber,
      counterName: destinationLabel,
      serviceId: targetServiceId || updated.serviceId,
      serviceName: targetService?.name || updated.serviceName,
      officerId: user.id,
      officerName: user.name,
      action: 'Transferred'
    });
    broadcaster.broadcast('reception:notification', transferNotif);
    broadcaster.broadcast('notification:created', transferNotif);

    return updated;
  }

  public hold(id: string, user: any) {
    const existing = db.getTicketById(id);
    if (!existing) {
      throw new NotFoundError('Ticket not found.');
    }

    const updated = db.holdTicket(id, user.id);
    const counter = updated.counterId ? db.getCounterById(updated.counterId) : undefined;
    const counterName = counter?.name || `Counter ${updated.counterNumber || 1}`;

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'HOLD_TICKET',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber }
    });

    broadcaster.broadcast('queue:updated', { action: 'TICKET_HOLD' });

    const holdNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_HOLD',
      title: 'Ticket On Hold',
      message: `${counterName} placed ticket ${updated.ticketNumber} on hold`,
      ticketId: updated.id,
      ticketNumber: updated.ticketNumber,
      counterId: updated.counterId,
      counterNumber: updated.counterNumber,
      counterName,
      serviceId: updated.serviceId,
      serviceName: updated.serviceName,
      officerId: user.id,
      officerName: user.name,
      action: 'Hold'
    });
    broadcaster.broadcast('reception:notification', holdNotif);
    broadcaster.broadcast('notification:created', holdNotif);

    return updated;
  }

  public resume(id: string, user: any) {
    const existing = db.getTicketById(id);
    if (!existing) {
      throw new NotFoundError('Ticket not found.');
    }

    const updated = db.resumeTicket(id, user.id);
    const counter = updated.counterId ? db.getCounterById(updated.counterId) : undefined;
    const counterName = counter?.name || `Counter ${updated.counterNumber || 1}`;

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'RESUME_TICKET',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber }
    });

    broadcaster.broadcast('queue:updated', { action: 'TICKET_RESUMED' });

    const resumeNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_RESUMED',
      title: 'Ticket Resumed',
      message: `${counterName} resumed ticket ${updated.ticketNumber}`,
      ticketId: updated.id,
      ticketNumber: updated.ticketNumber,
      counterId: updated.counterId,
      counterNumber: updated.counterNumber,
      counterName,
      serviceId: updated.serviceId,
      serviceName: updated.serviceName,
      officerId: user.id,
      officerName: user.name,
      action: 'Resumed'
    });
    broadcaster.broadcast('reception:notification', resumeNotif);
    broadcaster.broadcast('notification:created', resumeNotif);

    return updated;
  }

  public cancel(id: string, user: any) {
    const updated = db.updateTicketStatus(id, 'CANCELLED', user.id);

    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'CANCEL_TICKET',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber }
    });

    broadcaster.broadcast('queue:updated', { action: 'TICKET_CANCELLED' });
    return updated;
  }

  public resetDaily(user: any) {
    db.resetTodayQueue();
    db.addAuditLog({
      userId: user.id,
      userName: user.name,
      action: 'RESET_QUEUE',
      entity: 'Queue'
    });

    broadcaster.broadcast('queue:updated', { action: 'QUEUE_RESET' });
    return true;
  }

  public updatePriority(id: string, options: {
    priority: PriorityLevel;
    urgencyReason?: string;
    notes?: string;
    user: any;
  }) {
    const { priority, urgencyReason, notes, user } = options;
    if (!priority || !['NORMAL', 'PRIORITY', 'URGENT'].includes(priority)) {
      throw new BadRequestError('Invalid priority level. Must be NORMAL, PRIORITY, or URGENT.');
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const policy = db.getPriorityPolicy();
    if (priority === 'URGENT' && policy.requireReasonForUrgent && (!urgencyReason || !urgencyReason.trim())) {
      throw new BadRequestError('A specific urgency reason is required by office priority policy for Urgent classification.');
    }

    const flaggedBy = user.name || user.username || 'Staff';
    const updated = db.setTicketPriority(
      id, 
      priority, 
      urgencyReason, 
      flaggedBy, 
      notes
    );

    db.addAuditLog({
      userId: user.id,
      userName: flaggedBy,
      action: 'SET_TICKET_PRIORITY',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { 
        ticketNumber: updated.ticketNumber, 
        priority: updated.priority, 
        urgencyReason: updated.urgencyReason,
        isUrgent: updated.isUrgent,
        notes
      }
    });

    broadcaster.broadcast('ticket:priority_changed', { ticket: updated });
    broadcaster.broadcast('queue:updated', { 
      action: 'TICKET_PRIORITY_CHANGED', 
      ticketNumber: updated.ticketNumber,
      priority: updated.priority,
      isUrgent: updated.isUrgent
    });

    return {
      ...updated,
      ticketNumberAmharic: getAmharicTicketNumber(updated.ticketNumber)
    };
  }

  public updateCounterStatus(counterId: string, status?: string, isBreak?: boolean, user?: any) {
    const counter = db.getCounterById(counterId);
    if (!counter) {
      throw new NotFoundError('Counter not found.');
    }

    const updated = db.updateCounter(counterId, {
      status: (status as any) || (isBreak ? 'CLOSED' : 'AVAILABLE'),
      currentOfficerId: user?.id,
      currentOfficerName: user?.name
    });

    if (!updated) {
      throw new BadRequestError('Failed to update counter.');
    }

    broadcaster.broadcast('counter:updated', { counter: updated });
    broadcaster.broadcast('queue:updated', { action: 'COUNTER_STATUS_CHANGED' });

    let notifType: 'COUNTER_AVAILABLE' | 'COUNTER_BREAK' | 'COUNTER_OFFLINE' | 'COUNTER_ONLINE' = 'COUNTER_AVAILABLE';
    let notifTitle = 'Counter Status Changed';
    let notifMsg = `${updated.name} status updated`;

    if (isBreak || updated.status === 'CLOSED') {
      notifType = isBreak ? 'COUNTER_BREAK' : 'COUNTER_OFFLINE';
      notifTitle = isBreak ? 'Counter On Break' : 'Counter Offline';
      notifMsg = isBreak ? `${updated.name} started a break` : `${updated.name} disconnected`;
    } else if (updated.status === 'AVAILABLE') {
      notifType = 'COUNTER_AVAILABLE';
      notifTitle = 'Counter Available';
      notifMsg = `${updated.name} is available`;
    }

    const counterNotif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: notifType,
      title: notifTitle,
      message: notifMsg,
      counterId: updated.id,
      counterNumber: updated.number,
      counterName: updated.name,
      officerId: user?.id,
      officerName: user?.name,
      action: updated.status
    });
    broadcaster.broadcast('reception:notification', counterNotif);
    broadcaster.broadcast('notification:created', counterNotif);

    return updated;
  }

  public addReview(reviewData: {
    ticketId: string;
    rating: number;
    tags?: string[];
    comment?: string;
  }): CustomerReview {
    const { ticketId, rating, tags, comment } = reviewData;
    if (!ticketId) {
      throw new BadRequestError('ticketId is required.');
    }
    if (!rating || rating < 1 || rating > 5) {
      throw new BadRequestError('rating must be an integer between 1 and 5.');
    }

    const ticket = db.getTicketById(ticketId);
    if (!ticket) {
      throw new NotFoundError('Ticket not found.');
    }

    const result = db.addCustomerReview(ticketId, {
      rating: Math.round(rating),
      tags: tags || [],
      comment: comment || ''
    });

    return result.review;
  }

  public getReviews() {
    return db.getCustomerReviews();
  }
}

export const queueService = new QueueService();
