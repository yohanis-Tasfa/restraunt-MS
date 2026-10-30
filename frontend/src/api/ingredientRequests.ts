import apiClient from './client';

export interface IngredientRequest {
  id: string;
  requestNumber: string;
  branchId: string;
  requestedById: string;
  requestedByName: string;
  inventoryId: string;
  inventoryName: string;
  quantity: number;
  unit: string;
  priority: 'NORMAL' | 'URGENT';
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  rejectionReason?: string;
  processedById?: string;
  processedByName?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientRequestInput {
  inventoryId: string;
  quantity: number;
  priority?: 'NORMAL' | 'URGENT';
  notes?: string;
  branchId?: string;
}

export const ingredientRequestsApi = {
  getAll: async (params?: { branchId?: string; status?: string }): Promise<IngredientRequest[]> => {
    const searchParams = new URLSearchParams();
    if (params?.branchId) searchParams.append('branchId', params.branchId);
    if (params?.status) searchParams.append('status', params.status);

    const response = await apiClient.get(`/ingredient-requests?${searchParams.toString()}`);
    return response.data || [];
  },

  create: async (data: CreateIngredientRequestInput): Promise<IngredientRequest> => {
    const response = await apiClient.post('/ingredient-requests', data);
    return response.data;
  },

  approve: async (id: string): Promise<IngredientRequest> => {
    const response = await apiClient.post(`/ingredient-requests/${id}/approve`);
    return response.data;
  },

  reject: async (id: string, reason: string): Promise<IngredientRequest> => {
    const response = await apiClient.post(`/ingredient-requests/${id}/reject`, { reason });
    return response.data;
  },

  cancel: async (id: string): Promise<IngredientRequest> => {
    const response = await apiClient.post(`/ingredient-requests/${id}/cancel`);
    return response.data;
  },
};

