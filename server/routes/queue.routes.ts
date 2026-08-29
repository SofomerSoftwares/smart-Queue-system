import { Router, Request, Response } from 'express';
import { db } from '../db.js';
import { authenticate, authorize, optionalAuthenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { broadcaster } from '../websocket.js';
import { 
  addisVoiceProvider, 
  buildAmharicAnnouncementText, 
  buildEnglishAnnouncementText, 
  buildPhoneticAnnouncementText,
  getAmharicTicketNumber 
} from '../services/addis-voice.service.js';
import { AnnouncementPayload, PriorityLevel } from '../types.js';

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
    const phoneticText = buildPhoneticAnnouncementText(ticketNumber, counterNumber, serviceNameAmharic || serviceName);
    const ticketAmharic = getAmharicTicketNumber(ticketNumber);

    // Initial announcement payload
    const payload: AnnouncementPayload = {
      ticketNumber,
      ticketNumberAmharic: ticketAmharic,
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
      timestamp: new Date().toISOString()
    };

    // Voice generation text resolution
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
    const getPriorityScore = (t: any): number => {
      if (t.priority === 'URGENT') return 3;
      if (t.priority === 'PRIORITY' || t.isUrgent) return 2;
      return 1;
    };

    const waitingTickets = allTickets
      .filter(t => t.status === 'WAITING')
      .sort((a, b) => {
        const scoreA = getPriorityScore(a);
        const scoreB = getPriorityScore(b);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
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
    const getPriorityScore = (p?: string, isUrg?: boolean) => {
      if (p === 'URGENT') return 3;
      if (p === 'PRIORITY' || isUrg) return 2;
      return 1;
    };

    const allWaitingToday = db.getTickets({ dateKey: today, status: 'WAITING' })
      .sort((a, b) => {
        const scoreA = getPriorityScore(a.priority, a.isUrgent);
        const scoreB = getPriorityScore(b.priority, b.isUrgent);
        if (scoreB !== scoreA) {
          return scoreB - scoreA;
        }
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
        urgencyReason: ticket.urgencyReason,
        isUrgent: ticket.isUrgent,
        priorityFlaggedAt: ticket.priorityFlaggedAt,
        priorityFlaggedBy: ticket.priorityFlaggedBy,
        issuedAt: ticket.issuedAt,
        calledAt: ticket.calledAt,
        counterNumber: ticket.counterNumber,
        counterId: ticket.counterId,
        isCheckedIn: ticket.isCheckedIn ?? false,
        checkedInAt: ticket.checkedInAt,
        customerReview: ticket.customerReview,
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

// 2b. POST /api/queue/ticket/:ticketNumber/checkin - Customer QR check-in / arrival confirmation
router.post('/ticket/:ticketNumber/checkin', (req: Request, res: Response) => {
  try {
    const { ticketNumber } = req.params;
    const ticket = db.checkInTicket(ticketNumber);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `Ticket ${ticketNumber} not found.`,
        code: 'TICKET_NOT_FOUND'
      });
    }

    // Audit log
    db.addAuditLog({
      action: 'CHECK_IN_TICKET',
      entity: 'QueueTicket',
      entityId: ticket.id,
      metadata: { ticketNumber: ticket.ticketNumber, checkedInAt: ticket.checkedInAt }
    });

    // Realtime broadcast to TV displays and Officer stations
    broadcaster.broadcast('ticket:checkedin', {
      ticketId: ticket.id,
      ticketNumber: ticket.ticketNumber,
      checkedInAt: ticket.checkedInAt
    });
    broadcaster.broadcast('queue:updated', {
      action: 'TICKET_CHECKED_IN',
      ticketNumber: ticket.ticketNumber
    });

    return res.json({
      success: true,
      message: 'Arrival check-in confirmed successfully.',
      ticket: {
        ...ticket,
        ticketNumberAmharic: getAmharicTicketNumber(ticket.ticketNumber)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 2c. POST /api/queue/ticket/:ticketNumber/review - Customer satisfaction rating & review submission
router.post('/ticket/:ticketNumber/review', (req: Request, res: Response) => {
  try {
    const { ticketNumber } = req.params;
    const { rating, tags, comment } = req.body;

    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'A rating between 1 and 5 is required.'
      });
    }

    const { review, ticket } = db.addCustomerReview(ticketNumber, {
      rating,
      tags: Array.isArray(tags) ? tags : [],
      comment
    });

    // Broadcast realtime update
    broadcaster.broadcast('queue:updated', {
      action: 'CUSTOMER_REVIEW_SUBMITTED',
      ticketNumber: ticket.ticketNumber,
      rating: review.rating
    });

    return res.json({
      success: true,
      message: 'Customer review submitted successfully. Thank you for your feedback!',
      review,
      ticket: {
        ...ticket,
        ticketNumberAmharic: getAmharicTicketNumber(ticket.ticketNumber)
      }
    });
  } catch (err: any) {
    return res.status(err.message === 'Ticket not found' ? 404 : 500).json({
      success: false,
      message: err.message || 'Failed to submit review'
    });
  }
});

// 2d. GET /api/queue/reviews - List all customer reviews (Recent feedback)
router.get('/reviews', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const reviews = db.getCustomerReviews(limit);
    
    // Compute simple summary
    const total = reviews.length;
    const avgRating = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '5.0';

    return res.json({
      success: true,
      total,
      averageRating: parseFloat(avgRating),
      reviews
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// 3. POST /api/queue/ticket - Receptionist / Kiosk ticket creation (Anonymous self-service or staff logged)
router.post('/ticket', optionalAuthenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { serviceId, priority, urgencyReason, notes } = req.body;

    if (!serviceId) {
      return res.status(400).json({
        success: false,
        message: 'serviceId is required to generate a ticket.'
      });
    }

    let validatedPriority: PriorityLevel = 'NORMAL';
    if (priority === 'URGENT' || priority === 'PRIORITY') {
      if (req.user?.role === 'ADMIN') {
        validatedPriority = priority as PriorityLevel;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Priority and Urgent tickets must be issued by an Administrator (የቅድሚያ እና አስቸኳይ ቲኬት በአስተዳዳሪ (Admin) ብቻ ነው የሚሰጠው).'
        });
      }
    }

    const ticket = db.generateTicket(
      serviceId, 
      validatedPriority, 
      urgencyReason, 
      notes, 
      req.user?.name || req.user?.username || 'Reception'
    );
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
      metadata: { 
        ticketNumber: ticket.ticketNumber, 
        serviceId,
        priority: ticket.priority,
        urgencyReason: ticket.urgencyReason,
        isUrgent: ticket.isUrgent
      }
    });

    // Realtime broadcast
    broadcaster.broadcast('queue:updated', {
      action: 'TICKET_CREATED',
      ticketNumber: ticket.ticketNumber,
      priority: ticket.priority,
      isUrgent: ticket.isUrgent
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
        notice: officeSetting.displayNotice,
        priority: ticket.priority,
        urgencyReason: ticket.urgencyReason,
        isUrgent: ticket.isUrgent
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
          message: `Access denied: You are assigned and limited to Counter ${assignedCounter ? assignedCounter.number : currentUser.assignedCounterId}. (ለእርስዎ የተመደበው መስኮት ብቻ ነው የሚፈቀደው)`
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

// 12. PATCH /api/queue/ticket/:id/priority - Flag urgent/priority ticket (Must be issued/managed by Admin)
router.patch('/ticket/:id/priority', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Ticket priority must be issued and managed by an Administrator (የቅድሚያ ደረጃ መቀየር በአስተዳዳሪ ብቻ የተፈቀደ ነው).'
      });
    }

    const { id } = req.params;
    const { priority, urgencyReason, notes } = req.body;

    if (!priority || !['NORMAL', 'PRIORITY', 'URGENT'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level. Must be NORMAL, PRIORITY, or URGENT.'
      });
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const policy = db.getPriorityPolicy();
    if (priority === 'URGENT' && policy.requireReasonForUrgent && (!urgencyReason || !urgencyReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A specific urgency reason is required by office priority policy for Urgent classification.'
      });
    }

    const flaggedBy = req.user?.name || req.user?.username || 'Staff';
    const updated = db.setTicketPriority(
      id, 
      priority as PriorityLevel, 
      urgencyReason, 
      flaggedBy, 
      notes
    );

    // Audit log
    db.addAuditLog({
      userId: req.user?.id,
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

    // Real-time broadcast
    broadcaster.broadcast('ticket:priority_changed', { ticket: updated });
    broadcaster.broadcast('queue:updated', { 
      action: 'TICKET_PRIORITY_CHANGED', 
      ticketNumber: updated.ticketNumber,
      priority: updated.priority,
      isUrgent: updated.isUrgent
    });

    return res.json({
      success: true,
      ticket: {
        ...updated,
        ticketNumberAmharic: getAmharicTicketNumber(updated.ticketNumber)
      },
      message: `Ticket ${updated.ticketNumber} priority updated to ${updated.priority}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Alias: POST /api/queue/ticket/:id/priority
router.post('/ticket/:id/priority', authenticate, authorize('ticket.priority'), (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { priority, urgencyReason, notes } = req.body;

    if (!priority || !['NORMAL', 'PRIORITY', 'URGENT'].includes(priority)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid priority level. Must be NORMAL, PRIORITY, or URGENT.'
      });
    }

    const ticket = db.getTicketById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }

    const policy = db.getPriorityPolicy();
    if (priority === 'URGENT' && policy.requireReasonForUrgent && (!urgencyReason || !urgencyReason.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A specific urgency reason is required by office priority policy for Urgent classification.'
      });
    }

    const flaggedBy = req.user?.name || req.user?.username || 'Staff';
    const updated = db.setTicketPriority(
      id, 
      priority as PriorityLevel, 
      urgencyReason, 
      flaggedBy, 
      notes
    );

    // Audit log
    db.addAuditLog({
      userId: req.user?.id,
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

    // Real-time broadcast
    broadcaster.broadcast('ticket:priority_changed', { ticket: updated });
    broadcaster.broadcast('queue:updated', { 
      action: 'TICKET_PRIORITY_CHANGED', 
      ticketNumber: updated.ticketNumber,
      priority: updated.priority,
      isUrgent: updated.isUrgent
    });

    return res.json({
      success: true,
      ticket: {
        ...updated,
        ticketNumberAmharic: getAmharicTicketNumber(updated.ticketNumber)
      },
      message: `Ticket ${updated.ticketNumber} priority updated to ${updated.priority}.`
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
