import apiClient from './client';

// ============ INTERFACES ============

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface SalesSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalOrders: number;
    totalRevenue: number;
    totalTax: number;
    totalServiceCharge: number;
    averageOrderValue: number;
    netRevenue: number;
  };
  ordersByType: Record<string, { count: number; revenue: number }>;
  paymentsByMethod: Record<string, { count: number; amount: number }>;
  ordersByStatus: Record<string, { count: number; revenue: number }>;
}

export interface SalesByDate {
  period: {
    startDate: string;
    endDate: string;
  };
  groupBy: 'day' | 'week' | 'month';
  data: Array<{
    date: string;
    orders: number;
    revenue: number;
    tax: number;
    serviceCharge: number;
  }>;
}

export interface TopSellingItem {
  menuItem: {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: {
      name: string;
    };
  };
  quantitySold: number;
  revenue: number;
}

export interface TopSellingItems {
  period: {
    startDate: string;
    endDate: string;
  };
  items: TopSellingItem[];
}

export interface RevenueByCategory {
  period: {
    startDate: string;
    endDate: string;
  };
  categories: Array<{
    category: string;
    items: number;
    revenue: number;
  }>;
}

export interface ExpensesSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalExpenses: number;
    totalPaid: number;
    totalPending: number;
    expenseCount: number;
  };
  byCategory: Array<{
    category: string;
    amount: number;
    count: number;
  }>;
}

export interface ProfitLossReport {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    sales: number;
    tax: number;
    serviceCharge: number;
    totalRevenue: number;
  };
  expenses: {
    ingredients: number;
    utilities: number;
    payroll: number;
    rent: number;
    marketing: number;
    maintenance: number;
    other: number;
    totalExpenses: number;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
}

// ============ API CLIENT ============

const reportsApi = {
  // ============ SALES REPORTS ============
  
  getSalesSummary: async (params?: DateRangeParams) => {
    const response = await apiClient.get('/reports/sales/summary', { params });
    return response.data;
  },

  getSalesByDate: async (params?: DateRangeParams & { groupBy?: 'day' | 'week' | 'month' }) => {
    const response = await apiClient.get('/reports/sales/by-date', { params });
    return response.data;
  },

  getTopSellingItems: async (params?: DateRangeParams & { limit?: number }) => {
    const response = await apiClient.get('/reports/sales/top-items', { params });
    return response.data;
  },

  getRevenueByCategory: async (params?: DateRangeParams) => {
    const response = await apiClient.get('/reports/revenue/by-category', { params });
    return response.data;
  },

  // ============ EXPENSE REPORTS ============
  
  getExpensesSummary: async (params?: DateRangeParams) => {
    const response = await apiClient.get('/reports/expenses/summary', { params });
    return response.data;
  },

  // ============ PROFIT & LOSS ============
  
  getProfitLoss: async (params?: DateRangeParams) => {
    const response = await apiClient.get('/reports/profit-loss', { params });
    return response.data;
  },

  // ============ INVENTORY REPORTS ============
  
  getInventorySummary: async () => {
    const response = await apiClient.get('/reports/inventory/summary');
    return response.data;
  },

  getLowStockReport: async () => {
    const response = await apiClient.get('/reports/inventory/low-stock');
    return response.data;
  },

  // ============ DASHBOARD ============
  
  getDashboardStats: async (params?: DateRangeParams) => {
    const response = await apiClient.get('/reports/dashboard', { params });
    return response.data;
  },
};

export default reportsApi;
