import { Router } from 'express';
import * as purchaseOrderController from '../controllers/purchase-order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all purchase orders (Inventory Manager+)
router.get('/', authorize('purchases.read'), purchaseOrderController.getAll);

// Get single purchase order (Inventory Manager+)
router.get('/:id', authorize('purchases.read'), purchaseOrderController.getById);

// Create purchase order (Inventory Manager+)
router.post('/', authorize('purchases.create'), purchaseOrderController.create);

// Update purchase order (Inventory Manager+)
router.put('/:id', authorize('purchases.update'), purchaseOrderController.update);

// Update purchase order status (Inventory Manager+)
router.patch('/:id/status', authorize('purchases.update'), purchaseOrderController.updateStatus);

// Receive goods (Inventory Manager+)
router.post('/:id/receive', authorize('purchases.update'), purchaseOrderController.receiveGoods);

// Cancel purchase order (Manager+)
router.post('/:id/cancel', authorize('purchases.update'), purchaseOrderController.cancel);

export default router;
