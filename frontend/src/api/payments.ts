import apiClient from './client';

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MOBILE = 'MOBILE',
  TELEBIRR = 'TELEBIRR',
  CBE_BIRR = 'CBE_BIRR',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  status: string;
  proofImageUrl?: string;
  transactionRef?: string;
  notes?: string;
  verifiedAt?: string;
  verifiedById?: string;
  createdAt: string;
  order?: any;
}

export interface CreatePaymentData {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  proofImageUrl?: string;
  transactionRef?: string;
  notes?: string;
}

export interface PaymentSummary {
  totalRevenue: number;
  totalOrders: number;
  byMethod: {
    method: string;
    total: number;
    count: number;
  }[];
  recentPayments: Payment[];
}

export const paymentsApi = {
  // Create payment (process payment for an order)
  createPayment: async (data: CreatePaymentData): Promise<Payment> => {
    const response = await apiClient.post('/payments', data);
    return response.data;
  },

  // Get all payments
  getPayments: async (filters?: {
    orderId?: string;
    method?: PaymentMethod;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Payment[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.orderId) params.append('orderId', filters.orderId);
    if (filters?.method) params.append('method', filters.method);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/payments?${params.toString()}`);
    return response.data || { data: [], pagination: {} };
  },

  // Get single payment
  getPayment: async (id: string): Promise<Payment> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  // Get payment summary/stats
  getPaymentSummary: async (filters?: {
    startDate?: string;
    endDate?: string;
  }): Promise<PaymentSummary> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await apiClient.get(`/payments/stats/summary?${params.toString()}`);
    return response.data;
  },

  // Refund payment
  refundPayment: async (id: string, reason?: string): Promise<Payment> => {
    const response = await apiClient.post(`/payments/${id}/refund`, { reason });
    return response.data;
  },
};

export default paymentsApi;
