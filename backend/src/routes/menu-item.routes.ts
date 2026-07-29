import { Router } from 'express';
import * as menuItemController from '../controllers/menu-item.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all items (any authenticated user)
router.get('/', menuItemController.getAll);

// Get single item (any authenticated user)
router.get('/:id', menuItemController.getById);

// Get item variants (any authenticated user)
router.get('/:id/variants', menuItemController.getVariants);

// Get item addons (any authenticated user)
router.get('/:id/addons', menuItemController.getAddons);

// Create item (Manager+)
router.post('/', authorize('menu.create'), menuItemController.create);

// Update item (Manager+)
router.put('/:id', authorize('menu.update'), menuItemController.update);

// Toggle availability (Manager+)
router.patch('/:id/availability', authorize('menu.update'), menuItemController.toggleAvailability);

// Delete item (Admin only)
router.delete('/:id', authorize('menu.delete'), menuItemController.remove);

export default router;
