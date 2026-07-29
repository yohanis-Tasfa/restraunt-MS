import { Router } from 'express';
import * as menuCategoryController from '../controllers/menu-category.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all categories (any authenticated user)
router.get('/', menuCategoryController.getAll);

// Get category tree (any authenticated user)
router.get('/tree', menuCategoryController.getTree);

// Get single category (any authenticated user)
router.get('/:id', menuCategoryController.getById);

// Get category items (any authenticated user)
router.get('/:id/items', menuCategoryController.getCategoryItems);

// Create category (Manager+)
router.post('/', authorize('menu.create'), menuCategoryController.create);

// Update category (Manager+)
router.put('/:id', authorize('menu.update'), menuCategoryController.update);

// Delete category (Admin only)
router.delete('/:id', authorize('menu.delete'), menuCategoryController.remove);

export default router;
