import apiClient from './client';

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

export interface Table {
  id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  floorId?: string;
  floor?: any;
  branchId: string;
  branch?: any;
  qrCodeUrl?: string;
  qrCodeData?: string;
  assignedWaiterId?: string;
  assignedWaiter?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  orders?: any[];
  reservations?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export const tablesApi = {
  // Get all tables
  getTables: async (branchId?: string): Promise<{ data: Table[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    
    const response = await apiClient.get(`/tables?${params.toString()}`);
    return response.data;
  },

  // Get tables by branch (grouped by floor)
  getTablesByBranch: async (branchId: string): Promise<Record<string, Table[]>> => {
    const response = await apiClient.get(`/tables/branch/${branchId}`);
    return response.data;
  },

  // Get single table
  getTable: async (id: string): Promise<Table> => {
    const response = await apiClient.get(`/tables/${id}`);
    return response.data;
  },

  // Update table status
  updateTableStatus: async (id: string, status: TableStatus): Promise<Table> => {
    const response = await apiClient.patch(`/tables/${id}/status`, { status });
    return response.data;
  },

  // Get available tables
  getAvailableTables: async (branchId?: string): Promise<Table[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    params.append('status', TableStatus.AVAILABLE);
    
    const response = await apiClient.get(`/tables?${params.toString()}`);
    return response.data.data || [];
  },

  // Create table
  createTable: async (data: {
    number: string;
    capacity: number;
    branchId: string;
    floorId?: string;
  }): Promise<Table> => {
    const response = await apiClient.post('/tables', data);
    return response.data;
  },

  // Update table
  updateTable: async (id: string, data: Partial<Table>): Promise<Table> => {
    const response = await apiClient.put(`/tables/${id}`, data);
    return response.data;
  },

  // Delete table
  deleteTable: async (id: string): Promise<void> => {
    await apiClient.delete(`/tables/${id}`);
  },

  // QR Code Management
  
  // Generate QR code for table
  generateQRCode: async (id: string): Promise<Table> => {
    const response = await apiClient.post(`/tables/${id}/qr-code/generate`);
    return response.data;
  },

  // Regenerate QR code for table
  regenerateQRCode: async (id: string): Promise<Table> => {
    const response = await apiClient.post(`/tables/${id}/qr-code/regenerate`);
    return response.data;
  },

  // Note: Download QR code is handled via fetch() in the component
  // to properly handle blob responses without API client interference

  // Waiter Assignment

  // Assign waiter to table
  assignWaiter: async (id: string, waiterId: string): Promise<Table> => {
    const response = await apiClient.post(`/tables/${id}/assign-waiter`, { waiterId });
    return response.data;
  },

  // Unassign waiter from table
  unassignWaiter: async (id: string): Promise<Table> => {
    const response = await apiClient.delete(`/tables/${id}/assign-waiter`);
    return response.data;
  },

  // Get tables assigned to a waiter
  getAssignedTables: async (waiterId: string): Promise<Table[]> => {
    const response = await apiClient.get(`/tables/waiter/${waiterId}/assigned`);
    return response.data;
  },
};
