import { ApiError } from '../utils/ApiError';
import prisma from '../config/database';

interface AddRecipeItemData {
  menuItemId: string;
  inventoryId: string;
  quantity: number;
  unit: string;
}

interface UpdateRecipeItemData {
  quantity?: number;
  unit?: string;
}

export class RecipeService {
  // Get all recipe items for a menu item
  async getByMenuItemId(menuItemId: string) {
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: menuItemId },
    });

    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    const recipeItems = await prisma.recipeItem.findMany({
      where: { menuItemId },
      include: {
        inventory: {
          select: {
            id: true,
            name: true,
            unit: true,
            quantity: true,
            minQuantity: true,
            cost: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Calculate total cost
    const totalCost = recipeItems.reduce((sum, item) => {
      const cost = (item.inventory.cost || 0) * item.quantity;
      return sum + cost;
    }, 0);

    return {
      menuItemId,
      menuItemName: menuItem.name,
      menuItemPrice: menuItem.price,
      recipeItems,
      totalCost,
      profitMargin: menuItem.price - totalCost,
      profitPercentage: menuItem.price > 0 ? ((menuItem.price - totalCost) / menuItem.price * 100) : 0,
    };
  }

  // Add a recipe item
  async addRecipeItem(data: AddRecipeItemData) {
    // Check if menu item exists
    const menuItem = await prisma.menuItem.findUnique({
      where: { id: data.menuItemId },
    });

    if (!menuItem) {
      throw new ApiError(404, 'Menu item not found');
    }

    // Check if inventory item exists
    const inventory = await prisma.inventory.findUnique({
      where: { id: data.inventoryId },
    });

    if (!inventory) {
      throw new ApiError(404, 'Inventory item not found');
    }

    // Check if this ingredient is already in the recipe
    const existing = await prisma.recipeItem.findFirst({
      where: {
        menuItemId: data.menuItemId,
        inventoryId: data.inventoryId,
      },
    });

    if (existing) {
      throw new ApiError(400, 'This ingredient is already in the recipe. Update it instead.');
    }

    // Validate quantity
    if (data.quantity <= 0) {
      throw new ApiError(400, 'Quantity must be greater than 0');
    }

    const recipeItem = await prisma.recipeItem.create({
      data: {
        menuItemId: data.menuItemId,
        inventoryId: data.inventoryId,
        quantity: data.quantity,
        unit: data.unit,
      },
      include: {
        inventory: {
          select: {
            id: true,
            name: true,
            unit: true,
            cost: true,
            category: true,
          },
        },
      },
    });

    // Calculate updated menu item cost
    const updatedRecipe = await this.getByMenuItemId(data.menuItemId);

    // Optionally update menu item cost
    await prisma.menuItem.update({
      where: { id: data.menuItemId },
      data: { cost: updatedRecipe.totalCost },
    });

    return recipeItem;
  }

  // Update a recipe item
  async updateRecipeItem(id: string, data: UpdateRecipeItemData) {
    const existing = await prisma.recipeItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Recipe item not found');
    }

    // Validate quantity
    if (data.quantity !== undefined && data.quantity <= 0) {
      throw new ApiError(400, 'Quantity must be greater than 0');
    }

    const updated = await prisma.recipeItem.update({
      where: { id },
      data,
      include: {
        inventory: {
          select: {
            id: true,
            name: true,
            unit: true,
            cost: true,
            category: true,
          },
        },
      },
    });

    // Update menu item cost
    const updatedRecipe = await this.getByMenuItemId(existing.menuItemId);
    await prisma.menuItem.update({
      where: { id: existing.menuItemId },
      data: { cost: updatedRecipe.totalCost },
    });

    return updated;
  }

  // Delete a recipe item
  async deleteRecipeItem(id: string) {
    const existing = await prisma.recipeItem.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError(404, 'Recipe item not found');
    }

    await prisma.recipeItem.delete({
      where: { id },
    });

    // Update menu item cost
    const updatedRecipe = await this.getByMenuItemId(existing.menuItemId);
    await prisma.menuItem.update({
      where: { id: existing.menuItemId },
      data: { cost: updatedRecipe.totalCost },
    });

    return { message: 'Recipe item deleted successfully' };
  }

  // Get all menu items with recipe information
  async getAllMenuItemsWithRecipes(params: { categoryId?: string; search?: string } = {}) {
    const where: any = {};

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        recipeItems: {
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
                unit: true,
                cost: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate costs for each menu item
    const itemsWithCosts = menuItems.map(item => {
      const totalCost = item.recipeItems.reduce((sum, recipeItem) => {
        const cost = (recipeItem.inventory.cost || 0) * recipeItem.quantity;
        return sum + cost;
      }, 0);

      return {
        id: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        cost: totalCost,
        category: item.category,
        ingredientCount: item.recipeItems.length,
        profitMargin: item.price - totalCost,
        profitPercentage: item.price > 0 ? ((item.price - totalCost) / item.price * 100) : 0,
        hasRecipe: item.recipeItems.length > 0,
      };
    });

    return itemsWithCosts;
  }

  // Duplicate recipe from one menu item to another
  async duplicateRecipe(fromMenuItemId: string, toMenuItemId: string) {
    // Check if source menu item exists
    const fromMenuItem = await prisma.menuItem.findUnique({
      where: { id: fromMenuItemId },
      include: {
        recipeItems: true,
      },
    });

    if (!fromMenuItem) {
      throw new ApiError(404, 'Source menu item not found');
    }

    if (fromMenuItem.recipeItems.length === 0) {
      throw new ApiError(400, 'Source menu item has no recipe');
    }

    // Check if destination menu item exists
    const toMenuItem = await prisma.menuItem.findUnique({
      where: { id: toMenuItemId },
    });

    if (!toMenuItem) {
      throw new ApiError(404, 'Destination menu item not found');
    }

    // Delete existing recipe items for destination
    await prisma.recipeItem.deleteMany({
      where: { menuItemId: toMenuItemId },
    });

    // Copy recipe items
    const newRecipeItems = await Promise.all(
      fromMenuItem.recipeItems.map(item =>
        prisma.recipeItem.create({
          data: {
            menuItemId: toMenuItemId,
            inventoryId: item.inventoryId,
            quantity: item.quantity,
            unit: item.unit,
          },
        })
      )
    );

    // Update destination menu item cost
    const updatedRecipe = await this.getByMenuItemId(toMenuItemId);
    await prisma.menuItem.update({
      where: { id: toMenuItemId },
      data: { cost: updatedRecipe.totalCost },
    });

    return {
      message: 'Recipe duplicated successfully',
      itemsCopied: newRecipeItems.length,
    };
  }
}
