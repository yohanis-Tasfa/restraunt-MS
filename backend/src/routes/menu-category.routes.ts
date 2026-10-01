import { Router } from 'express';
import * as menuCategoryController from '../controllers/menu-category.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes (no authentication required)
// Get all categories (public - for customers viewing menu)
router.get('/', menuCategoryController.getAll);

// Get category tree (public - for customers viewing menu)
router.get('/tree', menuCategoryController.getTree);

// Get single category (public - for customers viewing menu)
router.get('/:id', menuCategoryController.getById);

// Get category items (public - for customers viewing menu)
router.get('/:id/items', menuCategoryController.getCategoryItems);

// Protected routes (authentication required)
router.use(authenticate);

// Create category (Manager+)
router.post('/', authorize('menu.create'), menuCategoryController.create);

// Update category (Manager+)
router.put('/:id', authorize('menu.update'), menuCategoryController.update);

// Delete category (Admin only)
router.delete('/:id', authorize('menu.delete'), menuCategoryController.remove);

export default router;
