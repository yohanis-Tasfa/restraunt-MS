import apiClient from './client';

export interface CustomerSession {
  id: string;
  tableId: string;
  table: {
    id: string;
    number: string;
    capacity: number;
    status: string;
    assignedWaiter?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  customerName?: string;
  customerPhone?: string;
  guestCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WaiterCall {
  id: string;
  sessionId: string;
  tableId: string;
  table: {
    id: string;
    number: string;
  };
  waiterId: string;
  waiter?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  requestType: 'ASSISTANCE' | 'ORDER_READY' | 'BILL_REQUEST' | 'OTHER';
  selectedItems?: any;
  status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'TIMEOUT' | 'CANCELLED';
  priority: number;
  createdAt: string;
  acknowledgedAt?: string;
  completedAt?: string;
  notes?: string;
}

export const customerSessionApi = {
  // Create a new customer session (when customer scans QR code)
  createSession: async (data: {
    qrCodeData: string;
    customerName?: string;
    customerPhone?: string;
    guestCount?: number;
  }): Promise<CustomerSession> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.post('/customer-sessions', data);
  },

  // Get session by QR code (public endpoint)
  getSessionByQRCode: async (qrCode: string): Promise<CustomerSession> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.get(`/customer-sessions/qr/${qrCode}`);
  },

  // Get session by ID
  getSession: async (id: string): Promise<CustomerSession> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.get(`/customer-sessions/${id}`);
  },

  // Get active session for a table
  getActiveSessionByTable: async (tableId: string): Promise<CustomerSession> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.get(`/customer-sessions/table/${tableId}/active`);
  },

  // Update session
  updateSession: async (
    id: string,
    data: {
      customerName?: string;
      customerPhone?: string;
      guestCount?: number;
      status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
    }
  ): Promise<CustomerSession> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.put(`/customer-sessions/${id}`, data);
  },

  // End session
  endSession: async (id: string): Promise<CustomerSession> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.post(`/customer-sessions/${id}/end`);
  },
};

export const waiterCallApi = {
  // Create a new waiter call (customer calls waiter)
  createCall: async (data: {
    sessionId: string;
    requestType: 'ASSISTANCE' | 'ORDER_READY' | 'BILL_REQUEST' | 'OTHER';
    selectedItems?: any;
  }): Promise<WaiterCall> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.post('/waiter-calls', data);
  },

  // Get call by ID
  getCall: async (id: string): Promise<WaiterCall> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.get(`/waiter-calls/${id}`);
  },

  // Get calls for a session
  getCallsForSession: async (sessionId: string): Promise<WaiterCall[]> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.get(`/waiter-calls/session/${sessionId}`);
  },

  // Cancel call
  cancelCall: async (id: string, reason?: string): Promise<WaiterCall> => {
    // apiClient already unwraps response.data via interceptor
    return await apiClient.post(`/waiter-calls/${id}/cancel`, { reason });
  },
};
