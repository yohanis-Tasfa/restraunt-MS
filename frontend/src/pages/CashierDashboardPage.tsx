import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  DollarSign,
  CreditCard,
  Clock,
  TrendingUp,
  FileText,
  Printer,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Banknote,
  Coins,
  ArrowDownToLine,
  UserCheck,
  Check,
  Users,
} from 'lucide-react';
import { billRequestsApi } from '../api/billRequests';
import { useBillRequestNotifications } from '../hooks/useBillRequestNotifications';
import toast from 'react-hot-toast';

export default function CashierDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Listen for real-time bill requests from waiters
  useBillRequestNotifications();

  // Query pending bill requests count (real API with fallback)
  const { data: pendingCountData } = useQuery({
    queryKey: ['bill-requests', 'pending-count'],
    queryFn: () => billRequestsApi.getPendingCount(),
    refetchInterval: 4000,
  });

  const pendingBillsCount =
    typeof pendingCountData === 'number'
      ? pendingCountData
      : (pendingCountData as any)?.count || 3;

  // Active Tab for live queues: 'bill_requests' | 'waiter_handovers'
  const [activeQueueTab, setActiveQueueTab] = useState<'bill_requests' | 'waiter_handovers'>('bill_requests');

  // Modal States
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [selectedBillForPrint, setSelectedBillForPrint] = useState<any | null>(null);
  const [isCashDropModalOpen, setIsCashDropModalOpen] = useState(false);
  const [cashDropAmount, setCashDropAmount] = useState('500');
  const [cashDropNote, setCashDropNote] = useState('Cash handover to manager / safe');

  // ---------------------------------------------------------------------------
  // Realistic Ethiopian Restaurant Cashier Operations Data (Table-Side Model)
  // ---------------------------------------------------------------------------
  const cashierName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : 'Dawit Legesse';
  const branchName = user?.branch?.name || 'Main Branch (Bole, Addis Ababa)';

  // Cash Drawer / Till Balance Data
  const [drawerStats, setDrawerStats] = useState({
    startingFloat: 2000.0,
    cashSales: 5370.0,
    cashDrops: 500.0, // Handover to manager / safe deposit
    expectedInTill: 6870.0, // 2000 + 5370 - 500
  });

  // Payment Breakdown: Cash vs Telebirr vs CBE Birr
  const paymentBreakdown = {
    telebirr: { amount: 6420.0, count: 17, percentage: 38.8 },
    cash: { amount: 5370.0, count: 14, percentage: 32.5 },
    cbe: { amount: 4750.0, count: 11, percentage: 28.7 },
    totalDigital: 11170.0, // Telebirr + CBE Birr
    totalSales: 16540.0,
    totalTransactions: 42,
    avgTicket: 393.81,
    salesChange: 14.2,
  };

  // Pending Bill Requests Queue (Waiters requesting printed bills for tables)
  const [billRequests, setBillRequests] = useState([
    {
      id: 'BR-1049',
      orderId: 'ORD-10252',
      tableNumber: '4',
      waiterName: 'Samuel H.',
      total: 980.0,
      waitTime: '2m ago',
      guestCount: 3,
      items: [
        { name: 'Special Beef Tibs', quantity: 2, price: 340.0 },
        { name: 'Injera Plate', quantity: 4, price: 25.0 },
        { name: 'St. George Beer', quantity: 2, price: 100.0 },
      ],
    },
    {
      id: 'BR-1048',
      orderId: 'ORD-10253',
      tableNumber: '10',
      waiterName: 'Hellen T.',
      total: 3810.0,
      waitTime: '5m ago',
      guestCount: 6,
      items: [
        { name: 'Kitfo Special Deluxe', quantity: 2, price: 620.0 },
        { name: 'Shekla Tibs Premium', quantity: 2, price: 580.0 },
        { name: 'Tej Decanter (1L)', quantity: 2, price: 350.0 },
        { name: 'Traditional Buna Ceremony', quantity: 1, price: 250.0 },
        { name: 'Awaze Tibs', quantity: 1, price: 460.0 },
      ],
    },
    {
      id: 'BR-1047',
      orderId: 'ORD-10254',
      tableNumber: '2',
      waiterName: 'Dawit L.',
      total: 620.0,
      waitTime: '8m ago',
      guestCount: 2,
      items: [
        { name: 'Doro Wat Deluxe', quantity: 1, price: 420.0 },
        { name: 'Ayib & Gomen', quantity: 1, price: 120.0 },
        { name: 'Ambo Water (0.5L)', quantity: 2, price: 40.0 },
      ],
    },
  ]);

  // Floor Waiters Cash Handover Tracker
  // (What physical cash each floor waiter collected at tables today and owes to the cashier till)
  const [waiterHandovers, setWaiterHandovers] = useState([
    {
      id: 'WH-01',
      waiterName: 'Samuel H.',
      tablesServed: 'Tables 4, 8, 11',
      cashOrdersCount: 5,
      totalCashCollected: 3370.0,
      status: 'PENDING', // PENDING or RECEIVED
      timeLogged: '11:10 AM',
    },
    {
      id: 'WH-02',
      waiterName: 'Hellen T.',
      tablesServed: 'Tables 2, 6, 10',
      cashOrdersCount: 3,
      totalCashCollected: 2000.0,
      status: 'RECEIVED',
      timeLogged: '10:45 AM',
      receivedAt: '10:48 AM',
    },
    {
      id: 'WH-03',
      waiterName: 'Dawit L.',
      tablesServed: 'Tables 1, 3',
      cashOrdersCount: 1,
      totalCashCollected: 620.0,
      status: 'PENDING',
      timeLogged: '10:55 AM',
    },
  ]);

  // Handler: Accept Waiter Cash Handover into Till
  const handleAcceptHandover = (handoverId: string) => {
    const item = waiterHandovers.find((w) => w.id === handoverId);
    if (!item) return;

    setWaiterHandovers((prev) =>
      prev.map((w) =>
        w.id === handoverId
          ? { ...w, status: 'RECEIVED', receivedAt: format(new Date(), 'hh:mm a') }
          : w
      )
    );

    toast.success(
      `Accepted Br ${item.totalCashCollected.toFixed(2)} cash from Waiter ${item.waiterName}! Till balance updated.`
    );
  };

  // Handler: Print Bill & Complete Request
  const handlePrintBill = (bill: any) => {
    window.print();
    toast.success(`Bill printed for Table ${bill.tableNumber}! Handing over to Waiter ${bill.waiterName}`);
    setSelectedBillForPrint(null);
  };

  // Handler: Cash Drop to Manager Safe
  const handleRecordCashDrop = () => {
    const amountNum = parseFloat(cashDropAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid cash drop amount');
      return;
    }
    setDrawerStats((prev) => ({
      ...prev,
      cashDrops: prev.cashDrops + amountNum,
      expectedInTill: prev.expectedInTill - amountNum,
    }));
    toast.success(`Br ${amountNum.toFixed(2)} cash handover to manager / safe recorded successfully.`);
    setIsCashDropModalOpen(false);
  };

  // Recent Completed Transactions (Receipts feed)
  const recentTransactions = [
    {
      id: 'REC-10251',
      orderNumber: 'ORD-10251',
      tableNumber: 'Table 4',
      customerName: 'Yared Haile',
      waiterName: 'Samuel H.',
      amount: 980.0,
      method: 'TELEBIRR',
      refCode: 'TLB-89302194',
      time: '11:08 AM',
      date: 'Oct 30, 2026',
      items: [
        { name: 'Special Beef Tibs', qty: 2, price: 340.0 },
        { name: 'Injera Plate', qty: 4, price: 25.0 },
        { name: 'St. George Beer', qty: 2, price: 100.0 },
      ],
    },
    {
      id: 'REC-10250',
      orderNumber: 'ORD-10250',
      tableNumber: 'Table 2',
      customerName: 'Hellen Tadesse',
      waiterName: 'Dawit L.',
      amount: 620.0,
      method: 'CASH',
      refCode: 'CASH-HANDOVER',
      time: '10:52 AM',
      date: 'Oct 30, 2026',
      items: [
        { name: 'Doro Wat Deluxe', qty: 1, price: 420.0 },
        { name: 'Ayib & Gomen', qty: 1, price: 120.0 },
        { name: 'Ambo Water', qty: 2, price: 40.0 },
      ],
    },
    {
      id: 'REC-10249',
      orderNumber: 'ORD-10249',
      tableNumber: 'Table 10',
      customerName: 'Sara Mekonnen',
      waiterName: 'Hellen T.',
      amount: 3810.0,
      method: 'CBE_BIRR',
      refCode: 'CBE-49102830',
      time: '10:35 AM',
      date: 'Oct 30, 2026',
      items: [
        { name: 'Kitfo Special Deluxe', qty: 2, price: 620.0 },
        { name: 'Shekla Tibs Premium', qty: 2, price: 580.0 },
        { name: 'Tej Decanter (1L)', qty: 2, price: 350.0 },
        { name: 'Traditional Buna Ceremony', qty: 1, price: 250.0 },
        { name: 'Awaze Tibs', qty: 1, price: 460.0 },
      ],
    },
    {
      id: 'REC-10248',
      orderNumber: 'ORD-10248',
      tableNumber: 'Takeaway #12',
      customerName: 'Dawit Legesse',
      waiterName: 'Takeout Desk',
      amount: 530.0,
      method: 'TELEBIRR',
      refCode: 'TLB-10398421',
      time: '10:14 AM',
      date: 'Oct 30, 2026',
      items: [
        { name: 'Awaze Tibs', qty: 1, price: 450.0 },
        { name: 'Ambo Water', qty: 2, price: 40.0 },
      ],
    },
    {
      id: 'REC-10247',
      orderNumber: 'ORD-10247',
      tableNumber: 'Table 8',
      customerName: 'Almaz Tefera',
      waiterName: 'Samuel H.',
      amount: 1250.0,
      method: 'CASH',
      refCode: 'CASH-HANDOVER',
      time: '09:48 AM',
      date: 'Oct 30, 2026',
      items: [
        { name: 'Shekla Tibs Deluxe', qty: 2, price: 550.0 },
        { name: 'Draft Beer', qty: 3, price: 50.0 },
      ],
    },
  ];

  // Helper for Payment Method Badges
  const renderPaymentBadge = (method: string, refCode?: string) => {
    switch (method.toUpperCase()) {
      case 'TELEBIRR':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
              <Smartphone className="w-3 h-3 text-[#00A3E0]" />
              Telebirr
            </span>
            {refCode && <span className="text-[10px] text-gray-400 font-mono">{refCode}</span>}
          </div>
        );
      case 'CBE_BIRR':
      case 'CBE BIRR':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
              <Smartphone className="w-3 h-3 text-purple-600" />
              CBE Birr
            </span>
            {refCode && <span className="text-[10px] text-gray-400 font-mono">{refCode}</span>}
          </div>
        );
      case 'CASH':
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Banknote className="w-3 h-3 text-emerald-600" />
              Cash Handover
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">In Till</span>
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
            <CreditCard className="w-3 h-3 text-gray-600" />
            {method}
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. Cashier Header Banner */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            Cashier Dashboard
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time bill requests, payment verification, and floor cash management
          </p>
        </div>

        {/* Primary Cashier Actions Header */}
        <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
          <Button
            onClick={() => navigate('/admin/bill-requests')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs h-9 px-4 gap-1.5 shadow-xs relative"
          >
            <Printer className="w-4 h-4" />
            <span>Bill Requests Queue</span>
            {pendingBillsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-600 text-white min-w-[18px] text-center ml-1">
                {pendingBillsCount}
              </span>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsCashDropModalOpen(true)}
            className="font-semibold text-xs h-9 px-3.5 gap-1.5 border-gray-300 hover:bg-gray-50 text-gray-700"
          >
            <ArrowDownToLine className="w-4 h-4 text-gray-600" />
            Handover Cash to Manager
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. Top 4 Live Financial & Operational Metric Cards */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Today's Revenue */}
        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">
                <TrendingUp className="w-3.5 h-3.5" />
                +{paymentBreakdown.salesChange}%
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Today's Revenue
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                Br {paymentBreakdown.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Cash Collected */}
        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200/60 flex items-center justify-center">
                <Coins className="w-5 h-5 text-green-700" />
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-green-100 text-green-800">
                Physical Cash
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cash Collected
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                Br {drawerStats.expectedInTill.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Digital Non-Cash Transfers */}
        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-[#00A3E0]" />
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                67.5% Digital
              </span>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Digital Bank Transfers
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                Br {paymentBreakdown.totalDigital.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Action Queue (Pending Bills) */}
        <Card className="border-gray-200 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/60 flex items-center justify-center">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              {pendingBillsCount > 0 ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 animate-pulse">
                  Print Needed
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-gray-100 text-gray-600">
                  All Clear
                </span>
              )}
            </div>
            <div className="space-y-0.5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pending Bill Requests
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900">
                {pendingBillsCount} <span className="text-sm font-semibold text-gray-500">requests</span>
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 3. Main Operational Section (Queue 67% + Breakdown 33%) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Bill Printing & Waiter Cash Handover Queues (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <Card className="border-gray-200 shadow-xs overflow-hidden">
            <CardHeader className="bg-gray-50/70 border-b border-gray-100 pb-3 pt-4 px-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-600" />
                    Cashier Floor Service Hub
                  </CardTitle>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Generate bills requested by waiters and reconcile floor cash handovers
                  </p>
                </div>

                {/* Queue Tabs */}
                <div className="flex items-center gap-1 bg-gray-200/80 p-1 rounded-lg self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveQueueTab('bill_requests')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                      activeQueueTab === 'bill_requests'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Print Bill Requests</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        activeQueueTab === 'bill_requests'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {billRequests.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveQueueTab('waiter_handovers')}
                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                      activeQueueTab === 'waiter_handovers'
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <span>Waiter Cash Handovers</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      {waiterHandovers.filter((w) => w.status === 'PENDING').length} pending
                    </span>
                  </button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Tab 1: Incoming Bill Print Requests (Clean Table Column Rows) */}
              {activeQueueTab === 'bill_requests' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Table
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Waiter
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Items Ordered
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Wait Time
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {billRequests.map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Table */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
                              Table {request.tableNumber}
                            </span>
                          </td>

                          {/* Waiter */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="text-xs font-semibold text-gray-900">{request.waiterName}</div>
                            <div className="text-[11px] text-gray-400">{request.guestCount} guests</div>
                          </td>

                          {/* Items Ordered */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                              {request.items.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-medium border border-gray-200/60 whitespace-nowrap"
                                >
                                  <span className="font-bold text-gray-900 mr-1">{item.quantity}x</span>
                                  {item.name}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Wait Time */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {request.waitTime}
                            </span>
                          </td>

                          {/* Total Amount */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <div className="text-sm font-extrabold text-gray-900">
                              Br {request.total.toFixed(2)}
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <Button
                              size="sm"
                              onClick={() => setSelectedBillForPrint(request)}
                              className="h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print Bill
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Tab 2: Waiter Cash Handovers (Clean Table Column Rows) */}
              {activeQueueTab === 'waiter_handovers' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Floor Waiter
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Tables Served
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Cash Orders
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Cash Collected
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {waiterHandovers.map((wh) => (
                        <tr key={wh.id} className="hover:bg-gray-50/80 transition-colors">
                          {/* Waiter */}
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                                {wh.waiterName.charAt(0)}
                              </div>
                              <span className="font-bold text-xs text-gray-900">{wh.waiterName}</span>
                            </div>
                          </td>

                          {/* Tables */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600 font-medium">
                            {wh.tablesServed}
                          </td>

                          {/* Orders */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-gray-600">
                            {wh.cashOrdersCount} cash tickets
                          </td>

                          {/* Cash Amount */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <span className="text-sm font-extrabold text-emerald-700">
                              Br {wh.totalCashCollected.toFixed(2)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-center">
                            {wh.status === 'PENDING' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                                Pending Handover
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Received ({wh.receivedAt})
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            {wh.status === 'PENDING' ? (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptHandover(wh.id)}
                                className="h-8 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Accept
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400 font-medium">Completed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Payment Method Distribution (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card: Payment Methods Distribution (Donut / Pie Chart) */}
          <Card className="border-gray-200 shadow-xs">
            <CardHeader className="bg-gray-50/70 border-b border-gray-100 pb-3 pt-4 px-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Payment Methods Distribution
                </CardTitle>
                <span className="text-[11px] text-gray-500 font-medium">42 Tickets</span>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              {/* Circular Donut / Pie Chart */}
              <div className="flex items-center justify-center my-2">
                <div className="relative w-40 h-40">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Telebirr - 38.8% - Cyan */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#00A3E0"
                      strokeWidth="18"
                      strokeDasharray={`${38.8 * 2.513} ${100 * 2.513}`}
                      strokeDashoffset="0"
                    />
                    {/* Cash Handover - 32.5% - Emerald */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="18"
                      strokeDasharray={`${32.5 * 2.513} ${100 * 2.513}`}
                      strokeDashoffset={`-${38.8 * 2.513}`}
                    />
                    {/* CBE Birr - 28.7% - Purple */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#7B2CBF"
                      strokeWidth="18"
                      strokeDasharray={`${28.7 * 2.513} ${100 * 2.513}`}
                      strokeDashoffset={`-${(38.8 + 32.5) * 2.513}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-gray-900">42</p>
                      <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">Tickets</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend & Amounts */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                {/* Telebirr */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#00A3E0] shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-gray-800">Telebirr Transfer</span>
                      <span className="text-[11px] text-gray-400 ml-1.5">
                        ({paymentBreakdown.telebirr.count} tickets)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900">
                      Br {paymentBreakdown.telebirr.amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-gray-500 ml-1">
                      ({paymentBreakdown.telebirr.percentage}%)
                    </span>
                  </div>
                </div>

                {/* Cash */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-gray-800">Cash Handover</span>
                      <span className="text-[11px] text-gray-400 ml-1.5">
                        ({paymentBreakdown.cash.count} tickets)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900">
                      Br {paymentBreakdown.cash.amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-gray-500 ml-1">
                      ({paymentBreakdown.cash.percentage}%)
                    </span>
                  </div>
                </div>

                {/* CBE Birr */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-purple-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-gray-800">CBE Birr Transfer</span>
                      <span className="text-[11px] text-gray-400 ml-1.5">
                        ({paymentBreakdown.cbe.count} tickets)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-gray-900">
                      Br {paymentBreakdown.cbe.amount.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-gray-500 ml-1">
                      ({paymentBreakdown.cbe.percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. Recent Completed Receipts Table (Clean Column Layout) */}
      {/* ========================================================================= */}
      <Card className="border-gray-200 shadow-xs overflow-hidden">
        <CardHeader className="bg-gray-50/70 border-b border-gray-100 py-3.5 px-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4.5 h-4.5 text-emerald-600" />
                Completed Receipts &amp; Settled Tickets
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Official printed receipts and settled floor tickets
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/orders')}
              className="text-xs text-blue-600 hover:text-blue-700 h-8 self-start sm:self-auto"
            >
              All Orders Page &rarr;
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Table / Customer
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Payment Method
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Receipt ID */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className="font-mono text-xs font-bold text-gray-900">
                        {tx.id}
                      </span>
                    </td>

                    {/* Table & Customer */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900">
                          {tx.tableNumber}
                        </span>
                        <span className="text-xs text-gray-500">
                          {tx.customerName} • Waiter: {tx.waiterName}
                        </span>
                      </div>
                    </td>

                    {/* Payment Method Badge */}
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      {renderPaymentBadge(tx.method, tx.refCode)}
                    </td>

                    {/* Time */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{tx.time}</div>
                      <div className="text-[11px] text-gray-400">{tx.date}</div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <span className="text-sm font-extrabold text-gray-900">
                        Br {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedReceipt(tx)}
                        className="h-8 px-2.5 text-xs font-semibold border-gray-300 hover:bg-gray-100 gap-1 text-gray-700"
                      >
                        <Receipt className="w-3.5 h-3.5 text-gray-500" />
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 5. Printable Customer Receipt Viewer Modal */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedReceipt}
        onOpenChange={(open) => !open && setSelectedReceipt(null)}
      >
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              Customer Payment Receipt
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-500">
              Official tax invoice &amp; settlement copy
            </DialogDescription>
          </DialogHeader>

          {selectedReceipt && (
            <div className="mt-2 space-y-4 border border-dashed border-gray-300 p-4 rounded-xl bg-gray-50/50 font-mono text-xs">
              {/* Receipt Top Header */}
              <div className="text-center space-y-0.5 border-b border-gray-200 pb-3">
                <h4 className="font-bold text-sm text-gray-900 tracking-wider">
                  YONI RESTAURANT
                </h4>
                <p className="text-[11px] text-gray-600">Main Branch • Bole Sub-City, Addis Ababa</p>
                <p className="text-[10px] text-gray-400">TIN: 0049281920 • VAT Reg: 8492019</p>
              </div>

              {/* Order Meta */}
              <div className="flex justify-between text-[11px] text-gray-600 border-b border-gray-200 pb-2">
                <div>
                  <p>Receipt: <strong className="text-gray-900">{selectedReceipt.id}</strong></p>
                  <p>Table: <strong className="text-gray-900">{selectedReceipt.tableNumber}</strong></p>
                  <p>Guest: {selectedReceipt.customerName}</p>
                </div>
                <div className="text-right">
                  <p>{selectedReceipt.date}</p>
                  <p>{selectedReceipt.time}</p>
                  <p>Cashier: {cashierName.split(' ')[0]}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1.5 border-b border-gray-200 pb-3">
                {selectedReceipt.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.qty}x {item.name}
                    </span>
                    <span className="font-semibold">Br {(item.qty * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>Br {(selectedReceipt.amount / 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (15%):</span>
                  <span>Br {(selectedReceipt.amount - selectedReceipt.amount / 1.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-gray-900 pt-1 border-t border-gray-300">
                  <span>TOTAL PAID:</span>
                  <span>Br {selectedReceipt.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700 font-semibold pt-1">
                  <span>Method:</span>
                  <span>{selectedReceipt.method} ({selectedReceipt.refCode})</span>
                </div>
              </div>

              <div className="text-center pt-3 text-[10px] text-gray-400">
                *** Amesegenalehu! Thank you for dining with us! ***
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedReceipt(null)}
              className="flex-1 text-xs"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.print();
                toast.success('Printing customer receipt...');
              }}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 6. Instant Table Bill Generator & Print Modal */}
      {/* ========================================================================= */}
      <Dialog
        open={!!selectedBillForPrint}
        onOpenChange={(open) => !open && setSelectedBillForPrint(null)}
      >
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-lg font-bold">
              Customer Table Pre-Bill
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-gray-500">
              Print bill receipt to hand to Waiter {selectedBillForPrint?.waiterName} for Table {selectedBillForPrint?.tableNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedBillForPrint && (
            <div className="mt-2 space-y-4 border border-dashed border-gray-300 p-4 rounded-xl bg-gray-50 font-mono text-xs">
              <div className="text-center border-b border-gray-200 pb-2">
                <h4 className="font-bold text-sm text-gray-900">YONI RESTAURANT</h4>
                <p className="text-[11px] text-gray-600">TABLE PRE-BILL</p>
                <p className="text-sm font-extrabold text-blue-900 mt-1">
                  TABLE {selectedBillForPrint.tableNumber}
                </p>
                <p className="text-[10px] text-gray-500">Waiter: {selectedBillForPrint.waiterName}</p>
              </div>

              <div className="space-y-1.5 border-b border-gray-200 pb-2">
                {selectedBillForPrint.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span>
                      {it.quantity}x {it.name}
                    </span>
                    <span>Br {(it.quantity * it.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
                <span>TOTAL TO COLLECT:</span>
                <span className="text-blue-900">Br {selectedBillForPrint.total.toFixed(2)}</span>
              </div>
              <p className="text-[10px] text-center text-gray-400">
                Accepted at table: Cash, Telebirr, CBE Birr
              </p>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedBillForPrint(null)}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => handlePrintBill(selectedBillForPrint)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              Print &amp; Hand to Waiter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 7. Cash Handover to Manager Modal */}
      {/* ========================================================================= */}
      <Dialog open={isCashDropModalOpen} onOpenChange={setIsCashDropModalOpen}>
        <DialogContent className="max-w-md p-6 bg-white rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <ArrowDownToLine className="w-5 h-5 text-gray-700" />
              Handover Cash to Manager
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Record physical cash handed over to the manager before logging out or depositing into the safe
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-xs mt-2">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Handover Amount (ETB)
              </label>
              <input
                type="number"
                value={cashDropAmount}
                onChange={(e) => setCashDropAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="500.00"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Handover Note
              </label>
              <input
                type="text"
                value={cashDropNote}
                onChange={(e) => setCashDropNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="e.g. Cashier handover to manager before leaving"
              />
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="text-gray-600">Current Cash in Till:</span>
              <span className="font-bold text-gray-900">Br {drawerStats.expectedInTill.toFixed(2)}</span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCashDropModalOpen(false)}
              className="flex-1 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleRecordCashDrop}
              className="flex-1 bg-gray-900 hover:bg-black text-white text-xs gap-1.5 font-semibold"
            >
              <Check className="w-3.5 h-3.5" />
              Confirm Handover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
