import apiClient from './client';

export interface RecipeItem {
  id: string;
  menuItemId: string;
  inventoryId: string;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string;
  inventory: {
    id: string;
    name: string;
    unit: string;
    quantity: number;
    minQuantity: number;
    cost?: number;
    category?: string;
  };
}

export interface MenuItemRecipe {
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: number;
  recipeItems: RecipeItem[];
  totalCost: number;
  profitMargin: number;
  profitPercentage: number;
}

export interface MenuItemWithRecipe {
  id: string;
  name: string;
  image?: string;
  price: number;
  cost: number;
  category: {
    id: string;
    name: string;
  };
  ingredientCount: number;
  profitMargin: number;
  profitPercentage: number;
  hasRecipe: boolean;
}

export interface AddRecipeItemInput {
  menuItemId: string;
  inventoryId: string;
  quantity: number;
  unit: string;
}

export interface UpdateRecipeItemInput {
  quantity?: number;
  unit?: string;
}

export interface DuplicateRecipeInput {
  fromMenuItemId: string;
  toMenuItemId: string;
}

const recipesApi = {
  // Get all menu items with recipe information
  getAllMenuItems: async (params?: {
    categoryId?: string;
    search?: string;
  }): Promise<{ success: boolean; data: MenuItemWithRecipe[]; message: string }> => {
    const response = await apiClient.get('/recipes/menu-items', { params });
    return response.data;
  },

  // Get recipe for a specific menu item
  getByMenuItemId: async (menuItemId: string): Promise<{ success: boolean; data: MenuItemRecipe; message: string }> => {
    const response = await apiClient.get(`/recipes/menu-items/${menuItemId}`);
    return response.data;
  },

  // Add a recipe item (ingredient) to a menu item
  addRecipeItem: async (data: AddRecipeItemInput): Promise<{ success: boolean; data: RecipeItem; message: string }> => {
    const response = await apiClient.post('/recipes/items', data);
    return response.data;
  },

  // Update a recipe item
  updateRecipeItem: async (id: string, data: UpdateRecipeItemInput): Promise<{ success: boolean; data: RecipeItem; message: string }> => {
    const response = await apiClient.put(`/recipes/items/${id}`, data);
    return response.data;
  },

  // Delete a recipe item
  deleteRecipeItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/recipes/items/${id}`);
  },

  // Duplicate recipe from one menu item to another
  duplicateRecipe: async (data: DuplicateRecipeInput): Promise<{ success: boolean; data: { message: string; itemsCopied: number }; message: string }> => {
    const response = await apiClient.post('/recipes/duplicate', data);
    return response.data;
  },
};

export default recipesApi;
