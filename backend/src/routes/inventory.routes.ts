import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all inventory items (any authenticated user)
router.get('/', inventoryController.getAll);

// Get low stock items (Manager+)
router.get('/low-stock', authorize('inventory.read'), inventoryController.getLowStock);

// Get expiring items (Manager+)
router.get('/expiring', authorize('inventory.read'), inventoryController.getExpiring);

// Get inventory categories (any authenticated user)
router.get('/categories', inventoryController.getCategories);

// Get single inventory item (any authenticated user)
router.get('/:id', inventoryController.getById);

// Get inventory movements (Manager+)
router.get('/:id/movements', authorize('inventory.read'), inventoryController.getMovements);

// Create inventory item (Inventory Manager+)
router.post('/', authorize('inventory.create'), inventoryController.create);

// Update inventory item (Inventory Manager+)
router.put('/:id', authorize('inventory.update'), inventoryController.update);

// Add inventory movement (Inventory Manager+)
router.post('/:id/movement', authorize('inventory.update'), inventoryController.addMovement);

// Delete inventory item (Admin only)
router.delete('/:id', authorize('inventory.delete'), inventoryController.remove);

export default router;
