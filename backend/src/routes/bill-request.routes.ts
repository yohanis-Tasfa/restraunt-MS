import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
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

// Create bill request: ONLY Waiter, Manager, Owner (Cashiers CANNOT request bills)
router.post('/', requireRole('Waiter', 'Manager', 'Owner'), createBillRequest);

// Process bill request: ONLY Cashier, Manager, Owner (Waiters CANNOT process bills)
router.patch('/:id/process', requireRole('Cashier', 'Manager', 'Owner'), processBillRequest);

// Complete bill request: ONLY Cashier, Manager, Owner (Waiters CANNOT complete bills)
router.patch('/:id/complete', requireRole('Cashier', 'Manager', 'Owner'), completeBillRequest);

// Cancel bill request
router.patch('/:id/cancel', requireRole('Cashier', 'Manager', 'Owner', 'Waiter'), cancelBillRequest);

export default router;
