import apiClient from './client';

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description?: string;
  reference?: string;
  attachment?: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  date: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseInput {
  category: string;
  amount: number;
  description?: string;
  reference?: string;
  attachment?: string;
  date: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface UpdateExpenseInput {
  category?: string;
  amount?: number;
  description?: string;
  reference?: string;
  attachment?: string;
  date?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface ExpenseStats {
  totalAmount: number;
  unpaidAmount: number;
  unpaidCount: number;
  largestCategory: string | null;
  largestCategoryAmount: number;
  byCategory: {
    category: string;
    amount: number;
  }[];
}

const expensesApi = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) => {
    const response = await apiClient.get('/expenses', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseInput) => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseInput) => {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/expenses/${id}`);
  },

  getStats: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/expenses/stats', {
      params: { startDate, endDate },
    });
    return response.data;
  },

  getCategories: async () => {
    const response = await apiClient.get('/expenses/categories');
    return response.data;
  },
};

export default expensesApi;
