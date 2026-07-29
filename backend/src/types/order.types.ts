export interface CreateOrderData {
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE';
  branchId: string;
  tableId?: string;
  customerId?: string;
  items: OrderItemInput[];
  notes?: string;
  specialInstructions?: string;
  discount?: number;
}

export interface OrderItemInput {
  menuItemId: string;
  quantity: number;
  price?: number;
  notes?: string;
}

export interface UpdateOrderData {
  type?: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY' | 'ONLINE';
  tableId?: string;
  customerId?: string;
  notes?: string;
  specialInstructions?: string;
  discount?: number;
}

export interface OrderCalculation {
  subtotal: number;
  tax: number;
  vat: number;
  serviceCharge: number;
  discount: number;
  total: number;
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  status?: string;
  type?: string;
  customerId?: string;
  startDate?: string;
  endDate?: string;
}
