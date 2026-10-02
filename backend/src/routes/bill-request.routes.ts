import { Router } from 'express';
import * as billRequestController from '../controllers/bill-request.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public route - customer creates bill request
router.post('/', billRequestController.createBillRequest);

// Protected routes - require authentication
router.get('/pending', authenticate, billRequestController.getPendingBillRequests);
router.get('/all', authenticate, billRequestController.getAllPendingBillRequests);
router.get('/:id', authenticate, billRequestController.getBillRequestById);
router.patch('/:id/acknowledge', authenticate, billRequestController.acknowledgeBillRequest);
router.patch('/:id/complete', authenticate, billRequestController.completeBillRequest);

export default router;
