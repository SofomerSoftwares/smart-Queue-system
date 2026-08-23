import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { broadcaster } from '../websocket.js';
import { 
  addisVoiceProvider, 
  buildAmharicAnnouncementText, 
  buildEnglishAnnouncementText, 
  getAmharicTicketNumber 
} from '../services/addis-voice.service.js';
import { AnnouncementPayload } from '../types.js';

const router = Router();

// Helper to trigger asynchronous voice generation & broadcast
async function triggerVoiceAnnouncement(
  ticketNumber: string, 
  counterNumber: number, 
  serviceName: string,
  serviceNameAmharic: string
) {
  try {
    const audioSettings = db.getAudioSetting();
    if (!audioSettings.voiceEnabled) {
      return;
    }

    const textAmharic = buildAmharicAnnouncementText(ticketNumber, counterNumber, serviceNameAmharic);
    const textEnglish = buildEnglishAnnouncementText(ticketNumber, counterNumber, serviceName);
    const ticketAmharic = getAmharicTicketNumber(ticketNumber);

    // Initial announcement broadcast immediately so display shows visual highlight
    const payload: AnnouncementPayload = {
      ticketNumber,
      ticketNumberAmharic: ticketAmharic,
      counterNumber,
      serviceName,
      serviceNameAmharic,
      language: audioSettings.language,
      textAmharic,
      textEnglish,
      timestamp: new Date().toISOString()
    };

    // Asynchronous Voice generation via Addis AI Voice
    const speechText = audioSettings.language === 'ENGLISH' ? textEnglish : textAmharic;
    const audioResult = await addisVoiceProvider.generateSpeech(
      speechText,
      audioSettings.language,
      audioSettings.addisVoice || 'aster',
      audioSettings.addisAiSpeed || 1.0
    );

    if (audioResult && audioResult.audioBase64) {
      payload.audioBase64 = audioResult.audioBase64;
      payload.audioMimeType = audioResult.mimeType;
    }

    // Broadcast announcement to all listening displays and staff
    broadcaster.broadcast('announcement:play', payload);
  } catch (err) {
    console.error('Error during voice announcement trigger:', err);
  }
}

// 1. GET /api/queue/status - Full queue state for display, receptionist, officer
router.get('/status', (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allTickets = db.getTickets({ dateKey: today });
    const waitingTickets = allTickets
      .filter(t => t.status === 'WAITING')
      .sort((a, b) => {
        if (a.priority === 'PRIORITY' && b.priority !== 'PRIORITY') return -1;
        if (a.priority !== 'PRIORITY' && b.priority === 'PRIORITY') return 1;
        return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      });

    const servingTickets = allTickets.filter(t => t.status === 'SERVING' || t.status === 'CALLED');
    const completedTickets = allTickets
      .filter(t => t.status === 'COMPLETED')
      .sort((a, b) => new Date(b.completedAt || '').getTime() - new Date(a.completedAt || '').getTime())
      .slice(0, 10);

    const counters = db.getCounters();
    const services = db.getServices().filter(s => s.isActive);
    const officeSetting = db.getOfficeSetting();
    const audioSetting = db.getAudioSetting();
    const stats = db.getQueueStats(today);

    return res.json({
      success: true,
      waitingTickets,
      servingTickets,
      completedTickets,
      counters,
      services,
      officeSetting,
      audioSetting,
      stats,
      serverTime: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2. GET /api/queue/ticket/:ticketNumber - Public customer mobile tracking
router.get('/ticket/:ticketNumber', (req: Request, res: Response) => {
  try {
    const { ticketNumber } = req.params;
    const ticket = db.getTicketByNumber(ticketNumber);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `Ticket ${ticketNumber} not found.`,
        code: 'TICKET_NOT_FOUND'
      });
    }

    const today = ticket.dateKey;
    const allWaitingToday = db.getTickets({ dateKey: today, status: 'WAITING' })
      .sort((a, b) => {
        if (a.priority === 'PRIORITY' && b.priority !== 'PRIORITY') return -1;
        if (a.priority !== 'PRIORITY' && b.priority === 'PRIORITY') return 1;
        return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
      });

    // Find people ahead
    let peopleAhead = 0;
    const indexInQueue = allWaitingToday.findIndex(t => t.id === ticket.id);
    if (ticket.status === 'WAITING') {
      peopleAhead = indexInQueue >= 0 ? indexInQueue : 0;
    }

    const officeSetting = db.getOfficeSetting();
    const waitPerPerson = officeSetting.estimatedWaitPerPersonMinutes || 4;
    const estimatedWaitMinutes = ticket.status === 'WAITING' ? Math.max(2, (peopleAhead + 1) * waitPerPerson) : 0;

    // Find currently serving ticket for this service
    const currentlyServing = db.getTickets({ dateKey: today }).find(
      t => t.serviceId === ticket.serviceId && (t.status === 'SERVING' || t.status === 'CALLED')
    );

    return res.json({
      success: true,
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        ticketNumberAmharic: getAmharicTicketNumber(ticket.ticketNumber),
        serviceName: ticket.serviceName,
        serviceNameAmharic: ticket.serviceNameAmharic,
        status: ticket.status,
        priority: ticket.priority,
        issuedAt: ticket.issuedAt,
        calledAt: ticket.calledAt,
        counterNumber: ticket.counterNumber,
        counterId: ticket.counterId,
        peopleAhead,
        estimatedWaitMinutes,
        currentlyServingTicketNumber: currentlyServing?.ticketNumber || 'None'
      },
      office: {
        name: officeSetting.officeName,
        nameAmharic: officeSetting.officeNameAmharic,
        displayNotice: officeSetting.displayNotice,
        displayNoticeAmharic: officeSetting.displayNoticeAmharic
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. POST /api/queue/ticket - Receptionist / Kiosk ticket creation (Anonymous self-service or staff logged)
router.post('/ticket', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceId, priority } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId is required to generate a ticket.'
      });
    }

    const ticket = db.generateTicket(serviceId, priority === 'PRIORITY' ? 'PRIORITY' : 'NORMAL');
    const officeSetting = db.getOfficeSetting();

    // Calculate people ahead & estimated wait
    const waitingTickets = db.getTickets({ dateKey: ticket.dateKey, status: 'WAITING' });
    const peopleAhead = Math.max(0, waitingTickets.length - 1);
    const estimatedWait = Math.max(2, (peopleAhead + 1) * (officeSetting.estimatedWaitPerPersonMinutes || 4));

    // Audit log
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CREATE_TICKET',
      entity: 'QueueTicket',
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber, serviceId }
    });

    // Realtime broadcast
    broadcaster.broadcast('queue:updated', {
      action: 'TICKET_CREATED',
      ticketNumber: ticket.ticketNumber
    });

    return res.status(201).json({
      success: true,
      ticket: {
        ...ticket,
        ticketNumberAmharic: getAmharicTicketNumber(ticket.ticketNumber),
        peopleAhead,
        estimatedWaitMinutes: estimatedWait
      },
      printData: {
        officeName: officeSetting.officeName,
        officeNameAmharic: officeSetting.officeNameAmharic,
        ticketNumber: ticket.ticketNumber,
        ticketNumberAmharic: getAmharicTicketNumber(ticket.ticketNumber),
        serviceName: ticket.serviceName,
        serviceNameAmharic: ticket.serviceNameAmharic,
        peopleAhead,
        estimatedWaitMinutes: estimatedWait,
        issuedAt: ticket.issuedAt,
        notice: officeSetting.displayNotice
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 4. POST /api/queue/ticket/call-next - Officer calls next waiting customer (Atomic Transaction)
router.post('/ticket/call-next', authenticate, authorize('ticket.call'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { counterId, specificTicketId } = req.body;
    const officerId = req.user!.id;
    const currentUser = db.getUserById(officerId);

    if (!counterId) {
      return res.status(400).json({
        success: false,
        message: 'counterId is required to call next ticket.'
      });
    }

    // STRICT OFFICER ACCESS ENFORCEMENT:
    // If the user is a SERVICE_OFFICER and has an assigned counter, strictly limit to that counter!
    if (currentUser && currentUser.role === 'SERVICE_OFFICER') {
      if (currentUser.assignedCounterId && currentUser.assignedCounterId !== counterId) {
        const assignedCounter = db.getCounterById(currentUser.assignedCounterId);
        return res.status(403).json({
          success: false,
          message: `Access denied: You are assigned and limited to Counter ${assignedCounter ? assignedCounter.number : currentUser.assignedCounterId}. (ለእርስዎ የተመደበው ቆጣሪ ብቻ ነው የሚፈቀደው)`
        });
      }

      // If officer didn't have an assigned counter yet, bind this counter to the officer
      if (!currentUser.assignedCounterId) {
        db.updateUser(officerId, { assignedCounterId: counterId });
      }
    }

    // Call next ticket transactionally
    const calledTicket = await db.callNextTicket(counterId, officerId, specificTicketId);

    if (!calledTicket) {
      return res.status(200).json({
        success: false,
        message: 'No waiting tickets available in the queue.',
        code: 'NO_TICKETS_WAITING'
      });
    }

    const counter = db.getCounterById(counterId);

    // Audit log
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CALL_TICKET',
      entity: 'QueueTicket',
      entityId: calledTicket.id,
      metadata: { ticketNumber: calledTicket.ticketNumber, counterId, counterNumber: counter?.number }
    });

    // Broadcast queue update
    broadcaster.broadcast('ticket:called', {
      ticket: calledTicket,
      counter
    });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_CALLED' });

    // Asynchronously trigger AI voice announcement (DO NOT block the response)
    triggerVoiceAnnouncement(
      calledTicket.ticketNumber,
      counter ? counter.number : 1,
      calledTicket.serviceName,
      calledTicket.serviceNameAmharic
    );

    return res.json({
      success: true,
      ticket: calledTicket,
      counter
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 5. POST /api/queue/ticket/:id/recall - Recall the same customer
router.post('/ticket/:id/recall', authenticate, authorize('ticket.recall'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = db.getTicketById(id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    // Enforce officer counter check if assigned
    const currentUser = db.getUserById(req.user!.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (ticket.counterId && ticket.counterId !== currentUser.assignedCounterId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only manage tickets called at your assigned counter.'
        });
      }
    }

    const counter = ticket.counterId ? db.getCounterById(ticket.counterId) : undefined;
    const counterNumber = counter ? counter.number : (ticket.counterNumber || 1);

    // Audit log
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'RECALL_TICKET',
      entity: 'QueueTicket',
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber, counterNumber }
    });

    broadcaster.broadcast('ticket:called', { ticket, counter });

    // Trigger voice announcement
    triggerVoiceAnnouncement(
      ticket.ticketNumber,
      counterNumber,
      ticket.serviceName,
      ticket.serviceNameAmharic
    );

    return res.json({ success: true, ticket });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 6. POST /api/queue/ticket/:id/start - Start serving
router.post('/ticket/:id/start', authenticate, authorize('ticket.start'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existingTicket = db.getTicketById(id);
    if (!existingTicket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const currentUser = db.getUserById(req.user!.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (existingTicket.counterId && existingTicket.counterId !== currentUser.assignedCounterId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only manage tickets called at your assigned counter.'
        });
      }
    }

    const ticket = db.updateTicketStatus(id, 'SERVING', req.user?.id);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'START_SERVICE',
      entity: 'QueueTicket',
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber }
    });

    broadcaster.broadcast('ticket:started', { ticket });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_STARTED' });

    return res.json({ success: true, ticket });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 7. POST /api/queue/ticket/:id/complete - Finish serving customer
router.post('/api/queue/ticket/:id/complete', authenticate, authorize('ticket.complete'), (req: AuthenticatedRequest, res: Response) => {
  // handled below
});

router.post('/ticket/:id/complete', authenticate, authorize('ticket.complete'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = db.getTicketById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found.',
        code: 'NOT_FOUND'
      });
    }

    const currentUser = db.getUserById(req.user!.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (ticket.counterId && ticket.counterId !== currentUser.assignedCounterId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only complete tickets at your assigned counter.'
        });
      }
    }

    const updated = db.updateTicketStatus(id, 'COMPLETED', req.user?.id);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
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

    return res.json({ success: true, ticket: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 8. POST /api/queue/ticket/:id/no-show - Customer didn't appear
router.post('/ticket/:id/no-show', authenticate, authorize('ticket.no_show'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ticket = db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const currentUser = db.getUserById(req.user!.id);
    if (currentUser?.role === 'SERVICE_OFFICER' && currentUser.assignedCounterId) {
      if (ticket.counterId && ticket.counterId !== currentUser.assignedCounterId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only update tickets at your assigned counter.'
        });
      }
    }

    const updated = db.updateTicketStatus(id, 'NO_SHOW', req.user?.id);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'NO_SHOW',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber }
    });

    broadcaster.broadcast('ticket:no-show', { ticket: updated });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_NO_SHOW' });

    return res.json({ success: true, ticket: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 9. POST /api/queue/ticket/:id/transfer - Transfer to another service
router.post('/ticket/:id/transfer', authenticate, authorize('ticket.transfer'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { targetServiceId } = req.body;

    if (!targetServiceId) {
      return res.status(400).json({ success: false, message: 'targetServiceId is required.' });
    }

    const updated = db.transferTicket(id, targetServiceId, req.user?.id);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'TRANSFER_TICKET',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber, targetServiceId }
    });

    broadcaster.broadcast('ticket:transferred', { ticket: updated });
    broadcaster.broadcast('queue:updated', { action: 'TICKET_TRANSFERRED' });

    return res.json({ success: true, ticket: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 10. POST /api/queue/ticket/:id/cancel - Cancel ticket
router.post('/ticket/:id/cancel', authenticate, authorize('ticket.cancel'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updated = db.updateTicketStatus(id, 'CANCELLED', req.user?.id);

    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'CANCEL_TICKET',
      entity: 'QueueTicket',
      entityId: updated.id,
      metadata: { ticketNumber: updated.ticketNumber }
    });

    broadcaster.broadcast('queue:updated', { action: 'TICKET_CANCELLED' });
    return res.json({ success: true, ticket: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 11. POST /api/queue/reset-daily - Reset today's queue (Admin only)
router.post('/reset-daily', authenticate, authorize('queue.manage'), (req: AuthenticatedRequest, res: Response) => {
  try {
    db.resetTodayQueue();
    db.addAuditLog({
      userId: req.user?.id,
      userName: req.user?.name,
      action: 'RESET_QUEUE',
      entity: 'Queue'
    });

    broadcaster.broadcast('queue:updated', { action: 'QUEUE_RESET' });
    return res.json({ success: true, message: 'Queue has been reset for today.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
