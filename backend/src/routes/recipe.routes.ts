import { Router } from 'express';
import { recipeController } from '../controllers/recipe.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all menu items with recipe information
router.get('/menu-items', recipeController.getAllMenuItems);

// Get recipe for a specific menu item
router.get('/menu-items/:menuItemId', recipeController.getByMenuItemId);

// Add a recipe item to a menu item
router.post('/items', recipeController.addRecipeItem);

// Update a recipe item
router.put('/items/:id', recipeController.updateRecipeItem);

// Delete a recipe item
router.delete('/items/:id', recipeController.deleteRecipeItem);

// Duplicate recipe
router.post('/duplicate', recipeController.duplicateRecipe);

export default router;
