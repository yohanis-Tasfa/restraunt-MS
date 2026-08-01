import apiClient from './client';

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  restaurantId: string;
}

export interface MenuVariant {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuAddon {
  id: string;
  name: string;
  price: number;
  isAvailable: boolean;
}

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  categoryId: string;
  category?: MenuCategory;
  isAvailable: boolean;
  preparationTime?: number;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

export interface CreateCategoryInput {
  name: string;
  description?: string;
  restaurantId: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  parentId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateMenuItemInput {
  name: string;
  description?: string;
  image?: string;
  price: number;
  cost?: number;
  categoryId: string;
  preparationTime?: number;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  nutritionInfo?: any;
}

export interface UpdateMenuItemInput {
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  cost?: number;
  categoryId?: string;
  preparationTime?: number;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  allergens?: string[];
  nutritionInfo?: any;
}

export const menuApi = {
  // Categories
  getCategories: async (restaurantId?: string): Promise<MenuCategory[]> => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    const response = await apiClient.get(`/menu/categories?${params.toString()}`);
    return response.data.data?.categories || response.data.data || [];
  },

  getCategory: async (id: string): Promise<MenuCategory> => {
    const response = await apiClient.get(`/menu/categories/${id}`);
    return response.data.data;
  },

  createCategory: async (data: CreateCategoryInput): Promise<MenuCategory> => {
    const response = await apiClient.post('/menu/categories', data);
    // Interceptor returns response.data which is {statusCode, data: category, message, success}
    // We need to extract the category from response.data
    return response.data;
  },

  updateCategory: async (id: string, data: UpdateCategoryInput): Promise<MenuCategory> => {
    const response = await apiClient.put(`/menu/categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/menu/categories/${id}`);
  },

  // Menu Items
  getMenuItems: async (filters?: {
    categoryId?: string;
    restaurantId?: string;
    branchId?: string;
    isAvailable?: boolean;
  }): Promise<MenuItem[]> => {
    const params = new URLSearchParams();
    if (filters?.categoryId) params.append('categoryId', filters.categoryId);
    if (filters?.restaurantId) params.append('restaurantId', filters.restaurantId);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.isAvailable !== undefined) params.append('isAvailable', String(filters.isAvailable));
    
    const response = await apiClient.get(`/menu/items?${params.toString()}`);
    return response.data.data?.menuItems || response.data.data || [];
  },

  getMenuItem: async (id: string): Promise<MenuItem> => {
    const response = await apiClient.get(`/menu/items/${id}`);
    return response.data.data;
  },

  createMenuItem: async (data: CreateMenuItemInput): Promise<MenuItem> => {
    const response = await apiClient.post('/menu/items', data);
    return response.data.data;
  },

  updateMenuItem: async (id: string, data: UpdateMenuItemInput): Promise<MenuItem> => {
    const response = await apiClient.put(`/menu/items/${id}`, data);
    return response.data.data;
  },

  toggleMenuItemAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem> => {
    const response = await apiClient.patch(`/menu/items/${id}/availability`, { isAvailable });
    return response.data.data;
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/menu/items/${id}`);
  },

  // Variants
  getVariants: async (menuItemId: string): Promise<MenuVariant[]> => {
    const response = await apiClient.get(`/menu/variants?menuItemId=${menuItemId}`);
    return response.data.data?.variants || response.data.data || [];
  },

  // Addons
  getAddons: async (menuItemId: string): Promise<MenuAddon[]> => {
    const response = await apiClient.get(`/menu/addons?menuItemId=${menuItemId}`);
    return response.data.data?.addons || response.data.data || [];
  },
};
