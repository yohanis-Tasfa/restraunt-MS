import { Router } from 'express';
import * as purchaseOrderController from '../controllers/purchase-order.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

const poRoles = ['Super Admin', 'Admin', 'Manager', 'Inventory Manager', 'purchases.read'];
const poWriteRoles = ['Super Admin', 'Admin', 'Manager', 'Inventory Manager', 'purchases.create', 'purchases.update'];

// Get all purchase orders (Manager/Inventory Manager+)
router.get('/', authorize(poRoles), purchaseOrderController.getAll);

// Get single purchase order
router.get('/:id', authorize(poRoles), purchaseOrderController.getById);

// Create purchase order
router.post('/', authorize(poWriteRoles), purchaseOrderController.create);

// Update purchase order
router.put('/:id', authorize(poWriteRoles), purchaseOrderController.update);

// Update purchase order status
router.patch('/:id/status', authorize(poWriteRoles), purchaseOrderController.updateStatus);

// Receive goods
router.post('/:id/receive', authorize(poWriteRoles), purchaseOrderController.receiveGoods);

// Cancel purchase order
router.post('/:id/cancel', authorize(poWriteRoles), purchaseOrderController.cancel);

export default router;
