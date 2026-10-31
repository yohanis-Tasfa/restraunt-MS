import apiClient from './client';

export type POStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  inventoryId: string;
  quantity: number;
  price: number;
  subtotal: number;
  receivedQty: number;
  inventory?: {
    id: string;
    name: string;
    sku?: string;
    unit: string;
  };
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplier: {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    contactPerson?: string;
  };
  status: POStatus;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string;
  expectedDate?: string;
  receivedDate?: string;
  createdAt: string;
  updatedAt: string;
  items?: PurchaseOrderItem[];
  _count?: {
    items: number;
  };
}

export interface CreatePurchaseOrderItemInput {
  inventoryId: string;
  quantity: number;
  price: number;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  items: CreatePurchaseOrderItemInput[];
  notes?: string;
  expectedDate?: string;
}

export interface ReceiveGoodsItemInput {
  itemId: string;
  receivedQty: number;
}

export const purchaseOrdersApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: PurchaseOrder[]; pagination: any }> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);
    if (params?.supplierId && params.supplierId !== 'ALL') query.append('supplierId', params.supplierId);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);

    const res = await apiClient.get(`/purchase-orders?${query.toString()}`);
    return res.data;
  },

  getById: async (id: string): Promise<PurchaseOrder> => {
    const res = await apiClient.get(`/purchase-orders/${id}`);
    return res.data;
  },

  create: async (data: CreatePurchaseOrderInput): Promise<PurchaseOrder> => {
    const res = await apiClient.post('/purchase-orders', data);
    return res.data;
  },

  updateStatus: async (id: string, status: POStatus): Promise<PurchaseOrder> => {
    const res = await apiClient.patch(`/purchase-orders/${id}/status`, { status });
    return res.data;
  },

  receiveGoods: async (
    id: string,
    items: ReceiveGoodsItemInput[]
  ): Promise<PurchaseOrder> => {
    const res = await apiClient.post(`/purchase-orders/${id}/receive`, { items });
    return res.data;
  },

  cancel: async (id: string, reason?: string): Promise<PurchaseOrder> => {
    const res = await apiClient.post(`/purchase-orders/${id}/cancel`, { reason });
    return res.data;
  },
};

export default purchaseOrdersApi;

