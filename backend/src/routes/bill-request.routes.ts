import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getBillRequests,
  getBillRequest,
  createBillRequest,
  processBillRequest,
  completeBillRequest,
  cancelBillRequest,
  getPendingCount,
} from '../controllers/bill-request.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all bill requests (with filtering)
router.get('/', getBillRequests);

// Get pending count
router.get('/pending-count', getPendingCount);

// Get single bill request
router.get('/:id', getBillRequest);

// Create bill request (Waiter)
router.post('/', createBillRequest);

// Process bill request (Cashier starts working on it)
router.patch('/:id/process', processBillRequest);

// Complete bill request (Cashier finished generating bill)
router.patch('/:id/complete', completeBillRequest);

// Cancel bill request
router.patch('/:id/cancel', cancelBillRequest);

export default router;
