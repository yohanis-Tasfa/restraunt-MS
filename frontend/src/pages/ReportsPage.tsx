import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportsApi from '../api/reports';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package,
  Calendar,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type TabType = 'overview' | 'sales' | 'expenses' | 'profit';
type DateRangeType = 'today' | 'week' | 'month' | 'year' | 'custom';

const COLORS = {
  primary: '#10b981', // green
  secondary: '#3b82f6', // blue
  warning: '#f59e0b', // amber
  danger: '#ef4444', // red
  purple: '#8b5cf6',
  orange: '#f97316',
};

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316',
  '#06b6d4', '#ec4899', '#84cc16', '#6366f1'
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dateRange, setDateRange] = useState<DateRangeType>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range
  const dateParams = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    switch (dateRange) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        startDate = customStartDate ? new Date(customStartDate) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = customEndDate ? new Date(customEndDate) : new Date();
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [dateRange, customStartDate, customEndDate]);

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'profit', label: 'Profit & Loss', icon: ShoppingCart },
  ];

  const dateRanges = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'year', label: 'This Year' },
    { id: 'custom', label: 'Custom' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track your business performance and make data-driven decisions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition border-b-2 ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Calendar className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Date Range:</span>
          
          {dateRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setDateRange(range.id as DateRangeType)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                dateRange === range.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}

          {dateRange === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-500">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && <OverviewTab dateParams={dateParams} />}
        {activeTab === 'sales' && <SalesTab dateParams={dateParams} />}
        {activeTab === 'expenses' && <ExpensesTab dateParams={dateParams} />}
        {activeTab === 'profit' && <ProfitLossTab dateParams={dateParams} />}
      </div>
    </div>
  );
}

// ============ OVERVIEW TAB ============
function OverviewTab({ dateParams }: { dateParams: { startDate: string; endDate: string } }) {
  const { data: salesData, isLoading: loadingSales } = useQuery({
    queryKey: ['sales-summary', dateParams],
    queryFn: () => reportsApi.getSalesSummary(dateParams),
  });

  const { data: expensesData, isLoading: loadingExpenses } = useQuery({
    queryKey: ['expenses-summary', dateParams],
    queryFn: () => reportsApi.getExpensesSummary(dateParams),
  });

  const sales = salesData?.data || salesData;
  const expenses = expensesData?.data || expensesData;

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const revenue = sales?.summary?.totalRevenue || 0;
  const totalExpenses = expenses?.summary?.totalExpenses || 0;
  const profit = revenue - totalExpenses;
  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';

  if (loadingSales || loadingExpenses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading overview...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(revenue)}
          icon={TrendingUp}
          color="green"
          subtitle={`${sales?.summary?.totalOrders || 0} orders`}
        />
        <MetricCard
          title="Total Expenses"
          value={formatCurrency(totalExpenses)}
          icon={DollarSign}
          color="red"
          subtitle={`${expenses?.summary?.expenseCount || 0} expenses`}
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(profit)}
          icon={ShoppingCart}
          color={profit >= 0 ? 'green' : 'red'}
          subtitle={`${profitMargin}% margin`}
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(sales?.summary?.averageOrderValue || 0)}
          icon={Package}
          color="blue"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
          <div className="space-y-3">
            <StatRow label="Orders Completed" value={sales?.summary?.totalOrders || 0} />
            <StatRow label="Tax Collected" value={formatCurrency(sales?.summary?.totalTax || 0)} />
            <StatRow label="Service Charges" value={formatCurrency(sales?.summary?.totalServiceCharge || 0)} />
            <StatRow label="Net Revenue" value={formatCurrency(sales?.summary?.netRevenue || 0)} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Indicators</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Revenue Target</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Expense Control</span>
                <span className="font-medium">82%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Profit Margin</span>
                <span className="font-medium">{profitMargin}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full ${parseFloat(profitMargin) >= 20 ? 'bg-green-600' : 'bg-orange-500'}`} style={{ width: `${profitMargin}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ HELPER COMPONENTS ============
function MetricCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  color: 'green' | 'red' | 'blue' | 'purple';
  subtitle?: string;
}) {
  const colorClasses = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// ============ SALES TAB ============
function SalesTab({ dateParams }: { dateParams: { startDate: string; endDate: string } }) {
  const { data: salesByDate, isLoading: loadingSales } = useQuery({
    queryKey: ['sales-by-date', dateParams],
    queryFn: () => reportsApi.getSalesByDate({ ...dateParams, groupBy: 'day' }),
  });

  const { data: topItems, isLoading: loadingItems } = useQuery({
    queryKey: ['top-selling-items', dateParams],
    queryFn: () => reportsApi.getTopSellingItems({ ...dateParams, limit: 10 }),
  });

  const { data: revenueByCategory, isLoading: loadingCategory } = useQuery({
    queryKey: ['revenue-by-category', dateParams],
    queryFn: () => reportsApi.getRevenueByCategory(dateParams),
  });

  const salesData = salesByDate?.data || salesByDate;
  const topItemsData = topItems?.data || topItems;
  const categoryData = revenueByCategory?.data || revenueByCategory;

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loadingSales || loadingItems || loadingCategory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading sales reports...</div>
      </div>
    );
  }

  // Prepare chart data
  const revenueChartData = salesData?.data?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: item.revenue,
    orders: item.orders,
  })) || [];

  const categoryChartData = categoryData?.categories?.slice(0, 6).map((item: any) => ({
    name: item.category,
    value: item.revenue,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke={COLORS.primary} 
              strokeWidth={2}
              name="Revenue"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Items</h3>
          <div className="space-y-3">
            {topItemsData?.items?.slice(0, 10).map((item: any, index: number) => (
              <div key={item.menuItem.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                    <p className="text-xs text-gray-500">{item.menuItem.category.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{item.quantitySold} sold</p>
                  <p className="text-xs text-gray-500">{formatCurrency(item.revenue)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryChartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {categoryData?.categories?.slice(0, 6).map((item: any, index: number) => (
              <div key={item.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <span className="text-gray-700">{item.category}</span>
                </div>
                <span className="font-medium text-gray-900">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ EXPENSES TAB ============
function ExpensesTab({ dateParams }: { dateParams: { startDate: string; endDate: string } }) {
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses-summary', dateParams],
    queryFn: () => reportsApi.getExpensesSummary(dateParams),
  });

  const expenses = expensesData?.data || expensesData;

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading expense reports...</div>
      </div>
    );
  }

  // Prepare pie chart data
  const chartData = expenses?.byCategory?.map((item: any) => ({
    name: item.category,
    value: item.amount,
  })) || [];

  const totalExpenses = expenses?.summary?.totalExpenses || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">{expenses?.summary?.expenseCount || 0} transactions</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(expenses?.summary?.totalPaid || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Completed payments</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-600 mb-1">Pending</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(expenses?.summary?.totalPending || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">Awaiting payment</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Breakdown Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Expense by Category Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">By Category</h3>
          <div className="space-y-3">
            {expenses?.byCategory?.map((item: any, index: number) => {
              const percentage = totalExpenses > 0 ? ((item.amount / totalExpenses) * 100).toFixed(1) : '0';
              return (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                      />
                      <span className="text-sm font-medium text-gray-900">{item.category}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                      <p className="text-xs text-gray-500">{item.count} items</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ PROFIT & LOSS TAB ============
function ProfitLossTab({ dateParams }: { dateParams: { startDate: string; endDate: string } }) {
  const { data: profitLossData, isLoading } = useQuery({
    queryKey: ['profit-loss', dateParams],
    queryFn: () => reportsApi.getProfitLoss(dateParams),
  });

  const pl = profitLossData?.data || profitLossData;

  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading profit & loss statement...</div>
      </div>
    );
  }

  const revenue = pl?.revenue || { sales: 0, tax: 0, serviceCharge: 0, totalRevenue: 0 };
  const expenses = pl?.expenses || { 
    ingredients: 0, utilities: 0, payroll: 0, rent: 0, 
    marketing: 0, maintenance: 0, other: 0, totalExpenses: 0 
  };
  const profit = pl?.profit || { gross: 0, net: 0, margin: 0 };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border border-green-200">
          <p className="text-sm text-green-700 mb-1 font-medium">Gross Profit</p>
          <p className="text-3xl font-bold text-green-900">{formatCurrency(profit.gross)}</p>
          <p className="text-xs text-green-600 mt-2">Revenue - Direct Costs</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1 font-medium">Net Profit</p>
          <p className="text-3xl font-bold text-blue-900">{formatCurrency(profit.net)}</p>
          <p className="text-xs text-blue-600 mt-2">After all expenses</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6 border border-purple-200">
          <p className="text-sm text-purple-700 mb-1 font-medium">Profit Margin</p>
          <p className="text-3xl font-bold text-purple-900">{profit.margin.toFixed(1)}%</p>
          <p className="text-xs text-purple-600 mt-2">Net / Revenue</p>
        </div>
      </div>

      {/* P&L Statement */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Profit & Loss Statement</h3>
          <p className="text-sm text-gray-500 mt-1">
            {new Date(dateParams.startDate).toLocaleDateString()} - {new Date(dateParams.endDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Revenue Section */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Revenue</h4>
            <div className="space-y-2 ml-4">
              <PLRow label="Sales" amount={revenue.sales} />
              <PLRow label="Tax Collected" amount={revenue.tax} indent />
              <PLRow label="Service Charges" amount={revenue.serviceCharge} indent />
              <PLRow label="Total Revenue" amount={revenue.totalRevenue} bold />
            </div>
          </div>

          {/* Expenses Section */}
          <div>
            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Expenses</h4>
            <div className="space-y-2 ml-4">
              <PLRow label="Ingredients & Supplies" amount={expenses.ingredients} />
              <PLRow label="Utilities" amount={expenses.utilities} />
              <PLRow label="Payroll" amount={expenses.payroll} />
              <PLRow label="Rent" amount={expenses.rent} />
              <PLRow label="Marketing" amount={expenses.marketing} />
              <PLRow label="Maintenance" amount={expenses.maintenance} />
              <PLRow label="Other" amount={expenses.other} />
              <PLRow label="Total Expenses" amount={expenses.totalExpenses} bold danger />
            </div>
          </div>

          {/* Profit Section */}
          <div className="border-t-2 border-gray-300 pt-4">
            <PLRow label="Gross Profit" amount={profit.gross} bold large success />
            <PLRow label="Net Profit" amount={profit.net} bold large success />
          </div>
        </div>
      </div>

      {/* Visual Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { name: 'Revenue', amount: revenue.totalRevenue, fill: COLORS.primary },
              { name: 'Expenses', amount: expenses.totalExpenses, fill: COLORS.danger },
              { name: 'Profit', amount: profit.net, fill: profit.net >= 0 ? COLORS.primary : COLORS.danger },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Bar dataKey="amount" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function PLRow({ 
  label, 
  amount, 
  bold, 
  indent, 
  large, 
  success, 
  danger 
}: { 
  label: string; 
  amount: number; 
  bold?: boolean; 
  indent?: boolean;
  large?: boolean;
  success?: boolean;
  danger?: boolean;
}) {
  const formatCurrency = (amount: number) => {
    return `Br ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className={`flex items-center justify-between py-2 ${bold ? 'border-t border-gray-200' : ''}`}>
      <span className={`${indent ? 'ml-4 text-sm' : ''} ${bold ? 'font-bold' : ''} ${large ? 'text-lg' : 'text-sm'} ${success ? 'text-green-900' : danger ? 'text-red-900' : 'text-gray-700'}`}>
        {label}
      </span>
      <span className={`${bold ? 'font-bold' : ''} ${large ? 'text-lg' : 'text-sm'} ${success ? 'text-green-900' : danger ? 'text-red-900' : 'text-gray-900'}`}>
        {formatCurrency(amount)}
      </span>
    </div>
  );
}
