import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { ordersApi, OrderStatus } from '../api/orders';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  TrendingUp as ChartUp,
  AlertTriangle,
  Users as UsersIcon,
  Clock,
  ChefHat,
  Calendar,
  Package,
  Printer,
  CheckCircle2,
  FileText,
  X,
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  customer: string;
  table?: string;
  waiter: string;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  serviceCharge: number;
  total: number;
  status: 'Paid' | 'Preparing' | 'Pending' | 'Served' | 'Cancelled';
  paymentMethod: string;
  time: string;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [timeframe, setTimeframe] = useState<'1d' | '7d' | '30d' | '90d'>('1d');
  const [orderChannelFilter, setOrderChannelFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSubmitted, setPoSubmitted] = useState(false);

  // Dynamic greeting based on current hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const managerName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Branch Manager';
  const branchName = user?.branch?.name || 'Main Branch';

  // Calculate start & end ISO dates based on active date filter preset or custom date picker
  const dateParams = useMemo(() => {
    if (dateFilter === 'all') {
      return { startDate: undefined, endDate: undefined };
    }

    const now = new Date();

    if (dateFilter === 'today') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }

    if (dateFilter === 'week') {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }

    if (dateFilter === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }

    if (dateFilter === 'custom' && selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parseInt(parts[2], 10);
        if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
          const start = new Date(y, m - 1, d, 0, 0, 0, 0);
          const end = new Date(y, m - 1, d, 23, 59, 59, 999);
          return {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
          };
        }
      }
    }

    return { startDate: undefined, endDate: undefined };
  }, [dateFilter, selectedDate]);

  const handlePresetChange = (preset: 'today' | 'week' | 'month' | 'all') => {
    setDateFilter(preset);
    setSelectedDate('');
    if (preset === 'today') setTimeframe('1d');
    else if (preset === 'week') setTimeframe('7d');
    else if (preset === 'month') setTimeframe('30d');
    else if (preset === 'all') setTimeframe('90d');
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (dateStr) {
      setDateFilter('custom');
      setTimeframe('1d');
    } else {
      setDateFilter('today');
      setTimeframe('1d');
    }
  };

  const handleClearDate = () => {
    setSelectedDate('');
    setDateFilter('today');
    setTimeframe('1d');
  };

  const periodLabel = useMemo(() => {
    if (dateFilter === 'today') return 'Today';
    if (dateFilter === 'week') return 'This Week';
    if (dateFilter === 'month') return 'This Month';
    if (dateFilter === 'all') return 'All Time';
    if (dateFilter === 'custom' && selectedDate) {
      try {
        const [y, m, d] = selectedDate.split('-').map(Number);
        return format(new Date(y, m - 1, d), 'MMM d, yyyy');
      } catch {
        return selectedDate;
      }
    }
    return 'Today';
  }, [dateFilter, selectedDate]);

  const subtitleText = useMemo(() => {
    if (dateFilter === 'today') {
      return `${greeting}, ${managerName} — here's what's happening at ${branchName} today.`;
    }
    if (dateFilter === 'week') {
      return `${greeting}, ${managerName} — here's performance at ${branchName} this week.`;
    }
    if (dateFilter === 'month') {
      return `${greeting}, ${managerName} — here's performance at ${branchName} this month.`;
    }
    if (dateFilter === 'all') {
      return `${greeting}, ${managerName} — overall business overview for ${branchName}.`;
    }
    if (dateFilter === 'custom' && selectedDate) {
      return `${greeting}, ${managerName} — operational records for ${branchName} on ${periodLabel}.`;
    }
    return `${greeting}, ${managerName} — here's what's happening at ${branchName}.`;
  }, [dateFilter, greeting, managerName, branchName, periodLabel, selectedDate]);

  // Fetch real orders from database matching branch and date filter
  const { data: ordersResponse } = useQuery({
    queryKey: ['dashboard-orders', user?.branch?.id, dateParams.startDate, dateParams.endDate],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
        limit: 100,
      }),
    enabled: !!user?.branch?.id,
  });

  const realOrders = ordersResponse?.data || [];

  // Dynamic timeframe data
  const timeframeData = {
    '1d': {
      sales: 48250.0,
      salesChange: '+14.2%',
      orders: 184,
      ordersChange: '+8.5%',
      profit: 16887.5,
      profitMargin: '35.0%',
      aov: 262.23,
      chartPoints: [
        { x: 0, yRev: 140, yExp: 160, label: '10 AM', revenue: 3200, expense: 2100 },
        { x: 100, yRev: 80, yExp: 130, label: '12 PM', revenue: 9800, expense: 5600 },
        { x: 200, yRev: 100, yExp: 140, label: '2 PM', revenue: 7500, expense: 4800 },
        { x: 300, yRev: 125, yExp: 155, label: '4 PM', revenue: 4900, expense: 3200 },
        { x: 400, yRev: 60, yExp: 120, label: '6 PM', revenue: 11400, expense: 6900 },
        { x: 500, yRev: 50, yExp: 115, label: '8 PM', revenue: 12500, expense: 7400 },
        { x: 600, yRev: 130, yExp: 150, label: '10 PM', revenue: 4200, expense: 2700 },
      ],
      revPoly: '0,140 100,80 200,100 300,125 400,60 500,50 600,130 600,200 0,200',
      expPoly: '0,160 100,130 200,140 300,155 400,120 500,115 600,150 600,200 0,200',
      revLine: '0,140 100,80 200,100 300,125 400,60 500,50 600,130',
      expLine: '0,160 100,130 200,140 300,155 400,120 500,115 600,150',
    },
    '7d': {
      sales: 342800.0,
      salesChange: '+12.4%',
      orders: 1284,
      ordersChange: '+8.1%',
      profit: 119980.0,
      profitMargin: '35.0%',
      aov: 266.98,
      chartPoints: [
        { x: 0, yRev: 110, yExp: 145, label: 'Mon', revenue: 42000, expense: 27500 },
        { x: 100, yRev: 100, yExp: 142, label: 'Tue', revenue: 45000, expense: 28500 },
        { x: 200, yRev: 105, yExp: 140, label: 'Wed', revenue: 44000, expense: 29000 },
        { x: 300, yRev: 85, yExp: 135, label: 'Thu', revenue: 49500, expense: 30500 },
        { x: 400, yRev: 65, yExp: 130, label: 'Fri', revenue: 54000, expense: 31800 },
        { x: 500, yRev: 50, yExp: 125, label: 'Sat', revenue: 58500, expense: 33000 },
        { x: 600, yRev: 75, yExp: 132, label: 'Sun', revenue: 49800, expense: 31200 },
      ],
      revPoly: '0,110 100,100 200,105 300,85 400,65 500,50 600,75 600,200 0,200',
      expPoly: '0,145 100,142 200,140 300,135 400,130 500,125 600,132 600,200 0,200',
      revLine: '0,110 100,100 200,105 300,85 400,65 500,50 600,75',
      expLine: '0,145 100,142 200,140 300,135 400,130 500,125 600,132',
    },
    '30d': {
      sales: 1482000.0,
      salesChange: '+15.8%',
      orders: 5420,
      ordersChange: '+11.2%',
      profit: 518700.0,
      profitMargin: '35.0%',
      aov: 273.43,
      chartPoints: [
        { x: 0, yRev: 130, yExp: 155, label: 'Week 1', revenue: 320000, expense: 210000 },
        { x: 200, yRev: 100, yExp: 140, label: 'Week 2', revenue: 365000, expense: 235000 },
        { x: 400, yRev: 75, yExp: 130, label: 'Week 3', revenue: 392000, expense: 248000 },
        { x: 600, yRev: 60, yExp: 120, label: 'Week 4', revenue: 405000, expense: 255000 },
      ],
      revPoly: '0,130 200,100 400,75 600,60 600,200 0,200',
      expPoly: '0,155 200,140 400,130 600,120 600,200 0,200',
      revLine: '0,130 200,100 400,75 600,60',
      expLine: '0,155 200,140 400,130 600,120',
    },
    '90d': {
      sales: 4320500.0,
      salesChange: '+9.4%',
      orders: 16350,
      ordersChange: '+7.3%',
      profit: 1512175.0,
      profitMargin: '35.0%',
      aov: 264.25,
      chartPoints: [
        { x: 0, yRev: 120, yExp: 150, label: 'Month 1', revenue: 1380000, expense: 890000 },
        { x: 300, yRev: 90, yExp: 135, label: 'Month 2', revenue: 1458000, expense: 935000 },
        { x: 600, yRev: 70, yExp: 125, label: 'Month 3', revenue: 1482500, expense: 948000 },
      ],
      revPoly: '0,120 300,90 600,70 600,200 0,200',
      expPoly: '0,150 300,135 600,125 600,200 0,200',
      revLine: '0,120 300,90 600,70',
      expLine: '0,150 300,135 600,125',
    },
  };

  const currentStats = timeframeData[timeframe];

  // Authentic Ethiopian restaurant recent orders
  const recentOrders: RecentOrder[] = [
    {
      id: '1',
      orderNumber: 'ORD-10248',
      type: 'DINE_IN',
      customer: 'Abenezer Tadesse',
      table: 'T-04',
      waiter: 'Sara Wolde',
      items: [
        { name: 'Special Doro Wat', quantity: 2, price: 320 },
        { name: 'St. George Premium Beer', quantity: 2, price: 60 },
      ],
      subtotal: 760.0,
      vat: 114.0,
      serviceCharge: 76.0,
      total: 950.0,
      status: 'Paid',
      paymentMethod: 'Telebirr',
      time: '14:24',
    },
    {
      id: '2',
      orderNumber: 'ORD-10247',
      type: 'DINE_IN',
      customer: 'Hana Girma',
      table: 'T-11',
      waiter: 'Yonas Kebede',
      items: [
        { name: 'Special Sizzling Tibs', quantity: 2, price: 350 },
        { name: 'Shiro Tegabino', quantity: 1, price: 200 },
        { name: 'Sprite (Soft Drink)', quantity: 2, price: 45 },
      ],
      subtotal: 990.0,
      vat: 148.5,
      serviceCharge: 99.0,
      total: 1237.5,
      status: 'Preparing',
      paymentMethod: 'CBE Birr',
      time: '14:18',
    },
    {
      id: '3',
      orderNumber: 'ORD-10246',
      type: 'TAKEAWAY',
      customer: 'Walk-in Guest',
      waiter: 'Sara Wolde',
      items: [
        { name: 'Shiro Tegabino', quantity: 1, price: 200 },
        { name: 'Extra Teff Injera', quantity: 3, price: 40 },
      ],
      subtotal: 320.0,
      vat: 48.0,
      serviceCharge: 0.0,
      total: 368.0,
      status: 'Pending',
      paymentMethod: 'Cash',
      time: '14:12',
    },
    {
      id: '4',
      orderNumber: 'ORD-10245',
      type: 'DINE_IN',
      customer: 'Meron Alemu',
      table: 'T-08',
      waiter: 'Kaleb Dawit',
      items: [
        { name: 'Special Kitfo (Ayib & Gomen)', quantity: 1, price: 380 },
        { name: 'Mineral Water (Ambo)', quantity: 2, price: 50 },
      ],
      subtotal: 480.0,
      vat: 72.0,
      serviceCharge: 48.0,
      total: 600.0,
      status: 'Paid',
      paymentMethod: 'Card (POS)',
      time: '13:58',
    },
    {
      id: '5',
      orderNumber: 'ORD-10244',
      type: 'DELIVERY',
      customer: 'Dawit Legesse',
      waiter: 'Yonas Kebede',
      items: [
        { name: 'Special Doro Wat', quantity: 2, price: 320 },
        { name: 'Shekla Tibs', quantity: 2, price: 350 },
        { name: 'Fanta Orange', quantity: 4, price: 45 },
      ],
      subtotal: 1520.0,
      vat: 228.0,
      serviceCharge: 0.0,
      total: 1748.0,
      status: 'Served',
      paymentMethod: 'Telebirr',
      time: '13:45',
    },
    {
      id: '6',
      orderNumber: 'ORD-10243',
      type: 'DINE_IN',
      customer: 'Bethel Mekonnen',
      table: 'T-01',
      waiter: 'Sara Wolde',
      items: [{ name: 'Beyaynetu Fasting Platter', quantity: 2, price: 205 }],
      subtotal: 410.0,
      vat: 61.5,
      serviceCharge: 41.0,
      total: 512.5,
      status: 'Cancelled',
      paymentMethod: 'Unpaid',
      time: '13:30',
    },
  ];

  // Dynamic stats based on dateFilter and real orders
  const statsSummary = useMemo(() => {
    const hasRealOrders = realOrders.length > 0;

    let baseSales = 48250.0;
    let baseOrders = 184;
    let baseProfit = 16887.5;
    let growth = '+14.2%';

    if (dateFilter === 'today') {
      baseSales = 48250.0;
      baseOrders = 184;
      baseProfit = 16887.5;
      growth = '+14.2%';
    } else if (dateFilter === 'week') {
      baseSales = 342800.0;
      baseOrders = 1284;
      baseProfit = 119980.0;
      growth = '+12.4%';
    } else if (dateFilter === 'month') {
      baseSales = 1482000.0;
      baseOrders = 5420;
      baseProfit = 518700.0;
      growth = '+15.8%';
    } else if (dateFilter === 'all') {
      baseSales = 4320500.0;
      baseOrders = 16350;
      baseProfit = 1512175.0;
      growth = '+9.4%';
    } else if (dateFilter === 'custom') {
      baseSales = 45000.0;
      baseOrders = 172;
      baseProfit = 15750.0;
      growth = '+5.1%';
    }

    if (hasRealOrders) {
      const realSales = realOrders
        .filter((o: any) => o.status !== OrderStatus.CANCELLED)
        .reduce((sum: number, o: any) => sum + (o.total || 0), 0);
      const realOrderCount = realOrders.length;
      const realProfit = realSales * 0.35; // 35% margin

      return {
        sales: realSales,
        orders: realOrderCount,
        profit: realProfit,
        growth: '+10.5%',
        isLive: true,
      };
    }

    return {
      sales: baseSales,
      orders: baseOrders,
      profit: baseProfit,
      growth,
      isLive: false,
    };
  }, [realOrders, dateFilter]);

  // Map real backend orders to RecentOrder shape
  const mappedRealOrders: RecentOrder[] = useMemo(() => {
    return (realOrders || []).map((o: any) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      type: (o.type || 'DINE_IN') as any,
      customer: o.customer ? `${o.customer.firstName || ''} ${o.customer.lastName || ''}`.trim() : 'Guest Customer',
      table: o.table?.number ? `T-${o.table.number}` : undefined,
      waiter: o.table?.assignedWaiter
        ? `${o.table.assignedWaiter.firstName || ''} ${o.table.assignedWaiter.lastName || ''}`.trim()
        : o.createdBy
        ? `${o.createdBy.firstName || ''} ${o.createdBy.lastName || ''}`.trim()
        : 'Server',
      items: (o.items || []).map((it: any) => ({
        name: it.menuItem?.name || 'Menu Item',
        quantity: it.quantity || 1,
        price: it.price || 0,
      })),
      subtotal: o.subtotal || o.total || 0,
      vat: o.vat || 0,
      serviceCharge: o.serviceCharge || 0,
      total: o.total || 0,
      status: (o.status === 'COMPLETED' || o.paymentStatus === 'PAID')
        ? 'Paid'
        : o.status === 'PREPARING'
        ? 'Preparing'
        : o.status === 'SERVED'
        ? 'Served'
        : o.status === 'CANCELLED'
        ? 'Cancelled'
        : 'Pending',
      paymentMethod: o.paymentMethod || (o.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'),
      time: o.createdAt ? format(new Date(o.createdAt), 'HH:mm') : 'Recently',
    }));
  }, [realOrders]);

  const displayOrders = useMemo(() => {
    if (mappedRealOrders.length > 0) return mappedRealOrders;
    return dateFilter === 'today' || dateFilter === 'all' ? recentOrders : [];
  }, [mappedRealOrders, dateFilter, recentOrders]);

  const filteredOrders = useMemo(() => {
    return displayOrders.filter((order) => {
      if (orderChannelFilter === 'ALL') return true;
      return order.type === orderChannelFilter;
    });
  }, [displayOrders, orderChannelFilter]);

  // Authentic low stock inventory items
  const lowStockItems = [
    { name: 'Berbere Spice Blend', current: 1.2, threshold: 3.0, unit: 'kg', urgency: 'URGENT' },
    { name: 'Teff Flour Grade-1', current: 8.0, threshold: 20.0, unit: 'kg', urgency: 'LOW' },
    { name: 'Sidama Coffee Beans', current: 2.4, threshold: 5.0, unit: 'kg', urgency: 'WARNING' },
    { name: 'Niter Kibbeh (Clarified Butter)', current: 1.5, threshold: 4.0, unit: 'kg', urgency: 'URGENT' },
    { name: 'Cooking Oil (Sunflower)', current: 4.0, threshold: 10.0, unit: 'L', urgency: 'LOW' },
  ];

  // Authentic Ethiopian popular dishes
  const popularFoods = [
    { name: 'Special Doro Wat', percentage: 32, orders: 142, revenue: 45440, color: 'bg-emerald-500' },
    { name: 'Shekla Tibs Sizzling', percentage: 24, orders: 116, revenue: 34800, color: 'bg-amber-500' },
    { name: 'Kitfo Special (Ayib/Gomen)', percentage: 18, orders: 88, revenue: 26400, color: 'bg-blue-500' },
    { name: 'Shiro Tegabino Claypot', percentage: 15, orders: 72, revenue: 14400, color: 'bg-yellow-500' },
    { name: 'Beyaynetu Veggie Platter', percentage: 11, orders: 54, revenue: 9720, color: 'bg-purple-500' },
  ];

  // Dynamically calculate popular dishes from real orders or fallback
  const dynamicPopularDishes = useMemo(() => {
    const counts: Record<string, { name: string; count: number; revenue: number }> = {};
    realOrders.forEach((o: any) => {
      o.items?.forEach((it: any) => {
        const name = it.menuItem?.name || 'Special Dish';
        if (!counts[name]) counts[name] = { name, count: 0, revenue: 0 };
        counts[name].count += it.quantity || 1;
        counts[name].revenue += (it.price || 0) * (it.quantity || 1);
      });
    });

    const items = Object.values(counts).sort((a, b) => b.revenue - a.revenue);
    if (items.length === 0) return popularFoods;

    const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0) || 1;
    const colors = ['bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500'];

    return items.slice(0, 5).map((item, idx) => ({
      name: item.name,
      percentage: Math.round((item.revenue / totalRevenue) * 100),
      orders: item.count,
      revenue: item.revenue,
      color: colors[idx % colors.length],
    }));
  }, [realOrders, popularFoods]);

  const totalDishesSold = useMemo(() => {
    return dynamicPopularDishes.reduce((sum, d) => sum + d.orders, 0);
  }, [dynamicPopularDishes]);

  // Dynamic breakdown for the middle sales trend card based on dateFilter
  const salesTrendData = useMemo(() => {
    if (dateFilter === 'today' || dateFilter === 'custom') {
      return {
        title: `Sales Breakdown (${periodLabel})`,
        subtitle: `Hourly distribution for ${periodLabel}`,
        yLabels: ['15k', '10k', '5k', '0k'],
        points: [
          { x: 0, y: 115, label: '10 AM', sales: 3200 },
          { x: 45, y: 55, label: '12 PM', sales: 9800 },
          { x: 90, y: 75, label: '2 PM', sales: 7500 },
          { x: 135, y: 105, label: '4 PM', sales: 4900 },
          { x: 180, y: 40, label: '6 PM', sales: 11400 },
          { x: 225, y: 30, label: '8 PM', sales: 12500 },
          { x: 270, y: 110, label: '10 PM', sales: 4200 },
        ],
        polyline: '0,115 45,55 90,75 135,105 180,40 225,30 270,110',
      };
    }
    if (dateFilter === 'month') {
      return {
        title: `Sales This Month`,
        subtitle: `Weekly totals across current month`,
        yLabels: ['450k', '300k', '150k', '0k'],
        points: [
          { x: 0, y: 95, label: 'Wk 1', sales: 320000 },
          { x: 90, y: 65, label: 'Wk 2', sales: 365000 },
          { x: 180, y: 45, label: 'Wk 3', sales: 392000 },
          { x: 270, y: 35, label: 'Wk 4', sales: 405000 },
        ],
        polyline: '0,95 90,65 180,45 270,35',
      };
    }
    if (dateFilter === 'all') {
      return {
        title: `Sales Trend (All Time)`,
        subtitle: `Monthly revenue progression`,
        yLabels: ['1.5M', '1.0M', '0.5M', '0k'],
        points: [
          { x: 0, y: 100, label: 'M1', sales: 1380000 },
          { x: 135, y: 70, label: 'M2', sales: 1458000 },
          { x: 270, y: 50, label: 'M3', sales: 1482500 },
        ],
        polyline: '0,100 135,70 270,50',
      };
    }
    // Default: 'week'
    return {
      title: `Sales This Week`,
      subtitle: `Daily totals across current week`,
      yLabels: ['50k', '35k', '20k', '0k'],
      points: [
        { x: 0, y: 110, label: 'Mon', sales: 22400 },
        { x: 45, y: 95, label: 'Tue', sales: 25100 },
        { x: 90, y: 98, label: 'Wed', sales: 24800 },
        { x: 135, y: 70, label: 'Thu', sales: 29500 },
        { x: 180, y: 30, label: 'Fri', sales: 41200 },
        { x: 225, y: 18, label: 'Sat', sales: 48200 },
        { x: 270, y: 45, label: 'Sun', sales: 38600 },
      ],
      polyline: '0,110 45,95 90,98 135,70 180,30 225,18 270,45',
    };
  }, [dateFilter, periodLabel]);

  // Dynamic peak hours scaling based on the filtered orders volume
  const peakHoursData = useMemo(() => {
    const factor = Math.max(0.2, statsSummary.orders / 184);

    return [
      { hour: '11a', orders: Math.round(14 * factor), isRush: false },
      { hour: '12p', orders: Math.round(42 * factor), isRush: true },
      { hour: '1p', orders: Math.round(58 * factor), isRush: true },
      { hour: '2p', orders: Math.round(36 * factor), isRush: false },
      { hour: '3p', orders: Math.round(20 * factor), isRush: false },
      { hour: '4p', orders: Math.round(24 * factor), isRush: false },
      { hour: '5p', orders: Math.round(32 * factor), isRush: false },
      { hour: '6p', orders: Math.round(50 * factor), isRush: true },
      { hour: '7p', orders: Math.round(74 * factor), isRush: true },
      { hour: '8p', orders: Math.round(82 * factor), isRush: true },
      { hour: '9p', orders: Math.round(52 * factor), isRush: false },
    ];
  }, [statsSummary.orders]);

  const maxPeakOrders = useMemo(() => {
    return Math.max(...peakHoursData.map((h) => h.orders), 1);
  }, [peakHoursData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold';
      case 'Preparing':
        return 'bg-blue-100 text-blue-800 border-blue-300 font-bold';
      case 'Pending':
        return 'bg-amber-100 text-amber-800 border-amber-300 font-bold';
      case 'Served':
        return 'bg-gray-100 text-gray-800 border-gray-300 font-semibold';
      case 'Cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 w-full">
      {/* Welcome Header with Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {subtitleText}
          </p>
        </div>

        {/* Date Filter & Date Picker (Top Right) */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Preset Buttons */}
          <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-[#071a12] p-1 border border-gray-200 dark:border-[#143225]">
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                dateFilter === 'today'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('week')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                dateFilter === 'week'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('month')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                dateFilter === 'month'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                dateFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Individual Date Picker */}
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-[#00e676]/70 absolute left-2.5 pointer-events-none" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateSelect(e.target.value)}
              title="Pick an individual date"
              className={`pl-8 pr-7 py-1.5 text-xs rounded-xl border transition-all cursor-pointer [color-scheme:light] dark:[color-scheme:dark] ${
                dateFilter === 'custom' && selectedDate
                  ? 'border-emerald-500 bg-emerald-50/60 dark:bg-[#0f2d1e] text-emerald-900 dark:text-[#00e676] font-semibold ring-2 ring-emerald-500/20'
                  : 'border-gray-200 dark:border-[#143225] bg-white dark:bg-[#071a12] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#1a4231]'
              } focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm`}
            />
            {selectedDate && (
              <button
                type="button"
                onClick={handleClearDate}
                title="Clear selected date"
                className="absolute right-2 p-0.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#143225] transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 md:gap-6">
        {/* Sales Card */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-3.5 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-green-100 dark:bg-green-950/60 flex items-center justify-center text-green-700 dark:text-[#00e676] shrink-0">
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-green-700 dark:text-[#00e676] bg-green-50 dark:bg-green-950/40 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-800/60 flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                {statsSummary.growth}
              </span>
            </div>
            <h3 className="text-base sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              Br {statsSummary.sales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 font-medium truncate">
              Sales ({periodLabel})
            </p>
          </CardContent>
        </Card>

        {/* Orders Card */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-3.5 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-700 dark:text-orange-400 shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-green-700 dark:text-[#00e676] bg-green-50 dark:bg-green-950/40 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-800/60 flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                +8.5%
              </span>
            </div>
            <h3 className="text-base sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              {statsSummary.orders.toLocaleString()}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 font-medium truncate">
              Orders ({periodLabel})
            </p>
          </CardContent>
        </Card>

        {/* Profit Card */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-3.5 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0">
                <ChartUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-green-700 dark:text-[#00e676] bg-green-50 dark:bg-green-950/40 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-green-200 dark:border-green-800/60 flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                +12.4%
              </span>
            </div>
            <h3 className="text-base sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              Br {statsSummary.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 font-medium truncate">
              Est. Profit ({periodLabel})
            </p>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-3.5 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-700 dark:text-red-400 shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 sm:px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800/60 flex items-center gap-0.5 sm:gap-1">
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                2 urgent
              </span>
            </div>
            <h3 className="text-base sm:text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight truncate">
              {lowStockItems.length} items
            </h3>
            <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mt-0.5 sm:mt-1 font-medium truncate">
              Inventory alerts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Revenue vs Expenses (2/3) + Top Selling Dishes (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Area Chart */}
        <Card className="lg:col-span-2 border-gray-200 dark:border-[#143225] shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Sales overview</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Revenue vs. expenses - {timeframe === '1d' ? `today (${periodLabel})` : timeframe === '7d' ? 'last 7 days' : timeframe === '30d' ? 'last 30 days' : 'last 90 days'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-xs font-medium mr-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-gray-600 dark:text-gray-300 text-xs font-semibold">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-gray-600 dark:text-gray-300 text-xs font-semibold">Expenses</span>
                  </div>
                </div>

                <div className="flex bg-gray-100 dark:bg-[#071a12] p-0.5 rounded-md border border-gray-200 dark:border-[#143225] text-xs font-medium">
                  {(['1d', '7d', '30d', '90d'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimeframe(period)}
                      className={`px-2.5 py-1 rounded transition-all cursor-pointer ${
                        timeframe === period
                          ? 'bg-white dark:bg-[#123627] text-gray-900 dark:text-[#00e676] shadow-2xs font-bold'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 sm:h-80 relative mt-2">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[11px] text-gray-400 dark:text-gray-500 font-mono pr-2">
                <span>Br 80k</span>
                <span>Br 60k</span>
                <span>Br 40k</span>
                <span>Br 20k</span>
                <span>Br 0k</span>
              </div>

              {/* Chart area */}
              <div className="ml-12 mr-2 h-full pb-8 relative">
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.02" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  <line x1="0" y1="0" x2="600" y2="0" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <line x1="0" y1="50" x2="600" y2="50" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <line x1="0" y1="200" x2="600" y2="200" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />

                  {/* Gradient fills */}
                  <polygon points={currentStats.revPoly} fill="url(#revenueGrad)" />
                  <polygon points={currentStats.expPoly} fill="url(#expenseGrad)" />

                  {/* Lines */}
                  <polyline
                    points={currentStats.revLine}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points={currentStats.expLine}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {/* Interactive data point hover bubbles */}
                {currentStats.chartPoints.map((point, i) => (
                  <div key={i}>
                    {/* Revenue point */}
                    <div
                      className="absolute group/pt"
                      style={{
                        left: `${(point.x / 600) * 100}%`,
                        top: `${(point.yRev / 200) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white cursor-pointer hover:scale-150 transition-transform shadow-xs" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none z-20">
                        <div className="bg-gray-900 text-white rounded-lg shadow-xl px-3 py-2 whitespace-nowrap text-xs">
                          <p className="font-bold text-gray-200">{point.label}</p>
                          <p className="text-emerald-400 font-semibold">Revenue: Br {point.revenue.toLocaleString()}</p>
                          <p className="text-amber-400 font-semibold">Expense: Br {point.expense.toLocaleString()}</p>
                          <p className="text-gray-300 text-[10px] border-t border-gray-700 mt-1 pt-1">
                            Margin: Br {(point.revenue - point.expense).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Expense point */}
                    <div
                      className="absolute"
                      style={{
                        left: `${(point.x / 600) * 100}%`,
                        top: `${(point.yExp / 200) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-xs" />
                    </div>
                  </div>
                ))}
              </div>

              {/* X-axis labels */}
              <div className="flex justify-between text-xs font-medium text-gray-500 ml-12 mr-2">
                {currentStats.chartPoints.map((p, idx) => (
                  <span key={idx}>{p.label}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Popular Foods (Top Sellers) */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Popular dishes</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">Top selling menu items by volume & revenue ({periodLabel})</p>
          </CardHeader>
          <CardContent>
            {/* Visual Donut Chart */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-48 h-48 sm:w-52 sm:h-52">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Doro Wat - 32% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="15"
                    strokeDasharray={`${(dynamicPopularDishes[0]?.percentage || 32) * 2.51} ${100 * 2.51}`}
                    strokeDashoffset="0"
                  />
                  {/* Tibs - 24% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="15"
                    strokeDasharray={`${(dynamicPopularDishes[1]?.percentage || 24) * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${(dynamicPopularDishes[0]?.percentage || 32) * 2.51}`}
                  />
                  {/* Kitfo - 18% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="15"
                    strokeDasharray={`${(dynamicPopularDishes[2]?.percentage || 18) * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${((dynamicPopularDishes[0]?.percentage || 32) + (dynamicPopularDishes[1]?.percentage || 24)) * 2.51}`}
                  />
                  {/* Shiro - 15% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="15"
                    strokeDasharray={`${(dynamicPopularDishes[3]?.percentage || 15) * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${((dynamicPopularDishes[0]?.percentage || 32) + (dynamicPopularDishes[1]?.percentage || 24) + (dynamicPopularDishes[2]?.percentage || 18)) * 2.51}`}
                  />
                  {/* Beyaynetu - 11% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="15"
                    strokeDasharray={`${(dynamicPopularDishes[4]?.percentage || 11) * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${((dynamicPopularDishes[0]?.percentage || 32) + (dynamicPopularDishes[1]?.percentage || 24) + (dynamicPopularDishes[2]?.percentage || 18) + (dynamicPopularDishes[3]?.percentage || 15)) * 2.51}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{totalDishesSold}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Dishes</span>
                </div>
              </div>
            </div>

            {/* Dish Rankings List */}
            <div className="space-y-2.5 mt-4">
              {dynamicPopularDishes.map((food, i) => (
                <div key={i} className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-gray-100 dark:border-[#143225] last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${food.color}`} />
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{food.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white">{food.percentage}%</span>
                    <span className="text-gray-400 dark:text-gray-400 ml-2 font-mono text-xs">(Br {food.revenue.toLocaleString()})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Breakdown Row - Sales by Day, Peak Hours, Staffing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend (Filtered by Date Filter) */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900 dark:text-white">{salesTrendData.title}</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">{salesTrendData.subtitle}</p>
          </CardHeader>
          <CardContent>
            <div className="h-52 relative">
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[11px] font-mono text-gray-400 dark:text-gray-500 pr-1">
                {salesTrendData.yLabels.map((yl, idx) => (
                  <span key={idx}>{yl}</span>
                ))}
              </div>
              <div className="ml-9 h-full relative pb-2">
                <svg className="w-full h-full" viewBox="0 0 280 140" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="280" y2="0" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <line x1="0" y1="46" x2="280" y2="46" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <line x1="0" y1="92" x2="280" y2="92" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <line x1="0" y1="138" x2="280" y2="138" stroke="currentColor" className="text-gray-100 dark:text-[#143225]" strokeWidth="1" />
                  <polyline
                    points={salesTrendData.polyline}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {salesTrendData.points.map((pt, i) => (
                  <div
                    key={i}
                    className="absolute group/pt"
                    style={{
                      left: `${(pt.x / 270) * 100}%`,
                      top: `${(pt.y / 140) * 100}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="w-3 h-3 rounded-full bg-emerald-600 border-2 border-white cursor-pointer hover:scale-150 transition-transform shadow-xs" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/pt:opacity-100 transition-opacity pointer-events-none z-20">
                      <div className="bg-gray-900 text-white rounded-md px-2 py-1 text-[11px] whitespace-nowrap">
                        <span className="font-bold">{pt.label}:</span> Br {pt.sales.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mt-2 ml-9">
              {salesTrendData.points.map((pt, idx) => (
                <span key={idx}>{pt.label}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peak Ordering Hours */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Peak hours</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">Orders distribution - {periodLabel}</p>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-end justify-between gap-1.5 px-1 pb-2">
              {peakHoursData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group/bar relative">
                  <div
                    className={`w-full rounded-t transition-all cursor-pointer ${
                      item.isRush ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-200 dark:bg-[#143225] hover:bg-gray-300 dark:hover:bg-[#1b3d2e]'
                    }`}
                    style={{ height: `${Math.max(8, (item.orders / maxPeakOrders) * 155)}px` }}
                  >
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                      <div className="bg-gray-900 text-white rounded-md px-2 py-1 text-[10px]">
                        <span className="font-bold">{item.hour}:</span> {item.orders} orders
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-2 px-1">
              <span>11 AM</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">12 - 2 PM</span>
              <span className="text-orange-600 dark:text-orange-400 font-bold">7 - 9 PM</span>
              <span>10 PM</span>
            </div>
          </CardContent>
        </Card>

        {/* Staff & Shift Roster */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900 dark:text-white">Operations</CardTitle>
            <p className="text-xs text-gray-500 dark:text-gray-400">Live branch status</p>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Staff on Duty
                </span>
                <span className="text-gray-900 dark:text-white font-bold">11 / 14 Present</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-[#143225] rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Kitchen Queue
                </span>
                <span className="text-gray-900 dark:text-white font-bold">5 Active Tickets</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-[#143225] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Reservations Today
                </span>
                <span className="text-blue-700 dark:text-blue-400 font-bold">8 Bookings (34 Guests)</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/employees')}
              className="w-full text-xs font-semibold text-gray-700 dark:text-gray-200 dark:border-[#143225] dark:hover:bg-[#12281d] mt-2 gap-1.5 cursor-pointer"
            >
              <UsersIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <span>Manage Staff Directory</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Recent Orders Master Table (2/3) + Low Stock Alert (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Master View */}
        <Card className="lg:col-span-2 border-gray-200 dark:border-[#143225] shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">Recent orders</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">Live order stream across Dine-in, Takeaway, and Delivery</p>
              </div>

              {/* Channel filter tabs */}
              <div className="flex items-center bg-gray-100 dark:bg-[#071a12] p-0.5 rounded-lg border border-gray-200 dark:border-[#143225] text-xs">
                {(['ALL', 'DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setOrderChannelFilter(ch)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                      orderChannelFilter === ch
                        ? 'bg-white dark:bg-[#123627] text-gray-900 dark:text-[#00e676] shadow-2xs'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {ch === 'ALL' ? 'All' : ch === 'DINE_IN' ? 'Dine-In' : ch === 'TAKEAWAY' ? 'Takeaway' : 'Delivery'}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#143225] text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Customer / Channel</th>
                    <th className="py-3 px-3">Table / Server</th>
                    <th className="py-3 px-3 text-right">Total (Br)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#143225] text-xs sm:text-sm">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 dark:text-gray-400">
                        <ShoppingBag className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">No orders recorded for {periodLabel}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try selecting another date or switch to All Time</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePresetChange('all')}
                          className="mt-3 text-xs dark:border-[#143225] dark:text-[#00e676] cursor-pointer"
                        >
                          View All Orders
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50/80 dark:hover:bg-[#0c2f21]/40 transition-colors">
                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-gray-900 dark:text-white">{order.orderNumber}</span>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" /> {order.time}
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-gray-800 dark:text-gray-200">{order.customer}</div>
                          <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-[#071a12] text-gray-600 dark:text-gray-300 border border-transparent dark:border-[#143225] mt-0.5">
                            {order.type}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-medium text-gray-900 dark:text-gray-200">{order.table || 'Counter'}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{order.waiter}</div>
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900 dark:text-[#00e676] text-sm">
                          Br {order.total.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-3 text-center">
                          <span className={`inline-block px-3 py-1 text-xs rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            className="h-8 text-xs font-bold text-emerald-700 dark:text-[#00e676] hover:text-emerald-800 dark:hover:text-[#69f0ae] hover:bg-emerald-50 dark:hover:bg-[#0c2f21] px-3 cursor-pointer"
                          >
                            Invoice
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#143225] flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Showing {filteredOrders.length} recent orders ({periodLabel})</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="text-xs text-emerald-700 dark:text-[#00e676] font-bold p-0 h-auto cursor-pointer"
              >
                View all orders & invoices &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts & Purchase Order Quick Trigger */}
        <Card className="border-gray-200 dark:border-[#143225] shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Low stock
                </CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">Below reorder threshold</p>
              </div>
              <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold text-xs">
                {lowStockItems.length} Low
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockItems.map((item, i) => {
              const pct = Math.min(100, Math.round((item.current / item.threshold) * 100));
              const isUrgent = item.urgency === 'URGENT';

              return (
                <div key={i} className="p-2.5 rounded-lg border border-gray-100 dark:border-[#143225] bg-gray-50/50 dark:bg-[#07150f]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{item.name}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      isUrgent ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 animate-pulse' : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                    }`}>
                      {item.current} / {item.threshold} {item.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-[#143225] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isUrgent ? 'bg-rose-500' : 'bg-amber-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}

            <div className="pt-2">
              <Button
                onClick={() => setIsPoModalOpen(true)}
                className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-xs cursor-pointer"
              >
                <Package className="w-4 h-4" />
                <span>Create Purchase Order</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Quick-View Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#143225] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gray-900 dark:bg-[#04120b] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-mono font-bold text-sm">Receipt #{selectedOrder.orderNumber}</h3>
                  <p className="text-[11px] text-gray-400">{selectedOrder.customer} • {selectedOrder.time}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 dark:hover:bg-[#12281d] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100 dark:border-[#143225]">
                <div>
                  <span className="text-gray-400">Channel:</span>{' '}
                  <strong className="text-gray-800 dark:text-gray-200 font-bold">{selectedOrder.type}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Server:</span>{' '}
                  <strong className="text-gray-800 dark:text-gray-200 font-bold">{selectedOrder.waiter}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Table:</span>{' '}
                  <strong className="text-gray-800 dark:text-gray-200 font-bold">{selectedOrder.table || 'Counter'}</strong>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Items Ordered</p>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-gray-800 dark:text-gray-200 font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-gray-900 dark:text-white font-semibold">
                      Br {(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="pt-3 border-t border-gray-200 dark:border-[#143225] space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200 font-medium">Br {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>VAT (15%):</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200 font-medium">Br {selectedOrder.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Service Charge:</span>
                  <span className="font-mono text-gray-800 dark:text-gray-200 font-medium">Br {selectedOrder.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-[#143225]">
                  <span>Total Amount:</span>
                  <span className="font-mono text-emerald-700 dark:text-[#00e676]">Br {selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 pt-1">
                  <span>Payment Method:</span>
                  <Badge variant="outline" className="font-bold text-gray-700 dark:text-gray-300 dark:border-[#143225]">
                    {selectedOrder.paymentMethod}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-[#07150f] border-t border-gray-200 dark:border-[#143225] flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="text-xs font-semibold dark:border-[#143225] dark:text-gray-200 dark:hover:bg-[#12281d] cursor-pointer"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                  setSelectedOrder(null);
                }}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Purchase Order Trigger Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 dark:border-[#143225] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-200" />
                <h3 className="font-bold text-sm">Quick Purchase Requisition</h3>
              </div>
              <button
                onClick={() => {
                  setIsPoModalOpen(false);
                  setPoSubmitted(false);
                }}
                className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {poSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#00e676] flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white">Purchase Order Sent!</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    A stock requisition for 5 critical items has been dispatched to suppliers.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Generate an emergency restocking purchase order for all items currently below threshold:
                  </p>

                  <div className="space-y-1.5 bg-gray-50 dark:bg-[#07150f] p-3 rounded-lg border border-gray-200 dark:border-[#143225] text-xs">
                    {lowStockItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{item.name}</span>
                        <span className="font-mono text-gray-600 dark:text-gray-400 font-bold">
                          +{(item.threshold * 2 - item.current).toFixed(1)} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Target Supplier: <strong className="text-gray-800 dark:text-gray-200">Addis Agri-Wholesale Co.</strong>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-[#07150f] border-t border-gray-200 dark:border-[#143225] flex items-center justify-end gap-2">
              {poSubmitted ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsPoModalOpen(false);
                    setPoSubmitted(false);
                  }}
                  className="text-xs font-bold bg-gray-900 dark:bg-[#123627] text-white dark:text-[#00e676] cursor-pointer"
                >
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPoModalOpen(false)}
                    className="text-xs font-semibold dark:border-[#143225] dark:text-gray-200 dark:hover:bg-[#12281d] cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPoSubmitted(true)}
                    className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1 cursor-pointer"
                  >
                    Confirm & Send Order
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
