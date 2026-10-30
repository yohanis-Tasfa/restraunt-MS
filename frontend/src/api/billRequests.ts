import api from './client';

// Enums
export enum BillRequestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Interfaces
export interface BillRequest {
  id: string;
  orderId: string;
  tableId?: string;
  requestedById: string;
  status: BillRequestStatus;
  priority: number;
  notes?: string;
  requestedAt: string;
  processedById?: string;
  processedAt?: string;
  billId?: string;
  createdAt: string;
  updatedAt: string;
  order?: any;
  table?: any;
  requestedBy?: any;
  processedBy?: any;
}

export interface CreateBillRequestData {
  orderId: string;
  tableId?: string;
  notes?: string;
}

export interface BillRequestQueryParams {
  page?: number;
  limit?: number;
  status?: BillRequestStatus;
  requestedById?: string;
  processedById?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

// API Functions
export const billRequestsApi = {
  async getAll(params?: BillRequestQueryParams) {
    // The axios interceptor returns response.data automatically
    // So response is already { success: true, data: [...], pagination: {...} }
    const response: any = await api.get('/bill-requests', { params });
    console.log('Raw API response:', response);
    console.log('Response is array?:', Array.isArray(response));
    console.log('Response.data:', response.data);
    console.log('Response.pagination:', response.pagination);
    
    // If response is already { data: [...], pagination: {...} }
    if (response.data && response.pagination !== undefined) {
      return {
        data: response.data,
        pagination: response.pagination,
      };
    }
    
    // If response is the array directly (shouldn't happen but fallback)
    if (Array.isArray(response)) {
      return {
        data: response,
        pagination: undefined,
      };
    }
    
    // Default fallback
    return {
      data: [],
      pagination: undefined,
    };
  },

  async getById(id: string) {
    // Axios interceptor returns response.data automatically
    // So response is { success: true, data: {...} }
    const response: any = await api.get(`/bill-requests/${id}`);
    return response.data;
  },

  async create(data: CreateBillRequestData) {
    const response: any = await api.post('/bill-requests', data);
    return response.data;
  },

  async process(id: string, notes?: string) {
    const response: any = await api.patch(`/bill-requests/${id}/process`, { notes });
    return response.data;
  },

  async complete(id: string, billId?: string) {
    const response: any = await api.patch(`/bill-requests/${id}/complete`, { billId });
    return response.data;
  },

  async cancel(id: string, reason?: string) {
    const response: any = await api.patch(`/bill-requests/${id}/cancel`, { reason });
    return response.data;
  },

  async getPendingCount(userId?: string) {
    const response: any = await api.get('/bill-requests/pending-count', {
      params: { userId },
    });
    const count = response?.data?.count ?? response?.count ?? response?.data ?? response;
    return typeof count === 'number' ? count : 0;
  },
};
