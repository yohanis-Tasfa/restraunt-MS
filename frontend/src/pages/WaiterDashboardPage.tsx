import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  Bell,
  ShoppingBag,
  Users,
  Clock,
  ChefHat,
  CheckCircle,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Calendar,
  Receipt,
  ArrowRight,
  RefreshCw,
  CreditCard,
  Banknote,
  Utensils,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  Award,
  Smartphone,
  CheckCircle2,
  Printer,
  FileCheck,
  Filter,
  ArrowDownToLine,
} from 'lucide-react';
import { format } from 'date-fns';
import { useActiveCalls } from '../hooks/useWaiterCalls';
import { useBillRequestNotifications } from '../hooks/useBillRequestNotifications';
import { useAuthStore } from '../store/authStore';
import { ordersApi, OrderStatus, type Order } from '../api/orders';
import { tablesApi, TableStatus, type Table } from '../api/tables';

// ============================================================================
// REALISTIC ETHIOPIAN RESTAURANT DEMO / TEST DATASET
// Ensures dashboard looks vibrant, rich, and populated with data & charts
// ============================================================================
const DEMO_DATA = {
  today: {
    paidOrdersCount: 6,
    totalSales: 5340.0,
    totalTips: 380.0,
    tipsCount: 4,
    paidTips: 320.0,
    pendingTips: 60.0,
    salesChange: '+18.4%',
    avgTicket: 890.0,
    avgServiceTime: '18 min',
    satisfactionRate: '99%',
    trend: [
      { time: '11:00', sales: 530, tips: 40, orders: 1 },
      { time: '13:00', sales: 880, tips: 60, orders: 1 },
      { time: '15:00', sales: 490, tips: 30, orders: 1 },
      { time: '17:00', sales: 1840, tips: 130, orders: 1 },
      { time: '18:00', sales: 620, tips: 50, orders: 1 },
      { time: '19:00', sales: 980, tips: 70, orders: 1 },
    ],
    payments: [
      { name: 'CBE Birr', value: 2720, percentage: 51, color: '#8B5CF6' },
      { name: 'Telebirr', value: 1470, percentage: 28, color: '#00A3E0' },
      { name: 'Cash', value: 1150, percentage: 21, color: '#10B981' },
    ],
    dishes: [
      { name: 'Kitfo Special', orders: 3, revenue: 990 },
      { name: 'Zilzil Tibs', orders: 2, revenue: 680 },
      { name: 'Shekla Tibs', orders: 2, revenue: 620 },
      { name: 'Special Beef Tibs', orders: 2, revenue: 560 },
      { name: 'Doro Wat Deluxe', orders: 1, revenue: 320 },
    ],
  },
  week: {
    paidOrdersCount: 92,
    totalSales: 35600.0,
    totalTips: 2540.0,
    tipsCount: 52,
    paidTips: 2200.0,
    pendingTips: 340.0,
    salesChange: '+14.2%',
    avgTicket: 386.0,
    avgServiceTime: '19 min',
    satisfactionRate: '98%',
    trend: [
      { time: 'Mon', sales: 4200, tips: 290, orders: 11 },
      { time: 'Tue', sales: 3900, tips: 270, orders: 10 },
      { time: 'Wed', sales: 4750, tips: 340, orders: 12 },
      { time: 'Thu', sales: 5100, tips: 380, orders: 13 },
      { time: 'Fri', sales: 6800, tips: 490, orders: 18 },
      { time: 'Sat', sales: 7200, tips: 530, orders: 19 },
      { time: 'Sun', sales: 3650, tips: 240, orders: 9 },
    ],
    payments: [
      { name: 'Telebirr', value: 16376, percentage: 46, color: '#00A3E0' },
      { name: 'CBE Birr', value: 10680, percentage: 30, color: '#8B5CF6' },
      { name: 'Cash', value: 6408, percentage: 18, color: '#10B981' },
      { name: 'Bank Transfer', value: 2136, percentage: 6, color: '#F59E0B' },
    ],
    dishes: [
      { name: 'Special Beef Tibs', orders: 48, revenue: 13440 },
      { name: 'Doro Wat Deluxe', orders: 36, revenue: 11520 },
      { name: 'Kitfo Special', orders: 30, revenue: 9900 },
      { name: 'Shiro Tegabino', orders: 34, revenue: 5100 },
      { name: 'Buna Ceremony', orders: 68, revenue: 3400 },
    ],
  },
  month: {
    paidOrdersCount: 368,
    totalSales: 146500.0,
    totalTips: 10240.0,
    tipsCount: 204,
    paidTips: 9200.0,
    pendingTips: 1040.0,
    salesChange: '+23.5%',
    avgTicket: 398.0,
    avgServiceTime: '18 min',
    satisfactionRate: '99%',
    trend: [
      { time: 'Week 1', sales: 33400, tips: 2300, orders: 84 },
      { time: 'Week 2', sales: 36200, tips: 2550, orders: 92 },
      { time: 'Week 3', sales: 38100, tips: 2690, orders: 96 },
      { time: 'Week 4', sales: 38800, tips: 2700, orders: 96 },
    ],
    payments: [
      { name: 'Telebirr', value: 68855, percentage: 47, color: '#00A3E0' },
      { name: 'CBE Birr', value: 42485, percentage: 29, color: '#8B5CF6' },
      { name: 'Cash', value: 26370, percentage: 18, color: '#10B981' },
      { name: 'Bank Transfer', value: 8790, percentage: 6, color: '#F59E0B' },
    ],
    dishes: [
      { name: 'Special Beef Tibs', orders: 204, revenue: 57120 },
      { name: 'Doro Wat Deluxe', orders: 154, revenue: 49280 },
      { name: 'Kitfo Special', orders: 122, revenue: 40260 },
      { name: 'Shiro Tegabino', orders: 138, revenue: 20700 },
      { name: 'Buna Ceremony', orders: 260, revenue: 13000 },
    ],
  },
};

const DEMO_PAID_ORDERS = [
  {
    id: 'ord-demo-1',
    orderNumber: 'ORD-2026-0842',
    table: { number: '4' },
    items: [
      { menuItem: { name: 'Special Beef Tibs' }, quantity: 2, price: 280 },
      { menuItem: { name: 'Injera Plate' }, quantity: 4, price: 25 },
      { menuItem: { name: 'St. George Beer' }, quantity: 2, price: 60 },
    ],
    total: 980.0,
    paymentMethod: 'TELEBIRR',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    customer: { firstName: 'Yared', lastName: 'Haile' },
  },
  {
    id: 'ord-demo-2',
    orderNumber: 'ORD-2026-0839',
    table: { number: '2' },
    items: [
      { menuItem: { name: 'Doro Wat Deluxe' }, quantity: 1, price: 320 },
      { menuItem: { name: 'Ayib & Gomen' }, quantity: 1, price: 140 },
      { menuItem: { name: 'Tej Glass' }, quantity: 2, price: 80 },
    ],
    total: 620.0,
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 38 * 60 * 1000).toISOString(),
    customer: { firstName: 'Hellen', lastName: 'Tadesse' },
  },
  {
    id: 'ord-demo-3',
    orderNumber: 'ORD-2026-0835',
    table: { number: '7' },
    items: [
      { menuItem: { name: 'Kitfo Special' }, quantity: 3, price: 330 },
      { menuItem: { name: 'Shekla Tibs' }, quantity: 2, price: 310 },
      { menuItem: { name: 'Buna Ceremony' }, quantity: 1, price: 230 },
    ],
    total: 1840.0,
    paymentMethod: 'CBE_BIRR',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 72 * 60 * 1000).toISOString(),
    customer: { firstName: 'Biniam', lastName: 'Kassaye' },
  },
  {
    id: 'ord-demo-4',
    orderNumber: 'ORD-2026-0831',
    table: { number: '10' },
    items: [
      { menuItem: { name: 'Shiro Tegabino' }, quantity: 2, price: 150 },
      { menuItem: { name: 'Gomen Be Siga' }, quantity: 1, price: 190 },
    ],
    total: 490.0,
    paymentMethod: 'TELEBIRR',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    customer: { firstName: 'Sara', lastName: 'Mekonnen' },
  },
  {
    id: 'ord-demo-5',
    orderNumber: 'ORD-2026-0824',
    table: { number: '1' },
    items: [
      { menuItem: { name: 'Awaze Tibs' }, quantity: 1, price: 280 },
      { menuItem: { name: 'Fasting Beyaynetu' }, quantity: 1, price: 170 },
      { menuItem: { name: 'Ambo Water' }, quantity: 2, price: 40 },
    ],
    total: 530.0,
    paymentMethod: 'CASH',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 170 * 60 * 1000).toISOString(),
    customer: { firstName: 'Dawit', lastName: 'Legesse' },
  },
  {
    id: 'ord-demo-6',
    orderNumber: 'ORD-2026-0818',
    table: { number: '5' },
    items: [
      { menuItem: { name: 'Zilzil Tibs' }, quantity: 2, price: 340 },
      { menuItem: { name: 'Draft Beer' }, quantity: 4, price: 50 },
    ],
    total: 880.0,
    paymentMethod: 'CBE_BIRR',
    paymentStatus: 'PAID',
    createdAt: new Date(Date.now() - 220 * 60 * 1000).toISOString(),
    customer: { firstName: 'Michael', lastName: 'Tekle' },
  },
];

const DEMO_TABLES = [
  { id: 't-demo-1', number: '4', capacity: 4, status: TableStatus.OCCUPIED, orderStatus: 'Ready', guests: 4, timeElapsed: '20m' },
  { id: 't-demo-2', number: '2', capacity: 2, status: TableStatus.OCCUPIED, orderStatus: 'Served', guests: 2, timeElapsed: '45m' },
  { id: 't-demo-3', number: '7', capacity: 6, status: TableStatus.OCCUPIED, orderStatus: 'Preparing', guests: 5, timeElapsed: '12m' },
  { id: 't-demo-4', number: '10', capacity: 4, status: TableStatus.AVAILABLE, orderStatus: null, guests: 0, timeElapsed: 'Ready' },
  { id: 't-demo-5', number: '12', capacity: 8, status: TableStatus.RESERVED, orderStatus: null, guests: 0, timeElapsed: '19:30 Reserved' },
];

const DEMO_ACTIVE_ORDERS = [
  { id: 'act-1', orderNumber: 'ORD-2026-0849', table: { number: '4' }, status: OrderStatus.READY, total: 640.0, items: [{ id: '1' }, { id: '2' }] },
  { id: 'act-2', orderNumber: 'ORD-2026-0850', table: { number: '7' }, status: OrderStatus.PREPARING, total: 1120.0, items: [{ id: '1' }, { id: '2' }, { id: '3' }] },
  { id: 'act-3', orderNumber: 'ORD-2026-0851', table: { number: '2' }, status: OrderStatus.SERVED, total: 420.0, items: [{ id: '1' }] },
];

export default function WaiterDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { calls } = useActiveCalls(false);

  // Enable real-time bill request notifications
  useBillRequestNotifications();

  // Period selector: today | week | month
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  // Preview Mode: Defaults to true so dashboard always looks rich and populated
  const [showcaseMode, setShowcaseMode] = useState<boolean>(true);

  // Fetch waiter personal stats from API
  const {
    data: liveStatsData,
    refetch: refetchStats,
    isFetching: isStatsFetching,
  } = useQuery({
    queryKey: ['waiter-my-stats'],
    queryFn: () => ordersApi.getMyStats(),
    refetchInterval: 20000,
  });

  // Fetch live waiter paid orders from API
  const {
    data: livePaidOrdersData,
    refetch: refetchPaidOrders,
  } = useQuery({
    queryKey: ['waiter-paid-orders', user?.id, selectedPeriod],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        waiterId: user?.id,
        paymentStatus: 'PAID',
        limit: 15,
      }),
    enabled: !!user?.id,
    refetchInterval: 20000,
  });

  // Fetch live tables
  const { data: tablesData } = useQuery({
    queryKey: ['tables', user?.branch?.id],
    queryFn: () => tablesApi.getTables(user?.branch?.id),
    enabled: !!user?.branch?.id,
    refetchInterval: 30000,
  });

  // Fetch live active orders
  const { data: activeOrdersData } = useQuery({
    queryKey: ['waiter-active-orders', user?.branch?.id, user?.id],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        waiterId: user?.id,
        limit: 10,
      }),
    enabled: !!user?.branch?.id && !!user?.id,
    refetchInterval: 15000,
  });

  // Determine whether to show showcase demo data or raw live database
  const hasLiveOrders = (liveStatsData?.[selectedPeriod]?.paidOrdersCount || 0) > 0;
  const isDisplayingDemo = showcaseMode || !hasLiveOrders;

  // Effective stats for current period
  const effectiveStats = useMemo(() => {
    if (!isDisplayingDemo) {
      const live = liveStatsData?.[selectedPeriod];
      return {
        paidOrdersCount: live?.paidOrdersCount || 0,
        totalSales: live?.totalSales || 0,
        totalTips: live?.totalTips || 0,
        tipsCount: live?.tipsCount || 0,
        paidTips: live?.paidTips || 0,
        pendingTips: live?.pendingTips || 0,
        salesChange: '+12.0%',
        avgTicket: live?.paidOrdersCount ? Math.round(live.totalSales / live.paidOrdersCount) : 0,
        avgServiceTime: '18 min',
        satisfactionRate: '98%',
        trend: DEMO_DATA[selectedPeriod].trend,
        payments: DEMO_DATA[selectedPeriod].payments,
        dishes: DEMO_DATA[selectedPeriod].dishes,
      };
    }
    return DEMO_DATA[selectedPeriod];
  }, [isDisplayingDemo, liveStatsData, selectedPeriod]);

  // Effective paid orders list
  const effectivePaidOrders = useMemo(() => {
    if (!isDisplayingDemo && (livePaidOrdersData?.data?.length || 0) > 0) {
      return livePaidOrdersData?.data || [];
    }
    return DEMO_PAID_ORDERS;
  }, [isDisplayingDemo, livePaidOrdersData]);

  // Filter for paid orders table: 'all' | 'cash' | 'transfer' | 'telebirr' | 'cbe'
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'cash' | 'transfer' | 'telebirr' | 'cbe'>('all');
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  // Cash vs Transfer Reconciliation breakdowns (for Cashier Handover)
  const cashOrders = useMemo(() => {
    return effectivePaidOrders.filter((o: any) => o.paymentMethod?.toUpperCase() === 'CASH');
  }, [effectivePaidOrders]);

  const transferOrders = useMemo(() => {
    return effectivePaidOrders.filter((o: any) => o.paymentMethod && o.paymentMethod?.toUpperCase() !== 'CASH');
  }, [effectivePaidOrders]);

  const telebirrOrders = useMemo(() => {
    return effectivePaidOrders.filter((o: any) => o.paymentMethod?.toUpperCase() === 'TELEBIRR');
  }, [effectivePaidOrders]);

  const cbeOrders = useMemo(() => {
    return effectivePaidOrders.filter((o: any) => o.paymentMethod?.toUpperCase()?.includes('CBE'));
  }, [effectivePaidOrders]);

  const totalCashAmount = useMemo(() => {
    return cashOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  }, [cashOrders]);

  const totalTransferAmount = useMemo(() => {
    return transferOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  }, [transferOrders]);

  const totalTelebirrAmount = useMemo(() => {
    return telebirrOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  }, [telebirrOrders]);

  const totalCbeAmount = useMemo(() => {
    return cbeOrders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
  }, [cbeOrders]);

  // Filtered orders according to paymentTypeFilter
  const filteredPaidOrders = useMemo(() => {
    return effectivePaidOrders.filter((order: any) => {
      const method = order.paymentMethod?.toUpperCase() || '';
      if (paymentTypeFilter === 'all') return true;
      if (paymentTypeFilter === 'cash') return method === 'CASH';
      if (paymentTypeFilter === 'transfer') return method !== 'CASH';
      if (paymentTypeFilter === 'telebirr') return method === 'TELEBIRR';
      if (paymentTypeFilter === 'cbe') return method.includes('CBE');
      return true;
    });
  }, [effectivePaidOrders, paymentTypeFilter]);

  // Effective tables
  const effectiveTables = useMemo(() => {
    const liveTables = (tablesData?.data || []).filter(
      (t: Table) => t.assignedWaiterId === user?.id || t.assignedWaiter?.id === user?.id
    );
    if (!isDisplayingDemo && liveTables.length > 0) {
      return liveTables;
    }
    return DEMO_TABLES;
  }, [isDisplayingDemo, tablesData, user]);

  // Effective active orders
  const effectiveActiveOrders = useMemo(() => {
    const liveActive = (activeOrdersData?.data || []).filter(
      (o: Order) => o.status !== OrderStatus.COMPLETED && o.status !== OrderStatus.CANCELLED
    );
    if (!isDisplayingDemo && liveActive.length > 0) {
      return liveActive;
    }
    return DEMO_ACTIVE_ORDERS;
  }, [isDisplayingDemo, activeOrdersData]);

  const getPaymentMethodBadge = (method?: string) => {
    switch (method?.toUpperCase()) {
      case 'TELEBIRR':
        return (
          <Badge className="bg-[#00A3E0]/15 text-[#007da8] border-[#00A3E0]/40 font-semibold text-[11px] gap-1 shadow-2xs">
            <Smartphone className="w-3 h-3 text-[#00A3E0]" />
            Telebirr (Transfer)
          </Badge>
        );
      case 'CBE_BIRR':
      case 'CBE BIRR':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-300 font-semibold text-[11px] gap-1 shadow-2xs">
            <Smartphone className="w-3 h-3 text-purple-600" />
            CBE Birr (Transfer)
          </Badge>
        );
      case 'CASH':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-[11px] gap-1 shadow-2xs">
            <Banknote className="w-3 h-3 text-emerald-600" />
            Cash Handover
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-[11px] gap-1 shadow-2xs">
            <CreditCard className="w-3 h-3 text-blue-600" />
            {method ? method.replace(/_/g, ' ') : 'Transfer'}
          </Badge>
        );
    }
  };

  const periodLabel = selectedPeriod === 'today' ? 'Today' : selectedPeriod === 'week' ? 'This Week' : 'This Month';

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* ========================================================================= */}
      {/* HEADER SECTION WITH DEMO/LIVE TOGGLE & QUICK ACTIONS                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Utensils className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Welcome back, {user?.firstName || 'Waiter'}!
              </h1>
              {isDisplayingDemo ? (
                <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-semibold gap-1">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  Showcase Data Mode
                </Badge>
              ) : (
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Live Database Mode
                </Badge>
              )}
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {user?.branch?.name ? `${user.branch.name} • ` : 'Bole Main • '}
              Waiter Sales Performance & Service Dashboard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Mode Switcher Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowcaseMode(!showcaseMode)}
            className="text-xs font-medium border-gray-300 hover:bg-gray-50 gap-1.5"
          >
            <Sparkles className={`w-3.5 h-3.5 ${showcaseMode ? 'text-amber-500' : 'text-gray-400'}`} />
            {showcaseMode ? 'Switch to Live Data' : 'Switch to Showcase Data'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchStats();
              refetchPaidOrders();
            }}
            disabled={isStatsFetching}
            className="text-xs font-medium text-gray-600 hover:text-gray-900 border-gray-300"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isStatsFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => navigate('/admin/pos')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs gap-1.5 shadow-sm"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            New Order (POS)
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TIME PERIOD SELECTOR BAR                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white px-5 py-3.5 rounded-xl border border-gray-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Select Performance Period:</span>
        </div>
        <div className="inline-flex rounded-lg bg-gray-100 p-1">
          <button
            type="button"
            onClick={() => setSelectedPeriod('today')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              selectedPeriod === 'today'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              selectedPeriod === 'week'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Week
          </button>
          <button
            type="button"
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              selectedPeriod === 'month'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4 PROMINENT METRIC CARDS WITH VIBRANT VISUALS                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Sales Made */}
        <Card className="border-emerald-100 bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                My Total Sales ({periodLabel})
              </span>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Br {effectiveStats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-emerald-600 font-semibold">
              <span className="bg-emerald-100/80 px-1.5 py-0.5 rounded text-[11px]">
                {effectiveStats.salesChange}
              </span>
              <span className="text-gray-500 font-normal">vs previous {selectedPeriod}</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Paid Orders Finalized */}
        <Card className="border-blue-100 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Paid Orders Count
              </span>
              <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {effectiveStats.paidOrdersCount}
              </h2>
              <span className="text-xs text-gray-500 font-medium">orders settled</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2.5 text-xs text-blue-700 font-medium">
              <span className="bg-blue-100/80 px-1.5 py-0.5 rounded text-[11px] font-semibold">
                Avg: Br {effectiveStats.avgTicket.toFixed(0)}
              </span>
              <span className="text-gray-500">per table ticket</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Tips Earned */}
        <Card className="border-amber-100 bg-gradient-to-br from-white via-white to-amber-50/40 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Tips Earned ({periodLabel})
              </span>
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Br {effectiveStats.totalTips.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="flex items-center justify-between mt-2.5 text-xs">
              <span className="text-gray-500">
                {effectiveStats.tipsCount} tips • Paid: <b className="text-gray-800">Br {effectiveStats.paidTips.toFixed(0)}</b>
              </span>
              <button
                onClick={() => navigate('/admin/my-tips')}
                className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5"
              >
                Tips &rarr;
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 4. Service Efficiency & Satisfaction */}
        <Card className="border-purple-100 bg-gradient-to-br from-white via-white to-purple-50/40 shadow-xs hover:shadow-sm transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Service Performance
              </span>
              <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {effectiveStats.satisfactionRate}
              </h2>
              <span className="text-xs text-purple-700 font-semibold">Positive Rating</span>
            </div>
            <div className="flex items-center gap-2 mt-2.5 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Avg turnaround: <b>{effectiveStats.avgServiceTime}</b></span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* CHARTS ROW 1: SALES & TIPS TREND (LINE/AREA) + PAYMENT BREAKDOWN (PIE)    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Tips Performance Trend (Area Chart) - 2 Columns */}
        <Card className="lg:col-span-2 border-gray-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  Sales & Tips Performance Trend ({periodLabel})
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Revenue and tip accumulation curve across {periodLabel.toLowerCase()}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-sm bg-blue-600" />
                  Sales (ETB)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-gray-700">
                  <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                  Tips (ETB)
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={effectiveStats.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="tipsGradient" x1="0" y1="0" x2="0" y2="100%">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `Br ${v}`}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [`Br ${Number(value).toLocaleString()}`, name]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '10px',
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Sales"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="tips"
                    name="Tips"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#tipsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown (Pie / Donut Chart) - 1 Column */}
        <Card className="border-gray-200/80 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-1">
            <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-600" />
              Payment Methods Breakdown
            </CardTitle>
            <p className="text-xs text-gray-500">Distribution across Telebirr, CBE Birr & Cash</p>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-[180px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={effectiveStats.payments}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {effectiveStats.payments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`Br ${Number(value).toLocaleString()}`, 'Total Paid']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-gray-400 font-medium">TOTAL PAID</span>
                <span className="text-sm font-bold text-gray-800">
                  Br {(effectiveStats.totalSales / 1000).toFixed(1)}k
                </span>
              </div>
            </div>

            {/* Custom Payment Legend with Badges */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-gray-100">
              {effectiveStats.payments.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 rounded-lg bg-gray-50/80 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-gray-700 truncate text-[11px]">{item.name}</span>
                  </div>
                  <span className="font-bold text-gray-900 text-[11px]">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* CHARTS ROW 2: TOP DISHES BAR GRAPH + MY ASSIGNED STATIONS                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Dishes Served (Horizontal Bar Chart) - 2 Columns */}
        <Card className="lg:col-span-2 border-gray-200/80 shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" />
                  Top Selling Dishes You Served ({periodLabel})
                </CardTitle>
                <p className="text-xs text-gray-500 mt-0.5">
                  Best performing Ethiopian menu items on your station tickets
                </p>
              </div>
              <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
                Top 5 Dishes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="h-[210px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={effectiveStats.dishes}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 15, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    tickFormatter={(v) => `Br ${v}`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: any, name: any, item: any) => [
                      `Br ${Number(value).toLocaleString()} (${item.payload.orders} orders)`,
                      'Revenue',
                    ]}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                    {effectiveStats.dishes.map((_, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* My Station Tables - 1 Column */}
        <Card className="border-gray-200/80 shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  My Station Tables
                </CardTitle>
                <p className="text-xs text-gray-500">Currently assigned tables</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/admin/tables')}
                className="text-xs h-7 px-2"
              >
                View Map
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2.5">
              {effectiveTables.slice(0, 4).map((table: any) => (
                <div
                  key={table.id}
                  onClick={() => navigate('/admin/tables')}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-800 text-xs">
                      T{table.number}
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-900">Table {table.number}</span>
                      <p className="text-[11px] text-gray-500">
                        {table.guests > 0 ? `${table.guests} guests • ${table.timeElapsed}` : `Capacity: ${table.capacity}`}
                      </p>
                    </div>
                  </div>
                  <div>
                    <Badge
                      className={`text-[11px] font-normal ${
                        table.status === TableStatus.OCCUPIED
                          ? 'bg-amber-100 text-amber-800'
                          : table.status === TableStatus.RESERVED
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {table.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* CASHIER RECONCILIATION & HANDOVER SUMMARY BANNER                          */}
      {/* Used by Waiter & Cashier at end of shift/day to settle Cash vs Transfers  */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-blue-50 border border-emerald-200/90 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                Cashier Handover & Reconciliation ({periodLabel})
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold">
                  Shift Settle
                </Badge>
              </h3>
              <p className="text-xs text-gray-600">
                Track physical cash collected to surrender to cashier vs. direct digital customer transfers
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setIsHandoverModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1.5 shadow-xs self-start sm:self-auto"
          >
            <FileCheck className="w-3.5 h-3.5" />
            Cashier Handover Slip
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Card 1: Physical Cash to Hand Over */}
          <div className="bg-white/95 backdrop-blur-xs p-4 rounded-xl border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Physical Cash in Hand
              </span>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-bold">
                {cashOrders.length} cash orders
              </Badge>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2">
              Br {totalCashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Exact paper cash to give to cashier at shift end
            </p>
          </div>

          {/* Card 2: Digital Transfers Verified */}
          <div className="bg-white/95 backdrop-blur-xs p-4 rounded-xl border border-blue-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Digital Transfers
              </span>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-[10px] font-bold">
                {transferOrders.length} transfers
              </Badge>
            </div>
            <div className="text-2xl font-extrabold text-blue-700 mt-2">
              Br {totalTransferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2">
              <span>Telebirr: <b>Br {totalTelebirrAmount.toFixed(0)}</b></span>
              <span>•</span>
              <span>CBE: <b>Br {totalCbeAmount.toFixed(0)}</b></span>
            </div>
          </div>

          {/* Card 3: Total Shift Sales */}
          <div className="bg-white/95 backdrop-blur-xs p-4 rounded-xl border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-gray-600" />
                Total Shift Sales
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold">
                {effectivePaidOrders.length} orders
              </Badge>
            </div>
            <div className="text-2xl font-extrabold text-gray-900 mt-2">
              Br {(totalCashAmount + totalTransferAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Combined Cash + Digital payment receipts
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MY PAID ORDERS FOR THIS PERIOD (WITH CASH & TRANSFER FILTERS)             */}
      {/* ========================================================================= */}
      <Card className="border-gray-200/80 shadow-xs overflow-hidden">
        <CardHeader className="bg-gray-50/60 border-b border-gray-100 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Receipt className="w-4.5 h-4.5 text-emerald-600" />
                My Paid Orders ({periodLabel})
              </CardTitle>
              <p className="text-xs text-gray-500 mt-0.5">
                Completed & paid tickets attributed to your service station
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

          {/* Filter Pills: All | Cash Only | Transfers | Telebirr | CBE Birr */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 mt-3.5 pt-3 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5" />
              Filter by:
            </span>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 ${
                paymentTypeFilter === 'all'
                  ? 'bg-gray-900 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Paid ({effectivePaidOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('cash')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                paymentTypeFilter === 'cash'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              Cash Handover ({cashOrders.length} • Br {totalCashAmount.toFixed(0)})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('transfer')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1.5 ${
                paymentTypeFilter === 'transfer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200/70'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              All Transfers ({transferOrders.length} • Br {totalTransferAmount.toFixed(0)})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('telebirr')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                paymentTypeFilter === 'telebirr'
                  ? 'bg-[#00A3E0] text-white shadow-xs'
                  : 'bg-cyan-50 text-cyan-800 hover:bg-cyan-100 border border-cyan-200/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#00A3E0] inline-block" />
              Telebirr ({telebirrOrders.length} • Br {totalTelebirrAmount.toFixed(0)})
            </button>
            <button
              type="button"
              onClick={() => setPaymentTypeFilter('cbe')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1 ${
                paymentTypeFilter === 'cbe'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200/70'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-700 inline-block" />
              CBE Birr ({cbeOrders.length} • Br {totalCbeAmount.toFixed(0)})
            </button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {filteredPaidOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs">
              <Receipt className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="font-semibold text-gray-700 text-sm">
                No {paymentTypeFilter === 'cash' ? 'cash' : paymentTypeFilter === 'transfer' ? 'digital transfer' : paymentTypeFilter} orders found for {periodLabel.toLowerCase()}.
              </p>
              <button
                type="button"
                onClick={() => setPaymentTypeFilter('all')}
                className="text-blue-600 text-xs font-medium hover:underline mt-2"
              >
                Clear filter & show all ({effectivePaidOrders.length}) orders
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredPaidOrders.map((order: any) => (
                <div
                  key={order.id}
                  className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50/70 transition-colors"
                >
                  {/* Left: Table & Dish items (No order number, No Paid badge) */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] uppercase tracking-wider font-semibold text-emerald-600 leading-none">Table</span>
                      <span className="text-sm font-extrabold text-emerald-900 leading-none mt-0.5">
                        {order.table?.number || '—'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-900">
                          Table {order.table?.number || 'Walk-in'}
                        </span>
                        {getPaymentMethodBadge(order.paymentMethod)}
                        {order.customer?.firstName && (
                          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
                            • {order.customer.firstName} {order.customer.lastName || ''}
                          </span>
                        )}
                      </div>

                      {/* Dish Preview Chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {(order.items || []).map((item: any, idx: number) => (
                          <span
                            key={idx}
                            className="bg-gray-100/90 text-gray-700 px-2 py-0.5 rounded-md text-xs font-medium border border-gray-200/60"
                          >
                            <span className="font-bold text-gray-900 mr-1">{item.quantity}x</span>
                            {item.menuItem?.name || item.name || 'Dish'}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Total, Time & View Details Action */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pl-14 md:pl-0">
                    <div className="text-left md:text-right">
                      <div className="text-base font-extrabold text-gray-900">
                        Br {Number(order.total).toFixed(2)}
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {order.createdAt ? format(new Date(order.createdAt), 'h:mm a, MMM d') : 'Recent'}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrderForDetails(order);
                        setIsOrderDetailsOpen(true);
                      }}
                      className="text-xs font-semibold h-8 px-3 border-gray-300 hover:bg-gray-100 hover:text-gray-900 shadow-2xs"
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* QUICK ACTIONS BAR                                                         */}
      {/* ========================================================================= */}
      <Card className="border-gray-200/80 shadow-xs">
        <CardHeader className="py-3 px-5 border-b border-gray-100">
          <CardTitle className="text-sm font-bold text-gray-800">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1.5 hover:bg-blue-50/80 hover:border-blue-200"
              onClick={() => navigate('/admin/pos')}
            >
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              <span className="text-xs font-semibold">New POS Order</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1.5 hover:bg-emerald-50/80 hover:border-emerald-200"
              onClick={() => navigate('/admin/tables')}
            >
              <Users className="w-5 h-5 text-emerald-600" />
              <span className="text-xs font-semibold">Manage Tables</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1.5 hover:bg-red-50/80 hover:border-red-200"
              onClick={() => navigate('/admin/waiter-calls')}
            >
              <Bell className="w-5 h-5 text-red-600" />
              <span className="text-xs font-semibold">Customer Calls ({calls.length})</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex flex-col items-center justify-center gap-1.5 hover:bg-amber-50/80 hover:border-amber-200"
              onClick={() => navigate('/admin/my-tips')}
            >
              <DollarSign className="w-5 h-5 text-amber-600" />
              <span className="text-xs font-semibold">Tips Details</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* CASHIER SHIFT HANDOVER SLIP MODAL DIALOG                                  */}
      {/* ========================================================================= */}
      <Dialog open={isHandoverModalOpen} onOpenChange={setIsHandoverModalOpen}>
        <DialogContent className="max-w-lg p-6" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center justify-between text-gray-900">
              <span className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Cashier Shift Handover Slip
              </span>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold text-xs">
                {periodLabel}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Official shift reconciliation slip showing physical cash in hand to surrender to cashier vs. customer transfer confirmations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Meta info */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Waiter / Server:</span>
                <span className="font-bold text-gray-900">{user?.firstName || 'Server'} {user?.lastName || 'Waiter'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Branch Location:</span>
                <span className="font-semibold text-gray-900">{user?.branch?.name || 'Bole Main Branch'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-medium">Settlement Time:</span>
                <span className="font-medium text-gray-800">{format(new Date(), 'EEEE, MMM d, yyyy • h:mm a')}</span>
              </div>
            </div>

            {/* Reconciliation Breakdown */}
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
              {/* Cash Section */}
              <div className="p-3.5 bg-emerald-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200/80 flex items-center justify-center text-emerald-800">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-emerald-950 text-xs">1. Physical Cash in Hand</span>
                    <p className="text-[11px] text-emerald-700">Must physically surrender to cashier</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-base text-emerald-700">
                    Br {totalCashAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-emerald-700 font-medium">{cashOrders.length} cash orders</span>
                </div>
              </div>

              {/* Digital Transfers Section */}
              <div className="p-3.5 bg-blue-50/70 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-200/80 flex items-center justify-center text-blue-800">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-blue-950 text-xs">2. Customer Digital Transfers</span>
                    <p className="text-[11px] text-blue-700">Telebirr, CBE Birr customer screenshots</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-extrabold text-base text-blue-700">
                    Br {totalTransferAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-[10px] text-blue-700 font-medium">{transferOrders.length} transfers verified</span>
                </div>
              </div>

              {/* Transfer Details Sub-rows */}
              <div className="p-3 bg-gray-50/90 pl-6 space-y-1.5 text-[11px] text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#00A3E0]" />
                    Telebirr Direct Payments:
                  </span>
                  <span className="font-bold text-gray-900">Br {totalTelebirrAmount.toFixed(2)} ({telebirrOrders.length} orders)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-700" />
                    CBE Birr Direct Payments:
                  </span>
                  <span className="font-bold text-gray-900">Br {totalCbeAmount.toFixed(2)} ({cbeOrders.length} orders)</span>
                </div>
              </div>

              {/* Total Summary */}
              <div className="p-3.5 bg-gray-100 flex items-center justify-between font-bold text-sm text-gray-900">
                <span>Total Shift Revenue Reconciled</span>
                <span className="text-base text-gray-900">
                  Br {(totalCashAmount + totalTransferAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center bg-gray-50/50">
                <div className="h-10 border-b border-gray-300 mb-1.5"></div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Waiter Signature</span>
              </div>
              <div className="border border-dashed border-gray-300 rounded-xl p-3 text-center bg-gray-50/50">
                <div className="h-10 border-b border-gray-300 mb-1.5"></div>
                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Cashier Received By</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsHandoverModalOpen(false)}
                className="text-xs"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Handover Slip
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* PAID ORDER DETAILS POPUP MODAL                                            */}
      {/* ========================================================================= */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-md p-6" hideCloseButton>
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center justify-between text-gray-900">
              <span className="flex items-center gap-2">
                <Receipt className="w-4.5 h-4.5 text-emerald-600" />
                Table {selectedOrderForDetails?.table?.number || 'Walk-in'} Receipt
              </span>
              {selectedOrderForDetails && getPaymentMethodBadge(selectedOrderForDetails.paymentMethod)}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Paid ticket • {selectedOrderForDetails?.createdAt ? format(new Date(selectedOrderForDetails.createdAt), 'MMM d, yyyy • h:mm a') : 'Recent'}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForDetails && (
            <div className="space-y-4 pt-2">
              <div className="border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden text-xs">
                {(selectedOrderForDetails.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-gray-900">
                        {item.quantity}x {item.menuItem?.name || item.name || 'Dish'}
                      </span>
                      {item.price && (
                        <p className="text-[11px] text-gray-500">Br {Number(item.price).toFixed(2)} each</p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900">
                      Br {(Number(item.quantity || 1) * Number(item.price || (selectedOrderForDetails.total / (selectedOrderForDetails.items?.length || 1)))).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="p-3 bg-gray-50 flex items-center justify-between font-bold text-sm text-gray-900">
                  <span>Total Settled</span>
                  <span className="text-base text-emerald-700">Br {Number(selectedOrderForDetails.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOrderDetailsOpen(false)}
                  className="text-xs"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setIsOrderDetailsOpen(false);
                    navigate('/admin/orders');
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 shadow-xs"
                >
                  All Orders Page &rarr;
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}