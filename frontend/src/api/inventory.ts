import apiClient from './client';

export interface InventoryItem {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  cost: number;
  branchId: string;
  expiryDate?: string;
  batchNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface CreateInventoryInput {
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  cost: number;
  branchId: string;
  expiryDate?: string;
  batchNumber?: string;
}

export interface UpdateInventoryInput {
  name?: string;
  description?: string;
  sku?: string;
  category?: string;
  unit?: string;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  cost?: number;
  expiryDate?: string;
  batchNumber?: string;
}

export interface AddMovementInput {
  inventoryId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'WASTE' | 'TRANSFER';
  quantity: number;
  reference?: string;
  notes?: string;
  costPerUnit?: number;
  totalCost?: number;
  supplier?: string;
  paymentMethod?: string;
}

export interface InventoryQueryParams {
  branchId?: string;
  category?: string;
  search?: string;
  lowStock?: boolean;
  expiring?: boolean;
  page?: number;
  limit?: number;
}

const inventoryApi = {
  // Get all inventory items
  getAll: async (params?: InventoryQueryParams) => {
    const response = await apiClient.get<{
      data: {
        data: InventoryItem[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>('/inventory', { params });
    return {
      items: response.data.data,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
    };
  },

  // Get inventory item by ID
  getById: async (id: string) => {
    const response = await apiClient.get<{ data: InventoryItem }>(`/inventory/${id}`);
    return response.data;
  },

  // Create inventory item
  create: async (data: CreateInventoryInput) => {
    const response = await apiClient.post<{ data: InventoryItem }>('/inventory', data);
    return response.data;
  },

  // Update inventory item
  update: async (id: string, data: UpdateInventoryInput) => {
    const response = await apiClient.put<{ data: InventoryItem }>(`/inventory/${id}`, data);
    return response.data;
  },

  // Delete inventory item
  delete: async (id: string) => {
    await apiClient.delete(`/inventory/${id}`);
  },

  // Add movement
  addMovement: async (data: AddMovementInput) => {
    const response = await apiClient.post<{ data: InventoryMovement }>(`/inventory/${data.inventoryId}/movement`, {
      type: data.type,
      quantity: data.quantity,
      reference: data.reference,
      notes: data.notes,
      costPerUnit: data.costPerUnit,
      totalCost: data.totalCost,
      supplier: data.supplier,
      paymentMethod: data.paymentMethod,
    });
    return response.data;
  },

  // Get movements for an item
  getMovements: async (inventoryId: string, page = 1, limit = 20) => {
    const response = await apiClient.get<{
      data: {
        data: InventoryMovement[];
        pagination: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      };
    }>(`/inventory/${inventoryId}/movements`, {
      params: { page, limit }
    });
    return {
      movements: response.data.data,
      total: response.data.pagination.total,
      page: response.data.pagination.page,
      limit: response.data.pagination.limit,
    };
  },

  // Get low stock items
  getLowStock: async (branchId?: string) => {
    const response = await apiClient.get<{ data: InventoryItem[] }>('/inventory/low-stock', {
      params: { branchId }
    });
    return response.data;
  },

  // Get expiring items
  getExpiring: async (branchId?: string, days = 7) => {
    const response = await apiClient.get<{ data: InventoryItem[] }>('/inventory/expiring', {
      params: { branchId, days }
    });
    return response.data;
  },

  // Get categories
  getCategories: async (branchId?: string) => {
    const response = await apiClient.get<{ data: string[] }>('/inventory/categories', {
      params: { branchId }
    });
    return response.data;
  },
};

export default inventoryApi;

// Explicit re-exports for better module resolution
export type {
  InventoryItem,
  InventoryMovement,
  CreateInventoryInput,
  UpdateInventoryInput,
  AddMovementInput,
  InventoryQueryParams,
};
