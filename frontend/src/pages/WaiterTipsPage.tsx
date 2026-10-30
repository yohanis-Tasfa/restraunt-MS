import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { tipsApi, TipStatus, type Tip } from '../api/tips';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import {
  DollarSign,
  Clock,
  CheckCircle,
  Banknote,
  CreditCard,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { format } from 'date-fns';
import { useTipNotifications } from '../hooks/useTipNotifications';

export default function WaiterTipsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');

  // Enable tip notifications
  useTipNotifications();

  // Calculate date filters
  const getDateFilters = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return {
          startDate: new Date(now.setHours(0, 0, 0, 0)).toISOString(),
          endDate: new Date(now.setHours(23, 59, 59, 999)).toISOString(),
        };
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return {
          startDate: weekAgo.toISOString(),
          endDate: new Date().toISOString(),
        };
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return {
          startDate: monthAgo.toISOString(),
          endDate: new Date().toISOString(),
        };
      default:
        return {};
    }
  };

  // Fetch my tips
  const { data: tipsData, isLoading } = useQuery({
    queryKey: ['my-tips', statusFilter, dateRange],
    queryFn: () =>
      tipsApi.getMyTips({
        status: statusFilter === 'all' ? undefined : (statusFilter as TipStatus),
        page: 1,
        limit: 50,
        ...getDateFilters(),
      }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch tip summary
  const { data: summary } = useQuery({
    queryKey: ['my-tip-summary', dateRange],
    queryFn: () => tipsApi.getMyTipSummary(getDateFilters()),
  });

  const tips = tipsData?.data || [];

  const getMethodIcon = (method: string) => {
    if (method === 'CASH') return <Banknote className="w-4 h-4" />;
    return <CreditCard className="w-4 h-4" />;
  };

  const getMethodColor = (method: string) => {
    switch (method?.toUpperCase()) {
      case 'CASH':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'TELEBIRR':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CBE_BIRR':
      case 'CBEBIRR':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: TipStatus) => {
    switch (status) {
      case TipStatus.PENDING:
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case TipStatus.PAID:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="w-7 h-7 text-green-600" />
          My Tips
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Track your transfer tips pending payout from manager
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tips</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {summary?.total.amount.toFixed(2) || '0.00'} ETB
              </p>
              <p className="text-xs text-gray-500">{summary?.total.count || 0} tips</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Payout</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {summary?.pending.amount.toFixed(2) || '0.00'} ETB
              </p>
              <p className="text-xs text-gray-500">Awaiting manager payout</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Paid Out</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {summary?.paid.amount.toFixed(2) || '0.00'} ETB
              </p>
              <p className="text-xs text-gray-500">{summary?.paid.count || 0} tips</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters: Status on Left, Period on Right */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        {/* Status Filter (Left) */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={
              statusFilter === 'all'
                ? 'bg-green-600 hover:bg-green-700 text-white font-medium'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          >
            All Tips
          </Button>
          <Button
            variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PENDING')}
            className={
              statusFilter === 'PENDING'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white font-medium'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          >
            <Clock className="w-4 h-4 mr-1.5" />
            Pending
          </Button>
          <Button
            variant={statusFilter === 'PAID' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PAID')}
            className={
              statusFilter === 'PAID'
                ? 'bg-green-600 hover:bg-green-700 text-white font-medium'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          >
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Paid
          </Button>
        </div>

        {/* Date Range Filter (Right) */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button
            variant={dateRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('all')}
            className={
              dateRange === 'all'
                ? 'bg-green-600 hover:bg-green-700 text-white font-medium'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          >
            <Calendar className="w-4 h-4 mr-1.5" />
            All Time
          </Button>
          <Button
            variant={dateRange === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('today')}
            className={
              dateRange === 'today'
                ? 'bg-green-600 hover:bg-green-700 text-white font-medium'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          >
            Today
          </Button>
          <Button
            variant={dateRange === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('week')}
            className={
              dateRange === 'week'
                ? 'bg-green-600 hover:bg-green-700 text-white font-medium'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          >
            This Week
          </Button>
          <Button
            variant={dateRange === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('month')}
            className={
              dateRange === 'month'
                ? 'bg-green-600 hover:bg-green-700 text-white font-medium'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Tips Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        {tips.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-400 mb-2">No transfer tips yet</div>
            <p className="text-sm text-gray-500">
              Transfer tips from customer payments will appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order Total
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date &amp; Time
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tip Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {tips.map((tip: Tip) => (
                  <tr key={tip.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Table */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                        {tip.order?.table?.number
                          ? (tip.order.table.number.toLowerCase().startsWith('t')
                              ? tip.order.table.number
                              : `Table ${tip.order.table.number}`)
                          : 'Takeout'}
                      </span>
                    </td>

                    {/* Order Total */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {(tip.order?.total ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB
                      </span>
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${getMethodColor(tip.method)}`}>
                        {getMethodIcon(tip.method)}
                        {tip.method}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col items-start gap-0.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(tip.status)}`}>
                          {tip.status}
                        </span>
                        {tip.status === TipStatus.PENDING && (
                          <span className="text-[11px] text-amber-700 font-medium">
                            ⏳ Waiting for payout
                          </span>
                        )}
                        {tip.status === TipStatus.PAID && tip.paidAt && (
                          <span className="text-[11px] text-gray-500">
                            Paid {format(new Date(tip.paidAt), 'MMM dd, yyyy')}
                            {tip.paidBy ? ` by ${tip.paidBy.firstName}` : ''}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date & Time */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="font-medium text-gray-900">
                        {format(new Date(tip.createdAt), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {format(new Date(tip.createdAt), 'HH:mm')}
                      </div>
                    </td>

                    {/* Tip Amount */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-xl font-bold text-green-600">
                        +{tip.amount.toFixed(2)} ETB
                      </div>
                      <div className="text-xs text-gray-400 font-medium">Tip received</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
