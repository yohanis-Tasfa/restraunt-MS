import { Router } from 'express';
import { waiterCallController } from '../controllers/waiter-call.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (for customers)

// Create a new waiter call (customer calls waiter)
router.post('/', waiterCallController.createCall);

// Protected routes (for staff)
router.use(authenticate);

// Get all calls with filters (must be before /:id)
router.get('/', waiterCallController.getAllCalls);

// Get active calls (PENDING or ACKNOWLEDGED)
router.get('/active', waiterCallController.getActiveCalls);

// Get call statistics
router.get('/stats', waiterCallController.getCallStats);

// Get call by ID
router.get('/:id', waiterCallController.getCall);

// Get calls for a table
router.get('/table/:tableId', waiterCallController.getCallsForTable);

// Get calls for a waiter (FIFO queue)
router.get('/waiter/:waiterId', waiterCallController.getCallsForWaiter);

// Get calls for a session
router.get('/session/:sessionId', waiterCallController.getCallsForSession);

// Get pending calls for a branch
router.get('/branch/:branchId/pending', waiterCallController.getPendingCallsByBranch);

// Acknowledge call
router.post('/:id/acknowledge', waiterCallController.acknowledgeCall);

// Complete call
router.post('/:id/complete', waiterCallController.completeCall);

// Cancel call
router.post('/:id/cancel', waiterCallController.cancelCall);

// Update call notes
router.patch('/:id/notes', waiterCallController.updateNotes);

// Update call status (acknowledge, complete)
router.put('/:id/status', waiterCallController.updateCallStatus);

export default router;
