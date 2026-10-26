import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import { DollarSign, User, Calendar, CreditCard, CheckCircle, Clock, Filter, Download } from 'lucide-react';
import { tipsApi, TipStatus } from '../api/tips';
import toast from 'react-hot-toast';

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE' | 'BANK_TRANSFER' | 'TELEBIRR' | 'CBE_BIRR';

export default function TipsManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<TipStatus | 'ALL'>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | 'ALL'>('ALL');
  const [selectedWaiter, setSelectedWaiter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Fetch all tips
  const { data: tipsData, isLoading, refetch } = useQuery({
    queryKey: ['tips', selectedStatus, selectedMethod, selectedWaiter, dateRange],
    queryFn: () => {
      const params: any = {};
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedMethod !== 'ALL') params.method = selectedMethod;
      if (selectedWaiter !== 'ALL') params.waiterId = selectedWaiter;
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;
      return tipsApi.getAll(params);
    },
  });

  // Fetch summary stats
  const { data: summaryData } = useQuery({
    queryKey: ['tips-summary'],
    queryFn: () => tipsApi.getTipSummary(),
  });

  // Mark tip as paid mutation
  const markAsPaidMutation = useMutation({
    mutationFn: (tipId: string) => tipsApi.markAsPaid(tipId),
    onSuccess: () => {
      toast.success('Tip marked as paid');
      refetch();
    },
    onError: () => {
      toast.error('Failed to mark tip as paid');
    },
  });

  const tips = tipsData?.data || [];
  const summary = summaryData;

  // Get unique waiters for filter
  const uniqueWaiters = Array.from(
    new Set(tips.map((tip) => tip.waiter.id))
  ).map((id) => {
    const tip = tips.find((t) => t.waiter.id === id);
    return tip?.waiter;
  }).filter(Boolean);

  const handleMarkAsPaid = (tipId: string) => {
    if (confirm('Mark this tip as paid? This action cannot be undone.')) {
      markAsPaidMutation.mutate(tipId);
    }
  };

  const getStatusColor = (status: TipStatus) => {
    return status === 'PAID' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-yellow-100 text-yellow-800';
  };

  const getMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'CASH':
        return 'bg-blue-100 text-blue-800';
      case 'CARD':
        return 'bg-purple-100 text-purple-800';
      case 'MOBILE':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tips Management</h1>
          <p className="text-gray-600 mt-1">Track and pay out transfer tips to waiters</p>
        </div>
        <button
          onClick={() => {/* TODO: Export to Excel */}}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tips</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {(summary.total.amount || 0).toFixed(2)} ETB
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payout</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {(summary.pending.amount || 0).toFixed(2)} ETB
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Out</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {(summary.paid.amount || 0).toFixed(2)} ETB
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tips</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary.total.count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TipStatus | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value as PaymentMethod | 'ALL')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="MOBILE">Mobile</option>
            </select>
          </div>

          {/* Waiter Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waiter
            </label>
            <select
              value={selectedWaiter}
              onChange={(e) => setSelectedWaiter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="ALL">All Waiters</option>
              {uniqueWaiters.map((waiter) => waiter && (
                <option key={waiter.id} value={waiter.id}>
                  {waiter.firstName} {waiter.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tips Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Waiter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading tips...
                  </td>
                </tr>
              ) : tips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No tips found
                  </td>
                </tr>
              ) : (
                tips.map((tip) => (
                  <tr key={tip.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(tip.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {tip.waiter.firstName} {tip.waiter.lastName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{tip.orderId.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {tip.amount.toFixed(2)} ETB
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getMethodColor(tip.method)}`}>
                        <CreditCard className="w-3 h-3" />
                        {tip.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tip.status)}`}>
                        {tip.status === 'PAID' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        {tip.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {tip.status === 'PENDING' ? (
                        <button
                          onClick={() => handleMarkAsPaid(tip.id)}
                          disabled={markAsPaidMutation.isPending}
                          className="text-green-600 hover:text-green-900 font-medium disabled:opacity-50"
                        >
                          Mark as Paid
                        </button>
                      ) : tip.status === 'PAID' && tip.paidBy ? (
                        <div className="text-xs text-gray-500">
                          Paid by {tip.paidBy.firstName} {tip.paidBy.lastName}
                          <br />
                          {tip.paidAt && format(new Date(tip.paidAt), 'MMM dd, HH:mm')}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
