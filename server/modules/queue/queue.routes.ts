import { Router } from 'express';
import { queueController } from './queue.controller.js';
import { authenticate, authorize } from '../../middleware/auth.js';

const router = Router();

// State and tickets listing
router.get('/state', (req, res, next) => queueController.getStatus(req, res, next));
router.get('/status', (req, res, next) => queueController.getStatus(req, res, next));
router.get('/tickets', (req, res, next) => queueController.getTickets(req, res, next));

// Ticket creation and check-in
router.post('/ticket', (req, res, next) => queueController.createTicket(req, res, next));
router.post('/ticket/:id/checkin', (req, res, next) => queueController.checkIn(req, res, next));

// Officer station actions
router.post('/call-next', authenticate, authorize('ticket.call'), (req, res, next) => queueController.callNext(req as any, res, next));
router.post('/ticket/:id/recall', authenticate, authorize('ticket.recall'), (req, res, next) => queueController.recall(req as any, res, next));
router.post('/ticket/:id/call-with-voice', authenticate, authorize('ticket.call'), (req, res, next) => queueController.callWithVoice(req as any, res, next));
router.post('/ticket/:id/start', authenticate, authorize('ticket.start'), (req, res, next) => queueController.startServing(req as any, res, next));
router.post('/ticket/:id/complete', authenticate, authorize('ticket.complete'), (req, res, next) => queueController.completeServing(req as any, res, next));
router.post('/ticket/:id/no-show', authenticate, authorize('ticket.no_show'), (req, res, next) => queueController.noShow(req as any, res, next));
router.post('/ticket/:id/transfer', authenticate, authorize('ticket.transfer'), (req, res, next) => queueController.transfer(req as any, res, next));
router.post('/ticket/:id/hold', authenticate, authorize('ticket.start'), (req, res, next) => queueController.hold(req as any, res, next));
router.post('/ticket/:id/resume', authenticate, authorize('ticket.start'), (req, res, next) => queueController.resume(req as any, res, next));
router.post('/ticket/:id/cancel', authenticate, authorize('ticket.cancel'), (req, res, next) => queueController.cancel(req as any, res, next));

// Priority triage
router.patch('/ticket/:id/priority', authenticate, (req, res, next) => queueController.updatePriority(req as any, res, next));
router.post('/ticket/:id/priority', authenticate, authorize('ticket.priority'), (req, res, next) => queueController.updatePriority(req as any, res, next));

// Counter status
router.post('/counter/:id/status', authenticate, (req, res, next) => queueController.updateCounterStatus(req as any, res, next));

// Admin operations
router.post('/reset-daily', authenticate, authorize('queue.manage'), (req, res, next) => queueController.resetDaily(req as any, res, next));

// Reviews
router.post('/review', (req, res, next) => queueController.addReview(req, res, next));
router.get('/reviews', (req, res, next) => queueController.getReviews(req, res, next));

export default router;
