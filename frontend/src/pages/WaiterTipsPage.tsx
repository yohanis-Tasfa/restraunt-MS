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
    <div className="p-3 sm:p-5 md:p-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="bg-white dark:bg-[#091a13] p-3.5 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-[#143225] shadow-xs mb-4 sm:mb-6">
        <div>
          <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
            My Tips
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Track your transfer tips pending payout from manager
          </p>
        </div>
      </div>

      {/* Summary Cards - Balanced 3-column row on Mobile & Desktop */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
        {/* Card 1: Total Tips */}
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${statusFilter === 'all'
              ? 'bg-emerald-50/80 dark:bg-[#071a12] border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-emerald-300/80 hover:bg-emerald-50/20 dark:hover:bg-[#0c2219]'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              Total Tips
            </span>
            {statusFilter === 'all' && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            )}
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-sm sm:text-2xl font-bold text-emerald-600 dark:text-[#00e676] mt-0.5 truncate">
              {summary?.total.amount.toFixed(2) || '0.00'}{' '}
              <span className="text-[10px] sm:text-xs font-normal">ETB</span>
            </p>
            <p className="text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {summary?.total.count || 0} tips
            </p>
          </div>
        </div>

        {/* Card 2: Pending Payout */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${statusFilter === 'PENDING'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-amber-300/80 hover:bg-amber-50/20 dark:hover:bg-amber-950/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 truncate">
              Pending Payout
            </span>
            {statusFilter === 'PENDING' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            )}
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-sm sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 truncate">
              {summary?.pending.amount.toFixed(2) || '0.00'}{' '}
              <span className="text-[10px] sm:text-xs font-normal">ETB</span>
            </p>
            <p className="text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              Awaiting payout
            </p>
          </div>
        </div>

        {/* Card 3: Paid Out */}
        <div
          onClick={() => setStatusFilter('PAID')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${statusFilter === 'PAID'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-blue-300/80 hover:bg-blue-50/20 dark:hover:bg-blue-950/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-blue-700 dark:text-blue-400 truncate">
              Paid Out
            </span>
            {statusFilter === 'PAID' && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
            )}
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-sm sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate">
              {summary?.paid.amount.toFixed(2) || '0.00'}{' '}
              <span className="text-[10px] sm:text-xs font-normal">ETB</span>
            </p>
            <p className="text-[9px] sm:text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {summary?.paid.count || 0} tips
            </p>
          </div>
        </div>
      </div>

      {/* Restructured Filters: Status Pills + Date Period Tabs */}
      <div className="bg-white dark:bg-[#091a13] p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-[#143225] shadow-xs space-y-2.5 mb-4 sm:mb-6">
        {/* Tier 1: Status Filter Segmented Controls */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${statusFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-[#00e676] dark:text-[#032314] shadow-xs'
                  : 'bg-gray-100/90 dark:bg-[#071a12] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#0c2219]'
                }`}
            >
              All Tips ({summary?.total.count || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Pending ({summary?.pending.count || 0})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PAID')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${statusFilter === 'PAID'
                  ? 'bg-emerald-600 text-white dark:bg-[#00e676] dark:text-[#032314] shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-[#00e676] hover:bg-emerald-100 dark:hover:bg-[#0c2219]'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Paid ({summary?.paid.count || 0})
            </button>
          </div>
        </div>

        {/* Tier 2: Date Period Quick Buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-gray-100 dark:border-[#143225]/60 overflow-x-auto no-scrollbar">
          {(['all', 'today', 'week', 'month'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setDateRange(period)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${dateRange === period
                  ? 'bg-emerald-600 text-white dark:bg-[#00e676] dark:text-[#032314] font-bold shadow-2xs'
                  : 'bg-gray-100/80 dark:bg-[#071a12] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#0c2219]'
                }`}
            >
              {period === 'all' && (
                <>
                  <Calendar className="w-3 h-3" />
                  <span>All Time</span>
                </>
              )}
              {period === 'today' && 'Today'}
              {period === 'week' && 'This Week'}
              {period === 'month' && 'This Month'}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Table */}
      <div className="bg-white dark:bg-[#091a13] rounded-2xl border border-gray-200/80 dark:border-[#143225] overflow-hidden shadow-xs w-full">
        {tips.length === 0 ? (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <div className="text-gray-700 dark:text-gray-300 font-semibold mb-2">No transfer tips yet</div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Transfer tips from customer payments will appear here
            </p>
          </div>
        ) : (
          <div className="w-full">
            {/* Table Header: Tip on far left so it is NEVER cut off */}
            <div className="grid grid-cols-[115px_50px_85px_1fr] md:grid-cols-[140px_75px_120px_130px_120px_1fr] gap-2 md:gap-4 px-3 sm:px-5 py-3 bg-gray-50/90 dark:bg-[#07150f] border-b border-gray-200 dark:border-[#143225] text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider items-center">
              <div>Tip Amount</div>
              <div>Table</div>
              <div>Status</div>
              <div className="text-right md:text-left">Method</div>
              <div className="hidden md:block">Order Total</div>
              <div className="hidden md:block text-right">Date &amp; Time</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-200 dark:divide-[#143225]">
              {tips.map((tip: Tip) => (
                <div
                  key={tip.id}
                  className="grid grid-cols-[115px_50px_85px_1fr] md:grid-cols-[140px_75px_120px_130px_120px_1fr] gap-2 md:gap-4 px-3 sm:px-5 py-3.5 hover:bg-gray-50/80 dark:hover:bg-[#0c2f21]/30 transition-colors items-center text-sm"
                >
                  {/* 1. Tip Amount (Far Left!) */}
                  <div>
                    <div className="font-extrabold text-emerald-600 dark:text-[#00e676] text-sm sm:text-base">
                      +{tip.amount.toFixed(2)} ETB
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 md:hidden mt-0.5">
                      {format(new Date(tip.createdAt), 'MMM d, HH:mm')}
                    </div>
                  </div>

                  {/* 2. Table */}
                  <div>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-gray-100 dark:bg-[#071a12] text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-[#143225]">
                      {tip.order?.table?.number
                        ? (tip.order.table.number.toLowerCase().startsWith('t')
                          ? tip.order.table.number
                          : `T${tip.order.table.number}`)
                        : 'Takeout'}
                    </span>
                    {tip.order?.total && (
                      <div className="text-[10px] text-gray-400 dark:text-gray-500 md:hidden mt-0.5">
                        {tip.order.total.toFixed(0)} ETB
                      </div>
                    )}
                  </div>

                  {/* 3. Status */}
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold border ${getStatusColor(tip.status)}`}>
                      {tip.status}
                    </span>
                  </div>

                  {/* 4. Payment Method */}
                  <div className="text-right md:text-left">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium border ${getMethodColor(tip.method)}`}>
                      {getMethodIcon(tip.method)}
                      <span className="truncate">{tip.method}</span>
                    </span>
                  </div>

                  {/* 5. Order Total (Desktop only) */}
                  <div className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {(tip.order?.total ?? 0).toFixed(2)} ETB
                  </div>

                  {/* 6. Date & Time (Desktop only) */}
                  <div className="hidden md:block text-right text-xs text-gray-500 dark:text-gray-400">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(tip.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div>{format(new Date(tip.createdAt), 'HH:mm')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
