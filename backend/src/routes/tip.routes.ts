import { Router } from 'express';
import * as tipController from '../controllers/tip.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all tips (Manager/Owner+)
router.get('/', authorize('reports.read'), tipController.getAll);

// Get tip summary (Manager/Owner+)
router.get('/stats/summary', authorize('reports.read'), tipController.getTipSummary);

// Get pending payout amount (Manager/Owner+)
router.get('/stats/pending-payout', authorize('reports.read'), tipController.getPendingPayoutAmount);

// Get my tips (Waiter)
router.get('/my-tips', authorize('orders.read'), tipController.getMyTips);

// Get my tip summary (Waiter)
router.get('/my-tips/summary', authorize('orders.read'), tipController.getMyTipSummary);

// Get single tip (Manager/Owner+)
router.get('/:id', authorize('reports.read'), tipController.getById);

// Mark tip as paid (Manager/Cashier+)
router.patch('/:id/mark-paid', authorize('payments.create'), tipController.markAsPaid);

export default router;
