import apiClient from './client';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  restaurantId: string;
  loyaltyPoints: number;
  totalOrders: number;
  totalSpent: number;
  birthday?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  restaurantId: string;
  birthday?: string;
  notes?: string;
}

export const customersApi = {
  // Get all customers
  getCustomers: async (restaurantId?: string): Promise<{ data: Customer[]; pagination: any }> => {
    const params = restaurantId ? `?restaurantId=${restaurantId}` : '';
    const response = await apiClient.get(`/customers${params}`);
    return response.data || { data: [], pagination: {} };
  },

  // Get single customer
  getCustomer: async (id: string): Promise<Customer> => {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  // Create customer
  createCustomer: async (data: CreateCustomerData): Promise<Customer> => {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  // Update customer
  updateCustomer: async (id: string, data: Partial<CreateCustomerData>): Promise<Customer> => {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },

  // Delete customer
  deleteCustomer: async (id: string): Promise<void> => {
    await apiClient.delete(`/customers/${id}`);
  },
};
