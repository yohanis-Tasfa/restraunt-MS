import apiClient from './client';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderType {
  DINE_IN = 'DINE_IN',
  TAKEAWAY = 'TAKEAWAY',
  DELIVERY = 'DELIVERY',
  ONLINE = 'ONLINE',
}

export interface OrderItem {
  id?: string;
  menuItemId: string;
  menuItem?: any;
  quantity: number;
  price: number;
  notes?: string;
  status?: string;
  subtotal: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  branchId: string;
  branch?: any;
  tableId?: string;
  table?: any;
  customerId?: string;
  customer?: any;
  createdById: string;
  createdBy?: any;
  items: OrderItem[];
  _count?: {
    items: number;
    payments: number;
  };
  subtotal: number;
  tax: number;
  vat: number;
  serviceCharge: number;
  discount: number;
  total: number;
  notes?: string;
  specialInstructions?: string;
  paymentStatus: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateOrderData {
  type: OrderType;
  branchId: string;
  tableId?: string;
  customerId?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    price?: number;
    notes?: string;
  }>;
  notes?: string;
  specialInstructions?: string;
  discount?: number;
}

export interface WaiterPeriodStats {
  paidOrdersCount: number;
  totalSales: number;
  totalTips: number;
  tipsCount: number;
  paidTips: number;
  pendingTips: number;
  startDate: string;
  endDate: string;
}

export interface WaiterStats {
  today: WaiterPeriodStats;
  week: WaiterPeriodStats;
  month: WaiterPeriodStats;
}

export const ordersApi = {
  // Create order
  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  // Get orders with filters
  getOrders: async (filters?: {
    branchId?: string;
    status?: OrderStatus;
    paymentStatus?: string;
    type?: OrderType;
    waiterId?: string;
    myOrdersOnly?: boolean;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Order[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.waiterId) params.append('waiterId', filters.waiterId);
    if (filters?.myOrdersOnly) params.append('myOrdersOnly', 'true');
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await apiClient.get(`/orders?${params.toString()}`);
    // Backend: { statusCode, data: { data: orders, pagination }, message, success }
    // Interceptor returns: { data: { data: orders, pagination }, message, success }
    // So we access response.data to get { data: orders, pagination }
    return response.data || { data: [], pagination: {} };
  },

  // Get waiter's personal stats for Today, This Week, and This Month
  getMyStats: async (): Promise<WaiterStats> => {
    const response = await apiClient.get('/orders/my-stats');
    return response.data;
  },

  // Get single order
  getOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  // Update order status
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiClient.post(`/orders/${id}/cancel`, { reason });
    return response.data;
  },
};
