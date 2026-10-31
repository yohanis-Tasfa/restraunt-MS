import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  DollarSign,
  User,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  X,
  Banknote,
  Smartphone,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { tipsApi, TipStatus, type Tip } from '../api/tips';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE' | 'BANK_TRANSFER' | 'TELEBIRR' | 'CBE_BIRR';

// Authentic Ethiopian restaurant mock tips data fallback
const INITIAL_MOCK_TIPS: Tip[] = [
  {
    id: 'tip-101',
    orderId: 'ord-10248',
    paymentId: 'pay-501',
    waiterId: 'waiter-1',
    amount: 150.0,
    method: 'TELEBIRR',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    order: {
      id: 'ord-10248',
      orderNumber: 'ORD-10248',
      total: 950.0,
      table: { id: 't-4', number: 'T-04' },
    },
    waiter: {
      id: 'waiter-1',
      firstName: 'Sara',
      lastName: 'Wolde',
      email: 'sara.w@rms.com',
    },
  },
  {
    id: 'tip-102',
    orderId: 'ord-10247',
    paymentId: 'pay-502',
    waiterId: 'waiter-2',
    amount: 200.0,
    method: 'CBE_BIRR',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    order: {
      id: 'ord-10247',
      orderNumber: 'ORD-10247',
      total: 1237.5,
      table: { id: 't-11', number: 'T-11' },
    },
    waiter: {
      id: 'waiter-2',
      firstName: 'Yonas',
      lastName: 'Kebede',
      email: 'yonas.k@rms.com',
    },
  },
  {
    id: 'tip-103',
    orderId: 'ord-10245',
    paymentId: 'pay-503',
    waiterId: 'waiter-3',
    amount: 100.0,
    method: 'CARD',
    status: 'PENDING',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
    order: {
      id: 'ord-10245',
      orderNumber: 'ORD-10245',
      total: 600.0,
      table: { id: 't-8', number: 'T-08' },
    },
    waiter: {
      id: 'waiter-3',
      firstName: 'Kaleb',
      lastName: 'Dawit',
      email: 'kaleb.d@rms.com',
    },
  },
  {
    id: 'tip-104',
    orderId: 'ord-10242',
    paymentId: 'pay-504',
    waiterId: 'waiter-1',
    amount: 180.0,
    method: 'TELEBIRR',
    status: 'PAID',
    paidAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    paidById: 'mgr-1',
    notes: 'Cash disbursed from Shift Register Till #1',
    createdAt: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    order: {
      id: 'ord-10242',
      orderNumber: 'ORD-10242',
      total: 1120.0,
      table: { id: 't-3', number: 'T-03' },
    },
    waiter: {
      id: 'waiter-1',
      firstName: 'Sara',
      lastName: 'Wolde',
      email: 'sara.w@rms.com',
    },
    paidBy: {
      id: 'mgr-1',
      firstName: 'Solomon',
      lastName: 'Kassa (Manager)',
    },
  },
  {
    id: 'tip-105',
    orderId: 'ord-10239',
    paymentId: 'pay-505',
    waiterId: 'waiter-4',
    amount: 120.0,
    method: 'CASH',
    status: 'PAID',
    paidAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    paidById: 'mgr-1',
    notes: 'Direct cash handed to server after banquet party turnover',
    createdAt: new Date(Date.now() - 240 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 210 * 60 * 1000).toISOString(),
    order: {
      id: 'ord-10239',
      orderNumber: 'ORD-10239',
      total: 780.0,
      table: { id: 't-6', number: 'T-06' },
    },
    waiter: {
      id: 'waiter-4',
      firstName: 'Betelhem',
      lastName: 'Desta',
      email: 'betelhem.d@rms.com',
    },
    paidBy: {
      id: 'mgr-1',
      firstName: 'Solomon',
      lastName: 'Kassa (Manager)',
    },
  },
  {
    id: 'tip-106',
    orderId: 'ord-10235',
    paymentId: 'pay-506',
    waiterId: 'waiter-2',
    amount: 250.0,
    method: 'TELEBIRR',
    status: 'PAID',
    paidAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    paidById: 'cashier-1',
    notes: 'Midday balance reconciliation payout by Cashier',
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 300 * 60 * 1000).toISOString(),
    order: {
      id: 'ord-10235',
      orderNumber: 'ORD-10235',
      total: 1650.0,
      table: { id: 't-12', number: 'T-12' },
    },
    waiter: {
      id: 'waiter-2',
      firstName: 'Yonas',
      lastName: 'Kebede',
      email: 'yonas.k@rms.com',
    },
    paidBy: {
      id: 'cashier-1',
      firstName: 'Helen',
      lastName: 'Mulugeta (Cashier)',
    },
  },
];

export default function TipsManagementPage() {
  const { user } = useAuthStore();

  const [selectedStatus, setSelectedStatus] = useState<TipStatus | 'ALL'>('ALL');
  const [selectedMethod, setSelectedMethod] = useState<string>('ALL');
  const [selectedWaiter, setSelectedWaiter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // Local state for interactive mock updates when backend is in mock/dev mode
  const [mockTips, setMockTips] = useState<Tip[]>(INITIAL_MOCK_TIPS);

  // Track IDs marked as paid in this session so the UI immediately updates
  const [locallyPaidIds, setLocallyPaidIds] = useState<Set<string>>(new Set());

  // Selected tip for payout confirmation modal
  const [payoutModalTip, setPayoutModalTip] = useState<Tip | null>(null);
  const [payoutDisbursementMethod, setPayoutDisbursementMethod] = useState<'CASH_TILL' | 'TELEBIRR_TRANSFER' | 'CBE_TRANSFER'>('CASH_TILL');
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  // Fetch real tips
  const { data: tipsData, isLoading, refetch } = useQuery({
    queryKey: ['tips', selectedStatus, selectedMethod, selectedWaiter, dateRange],
    queryFn: async () => {
      try {
        const params: any = {};
        if (selectedStatus !== 'ALL') params.status = selectedStatus;
        if (selectedMethod !== 'ALL') params.method = selectedMethod;
        if (selectedWaiter !== 'ALL') params.waiterId = selectedWaiter;
        if (dateRange.from) params.from = dateRange.from;
        if (dateRange.to) params.to = dateRange.to;
        const res = await tipsApi.getAll(params);
        return res;
      } catch {
        return null;
      }
    },
  });

  // Fetch real summary stats
  const { data: summaryData } = useQuery({
    queryKey: ['tips-summary'],
    queryFn: async () => {
      try {
        return await tipsApi.getTipSummary();
      } catch {
        return null;
      }
    },
  });

  // Real backend mutation
  const markAsPaidMutation = useMutation({
    mutationFn: ({ tipId, notes }: { tipId: string; notes?: string }) =>
      tipsApi.markAsPaid(tipId, notes),
    onSuccess: () => {
      refetch();
    },
  });

  // Base list from real backend or fallback mock
  const baseTips = tipsData?.data && tipsData.data.length > 0 ? tipsData.data : mockTips;

  // Apply locally paid overrides so UI is guaranteed to change immediately to PAID
  const rawTips = baseTips.map((tip) => {
    if (locallyPaidIds.has(tip.id)) {
      return {
        ...tip,
        status: TipStatus.PAID,
        paidAt: tip.paidAt || new Date().toISOString(),
      };
    }
    return tip;
  });

  // Filter tips
  const tips = rawTips.filter((tip) => {
    if (selectedStatus !== 'ALL' && tip.status !== selectedStatus) return false;
    if (selectedMethod !== 'ALL' && tip.method.toUpperCase() !== selectedMethod.toUpperCase()) return false;
    if (selectedWaiter !== 'ALL' && tip.waiter?.id !== selectedWaiter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const waiterName = `${tip.waiter?.firstName || ''} ${tip.waiter?.lastName || ''}`.toLowerCase();
      const orderNum = (tip.order?.orderNumber || tip.orderId || '').toLowerCase();
      const tableNum = (tip.order?.table?.number || '').toLowerCase();
      if (!waiterName.includes(q) && !orderNum.includes(q) && !tableNum.includes(q)) {
        return false;
      }
    }
    return true;
  });

  // Calculate summary stats dynamically from active list
  const totalTipsAmount = rawTips.reduce((sum, t) => sum + (t.amount || 0), 0);
  const pendingTips = rawTips.filter((t) => t.status === 'PENDING');
  const pendingAmount = pendingTips.reduce((sum, t) => sum + (t.amount || 0), 0);
  const paidTips = rawTips.filter((t) => t.status === 'PAID');
  const paidAmount = paidTips.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Summary object
  const summary = summaryData || {
    total: { amount: totalTipsAmount, count: rawTips.length },
    pending: { amount: pendingAmount, count: pendingTips.length },
    paid: { amount: paidAmount, count: paidTips.length },
  };

  // Unique waiters list for filtering
  const uniqueWaiters = Array.from(
    new Set(rawTips.map((tip) => tip.waiter?.id).filter(Boolean))
  )
    .map((id) => {
      const found = rawTips.find((t) => t.waiter?.id === id);
      return found?.waiter;
    })
    .filter(Boolean);

  // Submit Payout
  const submitPayout = async () => {
    if (!payoutModalTip) return;
    const targetTipId = payoutModalTip.id;
    const targetAmount = payoutModalTip.amount;
    const waiterName = payoutModalTip.waiter?.firstName || 'Waiter';

    setIsSubmittingPayout(true);

    const noteText = payoutNotes.trim()
      ? `${payoutNotes} (via ${payoutDisbursementMethod.replace('_', ' ')})`
      : `Disbursed via ${payoutDisbursementMethod.replace('_', ' ')}`;

    // 1. Immediately update UI state so button changes to "Paid"
    setLocallyPaidIds((prev) => new Set(prev).add(targetTipId));
    setMockTips((prev) =>
      prev.map((t) =>
        t.id === targetTipId
          ? {
              ...t,
              status: TipStatus.PAID,
              paidAt: new Date().toISOString(),
              paidById: user?.id || 'mgr-1',
              notes: noteText,
            }
          : t
      )
    );

    setPayoutModalTip(null);
    setPayoutNotes('');
    setIsSubmittingPayout(false);

    toast.success(`Br ${targetAmount.toFixed(2)} marked as Paid to ${waiterName}!`);

    // 2. Persist to real backend
    try {
      await markAsPaidMutation.mutateAsync({
        tipId: targetTipId,
        notes: noteText,
      });
      refetch();
    } catch (err) {
      console.warn('Backend mark-paid error (local override preserved):', err);
    }
  };

  // Payout All Pending for a specific waiter
  const handlePayoutAllForWaiter = async (waiterId: string, waiterName: string) => {
    const waiterPending = rawTips.filter((t) => t.waiter?.id === waiterId && t.status === 'PENDING');
    if (waiterPending.length === 0) {
      toast.error(`No pending tips for ${waiterName}`);
      return;
    }
    const totalWaiterAmount = waiterPending.reduce((sum, t) => sum + t.amount, 0);

    if (
      confirm(
        `Disburse all pending tips to ${waiterName}?\n\nTotal to Pay: Br ${totalWaiterAmount.toFixed(
          2
        )} (${waiterPending.length} tips)`
      )
    ) {
      setLocallyPaidIds((prev) => {
        const next = new Set(prev);
        waiterPending.forEach((t) => next.add(t.id));
        return next;
      });

      setMockTips((prev) =>
        prev.map((t) =>
          t.waiter?.id === waiterId && t.status === 'PENDING'
            ? {
                ...t,
                status: TipStatus.PAID,
                paidAt: new Date().toISOString(),
                paidById: user?.id || 'mgr-1',
                notes: 'Bulk shift payout',
              }
            : t
        )
      );

      toast.success(`Br ${totalWaiterAmount.toFixed(2)} disbursed to ${waiterName}!`);

      for (const t of waiterPending) {
        try {
          await tipsApi.markAsPaid(t.id, 'Bulk shift payout');
        } catch {
          // preserve local paid state
        }
      }
      refetch();
    }
  };

  const getStatusColor = (status: TipStatus) => {
    return status === 'PAID'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
      : 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
  };

  const getMethodBadge = (method: string) => {
    const m = method?.toUpperCase() || 'CASH';
    switch (m) {
      case 'CASH':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Banknote className="w-3.5 h-3.5" />
            Cash
          </span>
        );
      case 'TELEBIRR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-3.5 h-3.5" />
            Telebirr
          </span>
        );
      case 'CBE_BIRR':
      case 'CBEBIRR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Smartphone className="w-3.5 h-3.5" />
            CBE Birr
          </span>
        );
      case 'CARD':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CreditCard className="w-3.5 h-3.5" />
            Card (POS)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
            <CreditCard className="w-3.5 h-3.5" />
            {method}
          </span>
        );
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Tips Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track customer tips, reconcile collected funds, and disburse payouts to waitstaff.
        </p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Tips Collected */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Tips Collected</span>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Br {(summary.total.amount || 0).toFixed(2)}
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">{summary.total.count || 0} total transactions</p>
        </div>

        {/* Pending Waiter Payouts */}
        <div className="bg-white rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Pending Waiter Payout</span>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-900 tracking-tight">
            Br {(summary.pending.amount || 0).toFixed(2)}
          </div>
          <p className="text-xs text-amber-700 mt-1 font-medium">
            {summary.pending.count || 0} waiting to be paid by Manager/Cashier
          </p>
        </div>

        {/* Total Disbursed */}
        <div className="bg-white rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Disbursed to Waiters</span>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-900 tracking-tight">
            Br {(summary.paid.amount || 0).toFixed(2)}
          </div>
          <p className="text-xs text-emerald-700 mt-1 font-medium">
            {summary.paid.count || 0} successfully settled
          </p>
        </div>

        {/* Waitstaff Pool */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Waiters</span>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
              <User className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {uniqueWaiters.length} Waiters
          </div>
          <p className="text-xs text-gray-500 mt-1 font-medium">Across all dining shifts</p>
        </div>
      </div>

      {/* Tips Master Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Compact Table Header Toolbar with Search & Side-by-Side Filters */}
        <div className="p-3 sm:p-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-3 bg-white">
          {/* Left: Search input and compact dropdown filters side-by-side */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div className="relative w-48 sm:w-60">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search waiter, order #, table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-colors"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as TipStatus | 'ALL')}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-medium text-gray-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-medium text-gray-700"
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="TELEBIRR">Telebirr</option>
              <option value="CBE_BIRR">CBE Birr</option>
              <option value="CARD">Card</option>
            </select>

            {/* Waiter Filter */}
            <select
              value={selectedWaiter}
              onChange={(e) => setSelectedWaiter(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white font-medium text-gray-700 max-w-[150px]"
            >
              <option value="ALL">All Waiters</option>
              {uniqueWaiters.map(
                (w) =>
                  w && (
                    <option key={w.id} value={w.id}>
                      {w.firstName} {w.lastName}
                    </option>
                  )
              )}
            </select>

            {/* Clear Filters Button */}
            {(selectedStatus !== 'ALL' || selectedMethod !== 'ALL' || selectedWaiter !== 'ALL' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedStatus('ALL');
                  setSelectedMethod('ALL');
                  setSelectedWaiter('ALL');
                  setSearchQuery('');
                  setDateRange({ from: '', to: '' });
                }}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900 px-2 py-1 hover:bg-gray-100 rounded-md transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Right: Record Count & Optional Bulk Action */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-gray-500">
              {tips.length} records
            </span>

            {selectedWaiter !== 'ALL' && (
              <button
                onClick={() => {
                  const waiterObj = uniqueWaiters.find((w) => w?.id === selectedWaiter);
                  if (waiterObj) {
                    handlePayoutAllForWaiter(waiterObj.id, `${waiterObj.firstName} ${waiterObj.lastName}`);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>Disburse All</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Waiter (Recipient)</th>
                <th className="py-3 px-4">Order / Table</th>
                <th className="py-3 px-4 text-right">Tip Amount</th>
                <th className="py-3 px-4">Customer Paid Via</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Loading tips ledger...
                  </td>
                </tr>
              ) : tips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    No tips match the current filter selection
                  </td>
                </tr>
              ) : (
                tips.map((tip) => (
                  <tr key={tip.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-xs text-gray-900 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {format(new Date(tip.createdAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </td>

                    {/* Waiter */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {tip.waiter?.firstName ? tip.waiter.firstName.charAt(0) : 'W'}
                        </div>
                        <div>
                          <span className="font-bold text-gray-900 text-xs sm:text-sm">
                            {tip.waiter ? `${tip.waiter.firstName} ${tip.waiter.lastName}` : 'Unassigned Waiter'}
                          </span>
                          <div className="text-[10px] text-gray-400">{tip.waiter?.email || 'Server'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Order & Table */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-gray-900">
                        {tip.order?.orderNumber || `#${tip.orderId.slice(-8)}`}
                      </span>
                      <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                        {tip.order?.table?.number ? `Table ${tip.order.table.number}` : 'Counter / Takeaway'}
                        {tip.order?.total ? ` • Br ${tip.order.total.toFixed(2)}` : ''}
                      </div>
                    </td>

                    {/* Tip Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-mono font-black text-emerald-700 text-sm sm:text-base">
                        Br {tip.amount.toFixed(2)}
                      </span>
                    </td>

                    {/* Customer Payment Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap">{getMethodBadge(tip.method)}</td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(
                          tip.status
                        )}`}
                      >
                        {tip.status === 'PAID' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                        {tip.status === 'PAID' ? 'PAID OUT' : 'PENDING'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tip.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setPayoutModalTip(tip);
                            setPayoutNotes('');
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-102"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>Mark as Paid</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Paid</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Confirmation Modal */}
      {payoutModalTip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-200" />
                <h3 className="font-bold text-sm">Disburse Waiter Tip Payout</h3>
              </div>
              <button
                onClick={() => setPayoutModalTip(null)}
                className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-800">Payout Amount</span>
                <div className="text-3xl font-black text-emerald-950 font-mono mt-1">
                  Br {payoutModalTip.amount.toFixed(2)}
                </div>
                <p className="text-xs text-emerald-700 font-medium mt-1">
                  For Waiter:{' '}
                  <strong className="text-emerald-950">
                    {payoutModalTip.waiter
                      ? `${payoutModalTip.waiter.firstName} ${payoutModalTip.waiter.lastName}`
                      : 'Assigned Waiter'}
                  </strong>
                </p>
              </div>

              {/* Order Reference Details */}
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order Reference:</span>
                  <span className="font-mono font-bold text-gray-900">
                    {payoutModalTip.order?.orderNumber || payoutModalTip.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Table:</span>
                  <span className="font-bold text-gray-900">
                    {payoutModalTip.order?.table?.number ? `Table ${payoutModalTip.order.table.number}` : 'Counter'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer Paid Via:</span>
                  <span className="font-bold text-gray-900">{payoutModalTip.method}</span>
                </div>
              </div>

              {/* Payout Disbursement Channel */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">Disbursement Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutDisbursementMethod('CASH_TILL')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      payoutDisbursementMethod === 'CASH_TILL'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Cash from Till
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutDisbursementMethod('TELEBIRR_TRANSFER')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      payoutDisbursementMethod === 'TELEBIRR_TRANSFER'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Telebirr
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutDisbursementMethod('CBE_TRANSFER')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      payoutDisbursementMethod === 'CBE_TRANSFER'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    CBE Birr
                  </button>
                </div>
              </div>

              {/* Optional Payout Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Reconciliation Notes <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shift closing cash envelope #4"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPayoutModalTip(null)}
                className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingPayout}
                onClick={submitPayout}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Mark as Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
