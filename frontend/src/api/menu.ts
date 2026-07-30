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
  variants?: MenuVariant[];
  addons?: MenuAddon[];
}

export const menuApi = {
  // Categories
  getCategories: async (restaurantId?: string): Promise<MenuCategory[]> => {
    const params = new URLSearchParams();
    if (restaurantId) params.append('restaurantId', restaurantId);
    const response = await apiClient.get(`/menu-categories?${params.toString()}`);
    return response.data;
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
    
    const response = await apiClient.get(`/menu-items?${params.toString()}`);
    return response.data;
  },

  getMenuItem: async (id: string): Promise<MenuItem> => {
    const response = await apiClient.get(`/menu-items/${id}`);
    return response.data;
  },

  // Variants
  getVariants: async (menuItemId: string): Promise<MenuVariant[]> => {
    const response = await apiClient.get(`/menu-variants?menuItemId=${menuItemId}`);
    return response.data;
  },

  // Addons
  getAddons: async (menuItemId: string): Promise<MenuAddon[]> => {
    const response = await apiClient.get(`/menu-addons?menuItemId=${menuItemId}`);
    return response.data;
  },
};
