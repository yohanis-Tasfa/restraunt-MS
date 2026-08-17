import { Router } from 'express';
import { waiterCallController } from '../controllers/waiter-call.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (for customers)

// Create a new waiter call (customer calls waiter)
router.post('/', waiterCallController.createCall);

// Protected routes (for staff)
router.use(authenticate);

// Get call by ID
router.get('/:id', waiterCallController.getCall);

// Get calls for a waiter (FIFO queue)
router.get('/waiter/:waiterId', waiterCallController.getCallsForWaiter);

// Get calls for a session
router.get('/session/:sessionId', waiterCallController.getCallsForSession);

// Get pending calls for a branch
router.get('/branch/:branchId/pending', waiterCallController.getPendingCallsByBranch);

// Get call statistics
router.get('/stats/all', waiterCallController.getCallStats);

// Update call status (acknowledge, complete)
router.put('/:id/status', waiterCallController.updateCallStatus);

// Cancel call
router.post('/:id/cancel', waiterCallController.cancelCall);

export default router;
