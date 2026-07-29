import { Router } from 'express';
import * as supplierController from '../controllers/supplier.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all suppliers (Inventory Manager+)
router.get('/', authorize('suppliers.read'), supplierController.getAll);

// Get single supplier (Inventory Manager+)
router.get('/:id', authorize('suppliers.read'), supplierController.getById);

// Create supplier (Inventory Manager+)
router.post('/', authorize('suppliers.create'), supplierController.create);

// Update supplier (Inventory Manager+)
router.put('/:id', authorize('suppliers.update'), supplierController.update);

// Delete supplier (Admin only)
router.delete('/:id', authorize('suppliers.update'), supplierController.remove);

export default router;
