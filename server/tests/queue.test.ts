import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import { db } from '../db.js';
import { queueService } from '../modules/queue/queue.service.js';
import { notificationService } from '../modules/notifications/notification.service.js';
import { authService } from '../modules/auth/auth.service.js';
import { 
  buildAmharicAnnouncementText, 
  buildEnglishAnnouncementText,
  getAmharicTicketNumber 
} from '../services/addis-voice.service.js';

describe('SmartQ Queue Management System - Core Business Rules', () => {
  beforeEach(() => {
    db.resetTodayQueue();
  });

  test('Ticket Generation: sequentially assigns daily ticket prefix and number', () => {
    const services = db.getServices().filter(s => s.isActive);
    assert.ok(services.length > 0, 'Expected at least one active service');

    const service = services[0];
    const ticket1 = queueService.createTicket({ serviceId: service.id, priority: 'NORMAL' });
    const ticket2 = queueService.createTicket({ serviceId: service.id, priority: 'NORMAL' });

    assert.ok(ticket1.ticket.ticketNumber.startsWith(service.prefix));
    assert.ok(ticket2.ticket.ticketNumber.startsWith(service.prefix));
    assert.strictEqual(ticket1.ticket.status, 'WAITING');
    assert.strictEqual(ticket2.ticket.status, 'WAITING');
    assert.strictEqual(ticket2.ticket.sequenceNumber, ticket1.ticket.sequenceNumber + 1);
  });

  test('Queue Priority Ordering: URGENT and PRIORITY tickets take precedence over NORMAL', async () => {
    const service = db.getServices()[0];
    const counter = db.getCounters()[0];

    // Create normal ticket first
    const normal = queueService.createTicket({ serviceId: service.id, priority: 'NORMAL' });
    // Create urgent ticket second
    const urgent = queueService.createTicket({ 
      serviceId: service.id, 
      priority: 'URGENT', 
      urgencyReason: 'Medical Emergency' 
    });

    const mockOfficer = { id: 'usr-officer-1', name: 'Officer Test', role: 'ADMIN' };
    const callResult = await queueService.callNext({
      counterId: counter.id,
      user: mockOfficer
    });

    assert.ok(callResult.calledTicket, 'Expected a ticket to be called');
    // Urgent ticket must be called first even though normal was issued first
    assert.strictEqual(callResult.calledTicket.id, urgent.ticket.id);
    assert.strictEqual(callResult.calledTicket.priority, 'URGENT');
    assert.strictEqual(callResult.calledTicket.status, 'CALLED');
  });

  test('Ticket Lifecycle: Start -> Hold -> Resume -> Complete', () => {
    const service = db.getServices()[0];
    const created = queueService.createTicket({ serviceId: service.id, priority: 'NORMAL' });
    const mockOfficer = { id: 'usr-officer-1', name: 'Officer Test', role: 'ADMIN' };

    // Start serving
    const started = queueService.startServing(created.ticket.id, mockOfficer);
    assert.strictEqual(started.status, 'SERVING');
    assert.ok(started.serviceStartedAt);

    // Hold ticket
    const held = queueService.hold(created.ticket.id, mockOfficer);
    assert.strictEqual(held.status, 'HOLD');

    // Resume ticket
    const resumed = queueService.resume(created.ticket.id, mockOfficer);
    assert.strictEqual(resumed.status, 'SERVING');

    // Complete ticket
    const completed = queueService.completeServing(created.ticket.id, mockOfficer);
    assert.strictEqual(completed.status, 'COMPLETED');
    assert.ok(completed.completedAt);
    assert.ok(completed.serviceDurationSeconds !== undefined);
  });

  test('Reception Notifications: Unread count tracking and mark all read', () => {
    const initialUnread = notificationService.getUnreadCount();
    
    // Create notification
    const notif = db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_CALLED',
      title: 'Queue Number Called',
      message: 'Counter 01 called ticket A-001',
      ticketNumber: 'A-001',
      counterNumber: 1
    });

    assert.strictEqual(notificationService.getUnreadCount(), initialUnread + 1);

    // Mark single as read
    notificationService.markAsRead(notif.id);
    assert.strictEqual(notificationService.getUnreadCount(), initialUnread);

    // Mark all as read
    db.createNotification({
      recipientRole: 'RECEPTION',
      branchId: 'main-branch',
      type: 'TICKET_COMPLETED',
      title: 'Ticket Completed',
      message: 'Counter 01 completed ticket A-001'
    });
    assert.ok(notificationService.getUnreadCount() > 0);

    notificationService.markAllAsRead();
    assert.strictEqual(notificationService.getUnreadCount(), 0);
  });

  test('Bilingual Announcement Text Generation', () => {
    const enText = buildEnglishAnnouncementText('A-025', 2, 'Registration');
    const amText = buildAmharicAnnouncementText('A-025', 2, 'ምዝገባ');
    const amTicketNum = getAmharicTicketNumber('A-025');

    assert.ok(enText.includes('ticket number') && enText.includes('Counter 2'));
    assert.ok(amText.includes('የወረፋ ቁጥር') && amText.includes('መስኮት 2'));
    assert.ok(amTicketNum.length > 0);
  });
});
