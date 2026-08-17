import apiClient from './client';

export interface WaiterCall {
  id: string;
  sessionId: string;
  tableId: string;
  table: {
    id: string;
    number: string;
    capacity: number;
    status: string;
  };
  waiterId?: string;
  waiter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  requestType: 'ASSISTANCE' | 'ORDER_READY' | 'BILL_REQUEST' | 'OTHER';
  selectedItems?: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'TIMEOUT' | 'CANCELLED';
  priority: number;
  createdAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface WaiterCallsQueryParams {
  status?: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'TIMEOUT' | 'CANCELLED';
  requestType?: 'ASSISTANCE' | 'ORDER_READY' | 'BILL_REQUEST' | 'OTHER';
  tableId?: string;
  waiterId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface WaiterCallStats {
  total: number;
  pending: number;
  acknowledged: number;
  completed: number;
  averageResponseTime: number;
  byRequestType: {
    ASSISTANCE: number;
    ORDER_READY: number;
    BILL_REQUEST: number;
    OTHER: number;
  };
}

export const waiterCallsApi = {
  // Get all waiter calls with filters
  getCalls: async (params?: WaiterCallsQueryParams): Promise<{
    calls: WaiterCall[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.requestType) queryParams.append('requestType', params.requestType);
    if (params?.tableId) queryParams.append('tableId', params.tableId);
    if (params?.waiterId) queryParams.append('waiterId', params.waiterId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const url = `/waiter-calls${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get(url);
  },

  // Get active calls (PENDING or ACKNOWLEDGED)
  getActiveCalls: async (): Promise<WaiterCall[]> => {
    return await apiClient.get('/waiter-calls/active');
  },

  // Get call by ID
  getCall: async (id: string): Promise<WaiterCall> => {
    return await apiClient.get(`/waiter-calls/${id}`);
  },

  // Get calls for a specific table
  getCallsForTable: async (tableId: string): Promise<WaiterCall[]> => {
    return await apiClient.get(`/waiter-calls/table/${tableId}`);
  },

  // Get calls for a specific session
  getCallsForSession: async (sessionId: string): Promise<WaiterCall[]> => {
    return await apiClient.get(`/waiter-calls/session/${sessionId}`);
  },

  // Get calls for a specific waiter
  getCallsForWaiter: async (waiterId: string): Promise<WaiterCall[]> => {
    return await apiClient.get(`/waiter-calls/waiter/${waiterId}`);
  },

  // Create a new waiter call (used by customer)
  createCall: async (data: {
    sessionId: string;
    requestType: 'ASSISTANCE' | 'ORDER_READY' | 'BILL_REQUEST' | 'OTHER';
    selectedItems?: any;
  }): Promise<WaiterCall> => {
    return await apiClient.post('/waiter-calls', data);
  },

  // Acknowledge a call (waiter accepts)
  acknowledgeCall: async (id: string, notes?: string): Promise<WaiterCall> => {
    return await apiClient.post(`/waiter-calls/${id}/acknowledge`, { notes });
  },

  // Complete a call
  completeCall: async (id: string, notes?: string): Promise<WaiterCall> => {
    return await apiClient.post(`/waiter-calls/${id}/complete`, { notes });
  },

  // Cancel a call
  cancelCall: async (id: string, reason?: string): Promise<WaiterCall> => {
    return await apiClient.post(`/waiter-calls/${id}/cancel`, { reason });
  },

  // Update call notes
  updateNotes: async (id: string, notes: string): Promise<WaiterCall> => {
    return await apiClient.patch(`/waiter-calls/${id}/notes`, { notes });
  },

  // Get waiter call statistics
  getStats: async (params?: {
    startDate?: string;
    endDate?: string;
    waiterId?: string;
  }): Promise<WaiterCallStats> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.waiterId) queryParams.append('waiterId', params.waiterId);

    const url = `/waiter-calls/stats${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return await apiClient.get(url);
  },
};
