import { Router } from 'express';
import * as menuItemController from '../controllers/menu-item.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
// Get all items (public - for customers viewing menu)
router.get('/', menuItemController.getAll);

// Get single item (public - for customers viewing menu)
router.get('/:id', menuItemController.getById);

// Get item variants (public - for customers viewing menu)
router.get('/:id/variants', menuItemController.getVariants);

// Get item addons (public - for customers viewing menu)
router.get('/:id/addons', menuItemController.getAddons);

// Protected routes (authentication required)
router.use(authenticate);

// Create item (Manager+)
router.post('/', authorize('menu.create'), menuItemController.create);

// Update item (Manager+)
router.put('/:id', authorize('menu.update'), menuItemController.update);

// Toggle availability (Manager+)
router.patch('/:id/availability', authorize('menu.update'), menuItemController.toggleAvailability);

// Delete item (Admin only)
router.delete('/:id', authorize('menu.delete'), menuItemController.remove);

export default router;
