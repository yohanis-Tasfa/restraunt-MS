import apiClient from './client';

export enum TipStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface Tip {
  id: string;
  orderId: string;
  paymentId: string;
  waiterId: string;
  amount: number;
  method: string;
  status: TipStatus;
  paidAt?: string;
  paidById?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    total: number;
    table?: {
      id: string;
      number: string;
    };
  };
  waiter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  paidBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface TipSummary {
  total: {
    amount: number;
    count: number;
  };
  pending: {
    amount: number;
    count: number;
  };
  paid: {
    amount: number;
    count: number;
  };
  byMethod: Array<{
    method: string;
    count: number;
    total: number;
  }>;
}

export const tipsApi = {
  // Get all tips (Manager/Owner)
  getAll: async (filters?: {
    waiterId?: string;
    status?: TipStatus;
    method?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Tip[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.waiterId) params.append('waiterId', filters.waiterId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.method) params.append('method', filters.method);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/tips?${params.toString()}`);
    return response.data;
  },

  // Get my tips (Waiter)
  getMyTips: async (filters?: {
    status?: TipStatus;
    method?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Tip[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.method) params.append('method', filters.method);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/tips/my-tips?${params.toString()}`);
    return response.data;
  },

  // Get tip summary (Manager/Owner)
  getTipSummary: async (filters?: {
    waiterId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TipSummary> => {
    const params = new URLSearchParams();
    if (filters?.waiterId) params.append('waiterId', filters.waiterId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/tips/stats/summary?${params.toString()}`);
    return response.data;
  },

  // Get my tip summary (Waiter)
  getMyTipSummary: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<TipSummary> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/tips/my-tips/summary?${params.toString()}`);
    return response.data;
  },

  // Get single tip
  getById: async (id: string): Promise<Tip> => {
    const response = await apiClient.get(`/tips/${id}`);
    return response.data;
  },

  // Mark tip as paid (Manager/Cashier)
  markAsPaid: async (id: string, notes?: string): Promise<Tip> => {
    const response = await apiClient.patch(`/tips/${id}/mark-paid`, { notes });
    return response.data;
  },

  // Get pending payout amount (Manager/Owner)
  getPendingPayoutAmount: async (waiterId?: string): Promise<{ amount: number; count: number }> => {
    const params = new URLSearchParams();
    if (waiterId) params.append('waiterId', waiterId);

    const response = await apiClient.get(`/tips/stats/pending-payout?${params.toString()}`);
    return response.data;
  },
};

export default tipsApi;
