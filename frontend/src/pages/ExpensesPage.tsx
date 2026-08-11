import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import expensesApi, { type Expense, type CreateExpenseInput } from '../api/expenses';
import { 
  Plus, Search, Download, X, Check, Clock, XCircle,
  PieChart as PieChartIcon
} from 'lucide-react';
import { Button } from '../components/ui/button';
import toast from 'react-hot-toast';
import { Cell, PieChart, Pie, ResponsiveContainer, Legend, Tooltip } from 'recharts';

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

export default function ExpensesPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [dateFilter, setDateFilter] = useState<'all' | 'month'>('all');

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
  });

  // Fetch stats (respect date filter)
  const { data: statsData, error: statsError } = useQuery({
    queryKey: ['expense-stats', dateFilter, currentMonth],
    queryFn: () => expensesApi.getStats(
      dateFilter === 'month' ? currentMonth.start : undefined,
      dateFilter === 'month' ? currentMonth.end : undefined
    ),
  });

  const expenses = expensesData?.data || [];
  const stats = statsData || {
    totalAmount: 0,
    unpaidAmount: 0,
    unpaidCount: 0,
    largestCategory: null,
    byCategory: [],
  };

  console.log('Stats Data:', statsData);
  console.log('Expenses count:', expenses.length);
  console.log('Total Amount:', stats.totalAmount);

  // Filter expenses
  const filteredExpenses = expenses.filter((expense: Expense) => {
    const matchesSearch = 
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Prepare chart data
  const chartData = stats.byCategory.map((cat: any) => ({
    name: cat.category,
    value: cat.amount,
    color: CATEGORY_COLORS[cat.category] || '#94a3b8',
  }));

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
    mutationFn: expensesApi.delete,
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
    mutationFn: ({ id, status }: { id: string; status: 'PENDING' | 'APPROVED' | 'REJECTED' }) =>
      expensesApi.update(id, { status }),
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
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-sm text-gray-600 mt-1">Every Birr out — categorised, approved and reconciled.</p>
          {error && <p className="text-sm text-red-600 mt-1">Error loading expenses: {error.message}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ['expenses'] });
              queryClient.invalidateQueries({ queryKey: ['expense-stats'] });
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outline"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Record expense
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">
            {dateFilter === 'month' ? 'Total this month' : 'Total all time'}
          </p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Unpaid</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.unpaidAmount)}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.unpaidCount} entries</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Largest category</p>
          <p className="text-2xl font-bold text-gray-900">{stats.largestCategory || '-'}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Expense ratio</p>
          <p className="text-2xl font-bold text-gray-900">38%</p>
          <p className="text-xs text-gray-500 mt-1">of revenue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">By category</h2>
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
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No expenses this month
            </div>
          )}
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow">
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      dateFilter === 'all'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All time
                  </button>
                  <button
                    onClick={() => setDateFilter('month')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      dateFilter === 'month'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    This month
                  </button>
                </div>
              </div>
              <div className="flex gap-2 overflow-x-auto">
                <button
                  onClick={() => setCategoryFilter('All')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    categoryFilter === 'All'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setCategoryFilter(category)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      categoryFilter === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      Loading expenses...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No expenses found
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense: Expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {expense.description || 'No description'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {expense.reference || 'No reference'} · {formatDate(expense.date)}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700">{expense.category}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-700">
                          {expense.reference?.includes('Bank') ? 'Bank transfer' : 'Cash'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900">
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
    mutationFn: expensesApi.create,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Record Expense</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (ETB) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount || ''}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              placeholder="What was this expense for?"
            />
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference / Payment Method
            </label>
            <input
              type="text"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="e.g., Invoice #123, Bank transfer, Cash"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Paid</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700"
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
