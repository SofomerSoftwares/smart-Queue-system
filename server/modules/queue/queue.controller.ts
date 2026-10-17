import { Request, Response, NextFunction } from 'express';
import { queueService } from './queue.service.js';
import { AuthenticatedRequest } from '../../middleware/auth.js';
import { db } from '../../db.js';

export class QueueController {
  public getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const state = queueService.getQueueState();
      return res.json({
        success: true,
        ...state
      });
    } catch (err) {
      next(err);
    }
  }

  public getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, serviceId, dateKey } = req.query;
      const tickets = queueService.getTickets({
        status: status ? String(status) : undefined,
        serviceId: serviceId ? String(serviceId) : undefined,
        dateKey: dateKey ? String(dateKey) : undefined
      });
      return res.json({ success: true, tickets });
    } catch (err) {
      next(err);
    }
  }

  public createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const authReq = req as AuthenticatedRequest;
      const { serviceId, priority, urgencyReason, notes } = req.body;
      const result = queueService.createTicket({
        serviceId,
        priority,
        urgencyReason,
        notes,
        userId: authReq.user?.id,
        userName: authReq.user?.name || authReq.user?.username
      });

      return res.status(201).json({
        success: true,
        ticket: result.ticket,
        printData: result.printData
      });
    } catch (err) {
      next(err);
    }
  }

  public checkIn(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = queueService.checkIn(id);
      return res.json({
        success: true,
        ticket,
        message: `Welcome! Ticket ${ticket.ticketNumber} is confirmed and checked in.`
      });
    } catch (err) {
      next(err);
    }
  }

  public async callNext(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { counterId, targetServiceId, customAudioBase64, customAudioMimeType, customText } = req.body;
      const result = await queueService.callNext({
        counterId,
        targetServiceId,
        customAudioBase64,
        customAudioMimeType,
        customText,
        user: req.user
      });

      if (result.noTicket) {
        return res.status(200).json({
          success: false,
          message: result.message
        });
      }

      return res.json({
        success: true,
        ticket: result.calledTicket,
        counter: result.counter
      });
    } catch (err) {
      next(err);
    }
  }

  public recall(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { customAudioBase64, customAudioMimeType, customText } = req.body;
      const ticket = queueService.recall(id, {
        customAudioBase64,
        customAudioMimeType,
        customText,
        user: req.user
      });
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public callWithVoice(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { audioBase64, mimeType = 'audio/webm', customText } = req.body;
      const ticket = db.getTicketById(id);

      if (!ticket) {
        return res.status(404).json({ success: false, message: 'Ticket not found.' });
      }

      const counter = ticket.counterId ? db.getCounterById(ticket.counterId) : undefined;
      const counterNumber = counter ? counter.number : (ticket.counterNumber || 1);

      queueService.triggerVoiceAnnouncement(
        ticket.ticketNumber,
        counterNumber,
        ticket.serviceName,
        ticket.serviceNameAmharic,
        audioBase64,
        mimeType,
        req.user?.name || req.user?.username,
        customText
      );

      return res.json({
        success: true,
        message: `Personal voice call for Ticket ${ticket.ticketNumber} broadcasted successfully.`,
        ticket
      });
    } catch (err) {
      next(err);
    }
  }

  public startServing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = queueService.startServing(id, req.user);
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public completeServing(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = queueService.completeServing(id, req.user);
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public noShow(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = queueService.noShow(id, req.user);
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public transfer(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { targetServiceId, targetCounterId } = req.body;
      const ticket = queueService.transfer(id, {
        targetServiceId,
        targetCounterId,
        user: req.user
      });
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public hold(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = queueService.hold(id, req.user);
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public resume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = queueService.resume(id, req.user);
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public cancel(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const ticket = queueService.cancel(id, req.user);
      return res.json({ success: true, ticket });
    } catch (err) {
      next(err);
    }
  }

  public resetDaily(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      queueService.resetDaily(req.user);
      return res.json({ success: true, message: 'Queue has been reset for today.' });
    } catch (err) {
      next(err);
    }
  }

  public updatePriority(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { priority, urgencyReason, notes } = req.body;
      const result = queueService.updatePriority(id, {
        priority,
        urgencyReason,
        notes,
        user: req.user
      });
      return res.json({
        success: true,
        ticket: result,
        message: `Ticket ${result.ticketNumber} priority updated to ${result.priority}.`
      });
    } catch (err) {
      next(err);
    }
  }

  public updateCounterStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, isBreak } = req.body;
      const counter = queueService.updateCounterStatus(id, status, isBreak, req.user);
      return res.json({ success: true, counter });
    } catch (err) {
      next(err);
    }
  }

  public addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = queueService.addReview(req.body);
      return res.status(201).json({
        success: true,
        message: 'Customer review submitted successfully. Thank you for your feedback!',
        review
      });
    } catch (err) {
      next(err);
    }
  }

  public getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = queueService.getReviews();
      return res.json({
        success: true,
        reviews
      });
    } catch (err) {
      next(err);
    }
  }
}

export const queueController = new QueueController();
