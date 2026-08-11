import { Request, Response } from 'express';
import { RecipeService } from '../services/recipe.service';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const recipeService = new RecipeService();

export const recipeController = {
  // Get all menu items with recipe information
  getAllMenuItems: asyncHandler(async (req: Request, res: Response) => {
    const { categoryId, search } = req.query;

    const menuItems = await recipeService.getAllMenuItemsWithRecipes({
      categoryId: categoryId as string,
      search: search as string,
    });

    res.status(200).json(
      new ApiResponse(200, menuItems, 'Menu items with recipes fetched successfully')
    );
  }),

  // Get recipe for a specific menu item
  getByMenuItemId: asyncHandler(async (req: Request, res: Response) => {
    const { menuItemId } = req.params;

    const recipe = await recipeService.getByMenuItemId(menuItemId);

    res.status(200).json(
      new ApiResponse(200, recipe, 'Recipe fetched successfully')
    );
  }),

  // Add a recipe item (ingredient) to a menu item
  addRecipeItem: asyncHandler(async (req: Request, res: Response) => {
    const { menuItemId, inventoryId, quantity, unit } = req.body;

    if (!menuItemId || !inventoryId || !quantity || !unit) {
      throw new ApiError(400, 'Menu item, inventory item, quantity, and unit are required');
    }

    const recipeItem = await recipeService.addRecipeItem({
      menuItemId,
      inventoryId,
      quantity: parseFloat(quantity),
      unit,
    });

    res.status(201).json(
      new ApiResponse(201, recipeItem, 'Recipe item added successfully')
    );
  }),

  // Update a recipe item
  updateRecipeItem: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { quantity, unit } = req.body;

    const recipeItem = await recipeService.updateRecipeItem(id, {
      quantity: quantity ? parseFloat(quantity) : undefined,
      unit,
    });

    res.status(200).json(
      new ApiResponse(200, recipeItem, 'Recipe item updated successfully')
    );
  }),

  // Delete a recipe item
  deleteRecipeItem: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await recipeService.deleteRecipeItem(id);

    res.status(200).json(
      new ApiResponse(200, null, 'Recipe item deleted successfully')
    );
  }),

  // Duplicate recipe from one menu item to another
  duplicateRecipe: asyncHandler(async (req: Request, res: Response) => {
    const { fromMenuItemId, toMenuItemId } = req.body;

    if (!fromMenuItemId || !toMenuItemId) {
      throw new ApiError(400, 'Source and destination menu items are required');
    }

    const result = await recipeService.duplicateRecipe(fromMenuItemId, toMenuItemId);

    res.status(200).json(
      new ApiResponse(200, result, 'Recipe duplicated successfully')
    );
  }),
};
