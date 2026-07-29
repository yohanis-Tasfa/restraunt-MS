import { Router } from 'express';
import * as menuVariantController from '../controllers/menu-variant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all variants (any authenticated user)
router.get('/', menuVariantController.getAll);

// Get single variant (any authenticated user)
router.get('/:id', menuVariantController.getById);

// Create variant (Manager+)
router.post('/', authorize('menu.create'), menuVariantController.create);

// Update variant (Manager+)
router.put('/:id', authorize('menu.update'), menuVariantController.update);

// Delete variant (Manager+)
router.delete('/:id', authorize('menu.delete'), menuVariantController.remove);

export default router;
