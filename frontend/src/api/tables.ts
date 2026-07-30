import apiClient from './client';

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  status: TableStatus;
  branchId: string;
  currentOrderId?: string;
  section?: string;
}

export const tablesApi = {
  // Get all tables
  getTables: async (branchId?: string): Promise<Table[]> => {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', branchId);
    
    const response = await apiClient.get(`/tables?${params.toString()}`);
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
    return response.data;
  },
};
