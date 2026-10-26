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
    const response = await api.get('/bill-requests', { params });
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/bill-requests/${id}`);
    return response.data.data;
  },

  async create(data: CreateBillRequestData) {
    const response = await api.post('/bill-requests', data);
    return response.data.data;
  },

  async process(id: string, notes?: string) {
    const response = await api.patch(`/bill-requests/${id}/process`, { notes });
    return response.data.data;
  },

  async complete(id: string, billId?: string) {
    const response = await api.patch(`/bill-requests/${id}/complete`, { billId });
    return response.data.data;
  },

  async cancel(id: string, reason?: string) {
    const response = await api.patch(`/bill-requests/${id}/cancel`, { reason });
    return response.data.data;
  },

  async getPendingCount(userId?: string) {
    const response = await api.get('/bill-requests/pending-count', {
      params: { userId },
    });
    return response.data.data.count;
  },
};
