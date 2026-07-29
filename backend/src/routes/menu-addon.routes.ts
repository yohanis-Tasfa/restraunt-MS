import { Router } from 'express';
import * as menuAddonController from '../controllers/menu-addon.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all addons (any authenticated user)
router.get('/', menuAddonController.getAll);

// Get single addon (any authenticated user)
router.get('/:id', menuAddonController.getById);

// Create addon (Manager+)
router.post('/', authorize('menu.create'), menuAddonController.create);

// Update addon (Manager+)
router.put('/:id', authorize('menu.update'), menuAddonController.update);

// Delete addon (Manager+)
router.delete('/:id', authorize('menu.delete'), menuAddonController.remove);

export default router;
