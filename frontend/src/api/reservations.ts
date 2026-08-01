import apiClient from './client';

export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SEATED = 'SEATED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
}

export interface Reservation {
  id: string;
  customerId: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  branchId: string;
  branch?: any;
  tableId?: string;
  table?: {
    id: string;
    number: string;
    capacity: number;
  };
  reservationTables?: Array<{
    id: string;
    table: {
      id: string;
      number: string;
      capacity: number;
    };
  }>;
  reservationDate: string;
  guests: number;
  status: ReservationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationData {
  customerId: string;
  branchId: string;
  tableId?: string; // Deprecated: for backward compatibility
  tableIds?: string[]; // New: support multiple tables
  reservationDate: string;
  guests: number;
  notes?: string;
}

export const reservationsApi = {
  // Get all reservations
  getReservations: async (filters?: {
    branchId?: string;
    customerId?: string;
    status?: ReservationStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Reservation[]; pagination: any }> => {
    const params = new URLSearchParams();
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.customerId) params.append('customerId', filters.customerId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/reservations?${params.toString()}`);
    return response.data || { data: [], pagination: {} };
  },

  // Get upcoming reservations
  getUpcomingReservations: async (branchId: string, days: number = 7): Promise<Reservation[]> => {
    const response = await apiClient.get(`/reservations/upcoming?branchId=${branchId}&days=${days}`);
    return response.data || [];
  },

  // Get single reservation
  getReservation: async (id: string): Promise<Reservation> => {
    const response = await apiClient.get(`/reservations/${id}`);
    return response.data;
  },

  // Create reservation
  createReservation: async (data: CreateReservationData): Promise<Reservation> => {
    const response = await apiClient.post('/reservations', data);
    return response.data;
  },

  // Update reservation
  updateReservation: async (id: string, data: Partial<CreateReservationData>): Promise<Reservation> => {
    const response = await apiClient.put(`/reservations/${id}`, data);
    return response.data;
  },

  // Update reservation status
  updateReservationStatus: async (id: string, status: ReservationStatus): Promise<Reservation> => {
    const response = await apiClient.patch(`/reservations/${id}/status`, { status });
    return response.data;
  },

  // Cancel reservation
  cancelReservation: async (id: string, reason?: string): Promise<Reservation> => {
    const response = await apiClient.post(`/reservations/${id}/cancel`, { reason });
    return response.data;
  },

  // Delete reservation
  deleteReservation: async (id: string): Promise<void> => {
    await apiClient.delete(`/reservations/${id}`);
  },
};
