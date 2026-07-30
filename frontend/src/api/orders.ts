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
  TAKEOUT = 'TAKEOUT',
  DELIVERY = 'DELIVERY',
}

export interface OrderItem {
  id?: string;
  menuItemId: string;
  menuItem?: any;
  quantity: number;
  unitPrice: number;
  variantId?: string;
  variant?: any;
  addons?: Array<{
    addonId: string;
    addon?: any;
    quantity: number;
    price: number;
  }>;
  specialInstructions?: string;
  subtotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  type: OrderType;
  status: OrderStatus;
  tableId?: string;
  table?: any;
  customerId?: string;
  customer?: any;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  type: OrderType;
  tableId?: string;
  customerId?: string;
  branchId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    unitPrice: number;
    variantId?: string;
    addons?: Array<{
      addonId: string;
      quantity: number;
      price: number;
    }>;
    specialInstructions?: string;
  }>;
  notes?: string;
  discount?: number;
}

export const ordersApi = {
  // Create order
  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await apiClient.post('/orders', data);
    return response.data.data;
  },

  // Get orders with filters
  getOrders: async (filters?: {
    branchId?: string;
    status?: OrderStatus;
    type?: OrderType;
    startDate?: string;
    endDate?: string;
  }): Promise<Order[]> => {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await apiClient.get(`/orders?${params.toString()}`);
    // Backend returns { success, data: { orders, total, page, limit }, message }
    return response.data.data?.orders || response.data.data || [];
  },

  // Get single order
  getOrder: async (id: string): Promise<Order> => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data.data;
  },

  // Update order status
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const response = await apiClient.patch(`/orders/${id}/status`, { status });
    return response.data.data;
  },

  // Cancel order
  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const response = await apiClient.patch(`/orders/${id}/cancel`, { reason });
    return response.data.data;
  },
};
