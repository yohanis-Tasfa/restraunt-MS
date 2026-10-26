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
    if (method === 'CASH') return 'bg-green-100 text-green-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getStatusColor = (status: TipStatus) => {
    switch (status) {
      case TipStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700';
      case TipStatus.PAID:
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
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

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={
              statusFilter === 'all'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
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
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            <Clock className="w-4 h-4 mr-1" />
            Pending
          </Button>
          <Button
            variant={statusFilter === 'PAID' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PAID')}
            className={
              statusFilter === 'PAID'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Paid
          </Button>
        </div>

        {/* Date Range Filter */}
        <div className="flex gap-2">
          <Button
            variant={dateRange === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('all')}
            className={
              dateRange === 'all'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            <Calendar className="w-4 h-4 mr-1" />
            All Time
          </Button>
          <Button
            variant={dateRange === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateRange('today')}
            className={
              dateRange === 'today'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
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
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
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
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            This Month
          </Button>
        </div>
      </div>

      {/* Tips List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {tips.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-400 mb-2">No transfer tips yet</div>
            <p className="text-sm text-gray-500">
              Transfer tips from customer payments will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tips.map((tip: Tip) => (
              <div
                key={tip.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${getMethodColor(tip.method)} font-normal text-xs`}>
                        <span className="flex items-center gap-1">
                          {getMethodIcon(tip.method)}
                          {tip.method}
                        </span>
                      </Badge>
                      <Badge className={`${getStatusColor(tip.status)} font-normal text-xs`}>
                        {tip.status}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {format(new Date(tip.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600">Order</p>
                        <p className="font-medium text-sm text-gray-900">
                          #{tip.order?.orderNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Table</p>
                        <p className="font-medium text-sm text-gray-900">
                          {tip.order?.table?.number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Order Total</p>
                        <p className="font-medium text-sm text-gray-900">
                          {tip.order?.total.toFixed(2)} ETB
                        </p>
                      </div>
                    </div>

                    {tip.status === TipStatus.PAID && tip.paidAt && (
                      <div className="mt-2 text-xs text-gray-500">
                        Paid on {format(new Date(tip.paidAt), 'MMM dd, yyyy')} by{' '}
                        {tip.paidBy?.firstName} {tip.paidBy?.lastName}
                      </div>
                    )}

                    {tip.status === TipStatus.PENDING && (
                      <div className="mt-2 text-xs text-yellow-600">
                        ⏳ Waiting for manager to pay out
                      </div>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-green-600">
                      {tip.amount.toFixed(2)} ETB
                    </p>
                    <p className="text-xs text-gray-500">Tip amount</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
