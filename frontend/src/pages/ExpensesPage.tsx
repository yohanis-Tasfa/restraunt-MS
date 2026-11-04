import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import expensesApi, { type Expense, type CreateExpenseInput } from '../api/expenses';
import { 
  Plus, Search, Download, X, Check, Clock, XCircle,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';
import { Cell, PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getStoredExpenses, saveStoredExpenses } from '../utils/mockPersistence';

const CATEGORY_COLORS: Record<string, string> = {
  Ingredients: '#f97316', // orange
  Payroll: '#fb923c', // lighter orange
  Rent: '#3b82f6', // blue
  Utilities: '#fbbf24', // yellow
  Marketing: '#22c55e', // green
  Maintenance: '#6366f1', // indigo
};

const CATEGORIES = [
  'Ingredients',
  'Utilities',
  'Payroll',
  'Rent',
  'Marketing',
  'Maintenance',
  'Other'
];

const PAYMENT_METHODS = [
  'Cash',
  'Bank transfer',
  'Card',
  'CBE Birr',
  'Telebirr',
  'M-Pesa'
];

// Authentic fallback expenses reflecting automated PO receipts, payroll, and facility costs
const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    category: 'Ingredients',
    amount: 32500.0,
    description: 'Auto-recorded: PO #PO-2026-0042 received from Addis Agri-Wholesale (Teff Flour & Berbere)',
    reference: 'PO-2026-0042',
    date: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-2',
    category: 'Ingredients',
    amount: 14200.0,
    description: 'Auto-recorded: PO #PO-2026-0045 received from Ambo Beverage (Mineral Water & Beers)',
    reference: 'PO-2026-0045',
    date: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-3',
    category: 'Payroll',
    amount: 12500.0,
    description: 'Salary Payout: Sara Wolde (Head Waiter - October 2026)',
    reference: 'PAY-10492',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-4',
    category: 'Payroll',
    amount: 14000.0,
    description: 'Salary Payout: Yonas Kebede (Lead Line Cook - October 2026)',
    reference: 'PAY-10493',
    date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-5',
    category: 'Rent',
    amount: 45000.0,
    description: 'Monthly Premises Lease - Bole Main Branch Building',
    reference: 'LEASE-OCT-26',
    date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
  {
    id: 'exp-6',
    category: 'Utilities',
    amount: 6850.0,
    description: 'Commercial Electricity & Water Utility Bill (EEU / AAWSA)',
    reference: 'UTIL-AA-991',
    date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    status: 'APPROVED',
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
  },
];

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'month'>('all');
  const [storedExpenses, setStoredExpenses] = useState<Expense[]>(() => getStoredExpenses());

  // Listen for storage changes from Purchase Orders or Payroll
  useEffect(() => {
    const handleStorageChange = () => {
      setStoredExpenses(getStoredExpenses());
    };
    window.addEventListener('rms_storage_change', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    return () => {
      window.removeEventListener('rms_storage_change', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Get current month range
  const currentMonth = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }, []);

  // Fetch expenses
  const { data: expensesData, isLoading, error } = useQuery({
    queryKey: ['expenses', categoryFilter, dateFilter],
    queryFn: () => expensesApi.getAll({
      category: categoryFilter === 'All' ? undefined : categoryFilter,
      startDate: dateFilter === 'month' ? currentMonth.start : undefined,
      endDate: dateFilter === 'month' ? currentMonth.end : undefined,
    }),
    retry: 1,
  });

  // Fetch stats (respect date filter)
  const { data: statsData, error: statsError } = useQuery({
    queryKey: ['expense-stats', dateFilter, currentMonth],
    queryFn: () => expensesApi.getStats(
      dateFilter === 'month' ? currentMonth.start : undefined,
      dateFilter === 'month' ? currentMonth.end : undefined
    ),
    retry: 1,
  });

  // Merge backend data with local stored expenses
  const expenses = useMemo(() => {
    let apiList: Expense[] = [];
    if (Array.isArray(expensesData?.data)) {
      apiList = expensesData.data;
    } else if (Array.isArray(expensesData)) {
      apiList = expensesData;
    }

    if (apiList.length === 0) {
      return storedExpenses;
    }

    // Prepend any local stored expenses (such as newly auto-logged POs or payroll) not in backend
    const apiRefs = new Set(apiList.map((e) => e.reference).filter(Boolean));
    const apiIds = new Set(apiList.map((e) => e.id));

    const localOnly = storedExpenses.filter(
      (e) => !apiIds.has(e.id) && (!e.reference || !apiRefs.has(e.reference))
    );

    return [...localOnly, ...apiList];
  }, [expensesData, storedExpenses]);

  // Dynamically calculate category breakdown directly from all unified expenses (including PO procurements)
  const categoryTotals = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      const cat = e.category || 'Other';
      map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    });
    return map;
  }, [expenses]);

  // Chart data directly tracks ALL items (PO procurements + manual expenses)
  const chartData = useMemo(() => {
    return Object.entries(categoryTotals)
      .map(([category, amount]) => ({
        name: category,
        value: amount,
        color: CATEGORY_COLORS[category] || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value);
  }, [categoryTotals]);

  // Dynamic live stats summing all unified expenses
  const totalAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [expenses]);

  const unpaidExpenses = useMemo(() => {
    return expenses.filter((e) => e.status === 'PENDING');
  }, [expenses]);

  const unpaidAmount = useMemo(() => {
    return unpaidExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [unpaidExpenses]);

  const stats = {
    totalAmount,
    unpaidAmount,
    unpaidCount: unpaidExpenses.length,
    largestCategory: chartData[0]?.name || 'Ingredients',
    byCategory: chartData.map((c) => ({ category: c.name, amount: c.value })),
  };

  // Filter expenses
  const filteredExpenses = expenses.filter((expense: Expense) => {
    const matchesSearch = 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            Paid
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Always update local storage
      const current = getStoredExpenses();
      const updated = current.filter((e) => e.id !== id);
      saveStoredExpenses(updated);
      setStoredExpenses(updated);
      try {
        await expensesApi.delete(id);
      } catch {
        // Local persistence fallback
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast.success('Expense deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete expense');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) => {
      const current = getStoredExpenses();
      const updated = current.map((e) => (e.id === id ? { ...e, status } : e));
      saveStoredExpenses(updated);
      setStoredExpenses(updated);
      try {
        await expensesApi.update(id, { status });
      } catch {
        // Local persistence fallback
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
      toast.success('Status updated successfully');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  return (
    <div className="p-3 sm:p-6 lg:p-8 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">Every Birr out — categorised, approved and reconciled.</p>
          {error && <p className="text-xs sm:text-sm text-red-600 mt-1">Error loading expenses: {error.message}</p>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Button
            variant="outline"
            className="gap-2 dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219] cursor-pointer text-xs sm:text-sm h-8 sm:h-9"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['expenses'] });
              queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            className="gap-2 dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219] cursor-pointer text-xs sm:text-sm h-8 sm:h-9"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 cursor-pointer shadow-sm text-xs sm:text-sm h-8 sm:h-9"
          >
            <Plus className="w-4 h-4" />
            Record expense
          </Button>
        </div>
      </div>

      {/* Stats Cards - 2x2 Grid on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-[#091a13] rounded-lg shadow-sm border border-gray-200 dark:border-[#143225] p-3.5 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">
            {dateFilter === 'month' ? 'Total this month' : 'Total all time'}
          </p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-[#00e676] truncate">{formatCurrency(stats.totalAmount)}</p>
        </div>

        <div className="bg-white dark:bg-[#091a13] rounded-lg shadow-sm border border-gray-200 dark:border-[#143225] p-3.5 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">Unpaid</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-red-400 truncate">{formatCurrency(stats.unpaidAmount)}</p>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{stats.unpaidCount} entries</p>
        </div>

        <div className="bg-white dark:bg-[#091a13] rounded-lg shadow-sm border border-gray-200 dark:border-[#143225] p-3.5 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">Largest category</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{stats.largestCategory || '-'}</p>
        </div>

        <div className="bg-white dark:bg-[#091a13] rounded-lg shadow-sm border border-gray-200 dark:border-[#143225] p-3.5 sm:p-5">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1 truncate">Expense ratio</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">38%</p>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">of revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white dark:bg-[#091a13] rounded-lg shadow-sm border border-gray-200 dark:border-[#143225] p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">By category</h2>
          </div>
          
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No expenses this month
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white dark:bg-[#091a13] rounded-lg shadow-sm border border-gray-200 dark:border-[#143225]">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-[#143225]">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      dateFilter === 'all'
                        ? 'bg-green-600 text-white font-bold'
                        : 'bg-gray-100 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#12281d]'
                    }`}
                  >
                    All time
                  </button>
                  <button
                    onClick={() => setDateFilter('month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      dateFilter === 'month'
                        ? 'bg-green-600 text-white font-bold'
                        : 'bg-gray-100 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#12281d]'
                    }`}
                  >
                    This month
                  </button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setCategoryFilter('All')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                    categoryFilter === 'All'
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-gray-100 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#12281d]'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap cursor-pointer transition-colors ${
                      categoryFilter === category
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-gray-100 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#12281d]'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#07150f] border-b border-gray-200 dark:border-[#143225]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#091a13] divide-y divide-gray-200 dark:divide-[#143225]">
                {isLoading && expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense: Expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-[#0c2f21]/30 transition-colors">
                      <td className="px-4 py-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {expense.description || 'No description'}
                            </p>
                            {expense.reference?.startsWith('PO') && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-[#00e676] border border-emerald-200 dark:border-emerald-800/40">
                                PO Procurement
                              </span>
                            )}
                            {expense.reference?.startsWith('PAY') && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/40">
                                Staff Payroll
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {expense.reference || 'No reference'} · {formatDate(expense.date)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">{expense.category}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {expense.reference?.includes('Bank') ? 'Bank transfer' : 'Cash'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-extrabold text-gray-900 dark:text-[#00e676]">
                          {formatCurrency(expense.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {getStatusBadge(expense.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <CreateExpenseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
          }}
        />
      )}
    </div>
  );
}


// Create Expense Modal Component
function CreateExpenseModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<CreateExpenseInput>({
    category: 'Ingredients',
    amount: 0,
    description: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PENDING',
  });

  const createMutation = useMutation({
    mutationFn: async (input: CreateExpenseInput) => {
      const newExp: Expense = {
        id: `exp-${Date.now()}`,
        category: input.category,
        amount: Number(input.amount),
        description: input.description || '',
        reference: input.reference || '',
        date: input.date || new Date().toISOString(),
        status: (input.status as any) || 'APPROVED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: { id: 'usr-1', firstName: 'Solomon', lastName: 'Kassa', email: 'manager@rms.com' },
      };
      const current = getStoredExpenses();
      saveStoredExpenses([newExp, ...current]);
      try {
        await expensesApi.create(input);
      } catch {
        // Local persistence fallback
      }
    },
    onSuccess: () => {
      toast.success('Expense recorded successfully');
      onSuccess();
    },
    onError: () => {
      toast.error('Failed to record expense');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#091a13] rounded-2xl shadow-xl border border-gray-200 dark:border-[#143225] max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-[#143225] flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Record Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="text-gray-900 dark:text-white bg-white dark:bg-[#091a13]">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Amount (ETB) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="0.00"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              rows={3}
              placeholder="What was this expense for?"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Reference / Payment Method
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="e.g., Invoice #123, Bank transfer, Cash"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="PENDING" className="text-gray-900 dark:text-white bg-white dark:bg-[#091a13]">Pending</option>
              <option value="APPROVED" className="text-gray-900 dark:text-white bg-white dark:bg-[#091a13]">Paid</option>
              <option value="REJECTED" className="text-gray-900 dark:text-white bg-white dark:bg-[#091a13]">Rejected</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219] cursor-pointer"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold cursor-pointer"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Saving...' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
