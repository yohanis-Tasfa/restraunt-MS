import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all payments (Cashier+)
router.get('/', authorize('payments.create'), paymentController.getAll);

// Get payment summary (Manager+)
router.get('/stats/summary', authorize('reports.read'), paymentController.getSummary);

// Get single payment (Cashier+)
router.get('/:id', authorize('payments.create'), paymentController.getById);

// Process payment (Cashier+)
router.post('/', authorize('payments.create'), paymentController.create);

// Refund payment (Manager+)
router.post('/:id/refund', authorize('orders.cancel'), paymentController.refund);

export default router;
