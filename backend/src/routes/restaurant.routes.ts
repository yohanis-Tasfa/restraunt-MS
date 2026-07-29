import { Router } from 'express';
import * as restaurantController from '../controllers/restaurant.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all restaurants (any authenticated user)
router.get('/', restaurantController.getAll);

// Get single restaurant (any authenticated user)
router.get('/:id', restaurantController.getById);

// Get restaurant branches (any authenticated user)
router.get('/:id/branches', restaurantController.getBranches);

// Create restaurant (Admin only)
router.post('/', authorize('restaurants.create'), restaurantController.create);

// Update restaurant (Admin only)
router.put('/:id', authorize('restaurants.update'), restaurantController.update);

// Delete restaurant (Super Admin only)
router.delete('/:id', authorize('restaurants.delete'), restaurantController.remove);

export default router;
