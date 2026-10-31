import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
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
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('7d');
  const [orderChannelFilter, setOrderChannelFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY'>('ALL');
  const [selectedOrder, setSelectedOrder] = useState<RecentOrder | null>(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poSubmitted, setPoSubmitted] = useState(false);

  // Dynamic greeting based on current hour
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening';
  const managerName = user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'Branch Manager';
  const branchName = user?.branch?.name || 'Main Branch';

  // Dynamic timeframe data
  const timeframeData = {
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

  const filteredOrders = recentOrders.filter((order) => {
    if (orderChannelFilter === 'ALL') return true;
    return order.type === orderChannelFilter;
  });

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
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-500 mt-1">
          {greeting}, {managerName} — here's what's happening at <strong className="text-gray-800 font-semibold">{branchName}</strong> today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Today's Sales */}
        <Card className="border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-700">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +14.2%
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Br 48,250.00</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Today's sales</p>
          </CardContent>
        </Card>

        {/* Orders Today */}
        <Card className="border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +8.5%
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">184</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Orders today</p>
          </CardContent>
        </Card>

        {/* Profit */}
        <Card className="border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700">
                <ChartUp className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12.4%
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Br 119,980.00</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Profit [7d]</p>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        <Card className="border-gray-200 shadow-2xs hover:shadow-sm transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                2 urgent
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">4 items</h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-medium">Inventory alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row - Revenue vs Expenses (2/3) + Top Selling Dishes (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Area Chart */}
        <Card className="lg:col-span-2 border-gray-200 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Sales overview</CardTitle>
                <p className="text-xs text-gray-500">
                  Revenue vs. expenses - {timeframe === '7d' ? 'last 7 days' : timeframe === '30d' ? 'last 30 days' : 'last 90 days'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-3 text-xs font-medium mr-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-gray-600 text-xs font-semibold">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-gray-600 text-xs font-semibold">Expenses</span>
                  </div>
                </div>

                <div className="flex bg-gray-100 p-0.5 rounded-md border border-gray-200 text-xs font-medium">
                  {(['7d', '30d', '90d'] as const).map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimeframe(period)}
                      className={`px-2.5 py-1 rounded transition-all ${
                        timeframe === period
                          ? 'bg-white text-gray-900 shadow-2xs font-bold'
                          : 'text-gray-600 hover:text-gray-900'
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
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[11px] text-gray-400 font-mono pr-2">
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
                  <line x1="0" y1="0" x2="600" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="200" x2="600" y2="200" stroke="#f3f4f6" strokeWidth="1" />

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
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-gray-900">Popular dishes</CardTitle>
            <p className="text-xs text-gray-500">Top selling menu items by volume & revenue</p>
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
                    strokeDasharray={`${32 * 2.51} ${100 * 2.51}`}
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
                    strokeDasharray={`${24 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${32 * 2.51}`}
                  />
                  {/* Kitfo - 18% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="15"
                    strokeDasharray={`${18 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${(32 + 24) * 2.51}`}
                  />
                  {/* Shiro - 15% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="15"
                    strokeDasharray={`${15 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${(32 + 24 + 18) * 2.51}`}
                  />
                  {/* Beyaynetu - 11% */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="15"
                    strokeDasharray={`${11 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${(32 + 24 + 18 + 15) * 2.51}`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-black text-gray-900 tracking-tight">472</span>
                  <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">Dishes</span>
                </div>
              </div>
            </div>

            {/* Dish Rankings List */}
            <div className="space-y-2.5 mt-4">
              {popularFoods.map((food, i) => (
                <div key={i} className="flex items-center justify-between text-xs sm:text-sm py-1.5 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full ${food.color}`} />
                    <span className="font-semibold text-gray-800">{food.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900">{food.percentage}%</span>
                    <span className="text-gray-400 ml-2 font-mono text-xs">(Br {food.revenue.toLocaleString()})</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Breakdown Row - Sales by Day, Peak Hours, Staffing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales This Week */}
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">Sales this week</CardTitle>
            <p className="text-xs text-gray-500">Daily totals across current week</p>
          </CardHeader>
          <CardContent>
            <div className="h-52 relative">
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[11px] font-mono text-gray-400 pr-1">
                <span>50k</span>
                <span>35k</span>
                <span>20k</span>
                <span>0k</span>
              </div>
              <div className="ml-9 h-full relative pb-2">
                <svg className="w-full h-full" viewBox="0 0 280 140" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="280" y2="0" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="46" x2="280" y2="46" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="92" x2="280" y2="92" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="0" y1="138" x2="280" y2="138" stroke="#f3f4f6" strokeWidth="1" />
                  <polyline
                    points="0,110 45,95 90,98 135,70 180,30 225,18 270,45"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>

                {[
                  { x: 0, y: 110, day: 'Mon', sales: 22400 },
                  { x: 45, y: 95, day: 'Tue', sales: 25100 },
                  { x: 90, y: 98, day: 'Wed', sales: 24800 },
                  { x: 135, y: 70, day: 'Thu', sales: 29500 },
                  { x: 180, y: 30, day: 'Fri', sales: 41200 },
                  { x: 225, y: 18, day: 'Sat', sales: 48200 },
                  { x: 270, y: 45, day: 'Sun', sales: 38600 },
                ].map((pt, i) => (
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
                        <span className="font-bold">{pt.day}:</span> Br {pt.sales.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between text-xs font-semibold text-gray-500 mt-2 ml-9">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </CardContent>
        </Card>

        {/* Peak Ordering Hours */}
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">Peak hours</CardTitle>
            <p className="text-xs text-gray-500">Orders by hour - today</p>
          </CardHeader>
          <CardContent>
            <div className="h-52 flex items-end justify-between gap-1.5 px-1 pb-2">
              {[
                { hour: '11a', orders: 14, isRush: false },
                { hour: '12p', orders: 42, isRush: true },
                { hour: '1p', orders: 58, isRush: true },
                { hour: '2p', orders: 36, isRush: false },
                { hour: '3p', orders: 20, isRush: false },
                { hour: '4p', orders: 24, isRush: false },
                { hour: '5p', orders: 32, isRush: false },
                { hour: '6p', orders: 50, isRush: true },
                { hour: '7p', orders: 74, isRush: true },
                { hour: '8p', orders: 82, isRush: true },
                { hour: '9p', orders: 52, isRush: false },
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group/bar relative">
                  <div
                    className={`w-full rounded-t transition-all cursor-pointer ${
                      item.isRush ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                    style={{ height: `${(item.orders / 82) * 155}px` }}
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
            <div className="flex justify-between text-[11px] text-gray-500 font-medium mt-2 px-1">
              <span>11 AM</span>
              <span className="text-orange-600 font-bold">12 - 2 PM</span>
              <span className="text-orange-600 font-bold">7 - 9 PM</span>
              <span>10 PM</span>
            </div>
          </CardContent>
        </Card>

        {/* Staff & Shift Roster */}
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-gray-900">Operations</CardTitle>
            <p className="text-xs text-gray-500">Live branch status</p>
          </CardHeader>
          <CardContent className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <UsersIcon className="w-4 h-4 text-purple-600" />
                  Staff on Duty
                </span>
                <span className="text-gray-900 font-bold">11 / 14 Present</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '78%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  Kitchen Queue
                </span>
                <span className="text-gray-900 font-bold">5 Active Tickets</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1">
                <span className="text-gray-700 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Reservations Today
                </span>
                <span className="text-blue-700 font-bold">8 Bookings (34 Guests)</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/employees')}
              className="w-full text-xs font-semibold text-gray-700 mt-2 gap-1.5"
            >
              <UsersIcon className="w-3.5 h-3.5 text-gray-500" />
              <span>Manage Staff Directory</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Recent Orders Master Table (2/3) + Low Stock Alert (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders Master View */}
        <Card className="lg:col-span-2 border-gray-200 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">Recent orders</CardTitle>
                <p className="text-xs text-gray-500">Live order stream across Dine-in, Takeaway, and Delivery</p>
              </div>

              {/* Channel filter tabs */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-xs">
                {(['ALL', 'DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setOrderChannelFilter(ch)}
                    className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                      orderChannelFilter === ch
                        ? 'bg-white text-gray-900 shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
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
                  <tr className="border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="py-3 px-3">Order #</th>
                    <th className="py-3 px-3">Customer / Channel</th>
                    <th className="py-3 px-3">Table / Server</th>
                    <th className="py-3 px-3 text-right">Total (Br)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-gray-900">{order.orderNumber}</span>
                        <div className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {order.time}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-gray-800">{order.customer}</div>
                        <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 mt-0.5">
                          {order.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-gray-900">{order.table || 'Counter'}</div>
                        <div className="text-xs text-gray-400">{order.waiter}</div>
                      </td>

                      <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900 text-sm">
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
                          className="h-8 text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-3"
                        >
                          Invoice
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {filteredOrders.length} recent orders</span>
              <Button
                variant="link"
                size="sm"
                onClick={() => navigate('/admin/orders')}
                className="text-xs text-emerald-700 font-bold p-0 h-auto"
              >
                View all orders & invoices &rarr;
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts & Purchase Order Quick Trigger */}
        <Card className="border-gray-200 shadow-2xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Low stock
                </CardTitle>
                <p className="text-xs text-gray-500">Below reorder threshold</p>
              </div>
              <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-bold text-xs">
                {lowStockItems.length} Low
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {lowStockItems.map((item, i) => {
              const pct = Math.min(100, Math.round((item.current / item.threshold) * 100));
              const isUrgent = item.urgency === 'URGENT';

              return (
                <div key={i} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-gray-900">{item.name}</span>
                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                      isUrgent ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.current} / {item.threshold} {item.unit}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
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
                className="w-full text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-2 shadow-xs"
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-mono font-bold text-sm">Receipt #{selectedOrder.orderNumber}</h3>
                  <p className="text-[11px] text-gray-400">{selectedOrder.customer} • {selectedOrder.time}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-100">
                <div>
                  <span className="text-gray-400">Channel:</span>{' '}
                  <strong className="text-gray-800 font-bold">{selectedOrder.type}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Server:</span>{' '}
                  <strong className="text-gray-800 font-bold">{selectedOrder.waiter}</strong>
                </div>
                <div>
                  <span className="text-gray-400">Table:</span>{' '}
                  <strong className="text-gray-800 font-bold">{selectedOrder.table || 'Counter'}</strong>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Items Ordered</p>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-xs py-1">
                    <span className="text-gray-800 font-medium">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-mono text-gray-900 font-semibold">
                      Br {(item.quantity * item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Calculations */}
              <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">Br {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (15%):</span>
                  <span className="font-mono">Br {selectedOrder.vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service Charge:</span>
                  <span className="font-mono">Br {selectedOrder.serviceCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-gray-100">
                  <span>Total Amount:</span>
                  <span className="font-mono text-emerald-700">Br {selectedOrder.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 pt-1">
                  <span>Payment Method:</span>
                  <Badge variant="outline" className="font-bold text-gray-700">
                    {selectedOrder.paymentMethod}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedOrder(null)}
                className="text-xs font-semibold"
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  window.print();
                  setSelectedOrder(null);
                }}
                className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
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
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
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
                className="p-1 rounded-lg text-amber-200 hover:text-white hover:bg-amber-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {poSubmitted ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-gray-900">Purchase Order Sent!</h4>
                  <p className="text-xs text-gray-500">
                    A stock requisition for 5 critical items has been dispatched to suppliers.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-gray-600">
                    Generate an emergency restocking purchase order for all items currently below threshold:
                  </p>

                  <div className="space-y-1.5 bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs">
                    {lowStockItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between py-0.5">
                        <span className="font-medium text-gray-800">{item.name}</span>
                        <span className="font-mono text-gray-600 font-bold">
                          +{(item.threshold * 2 - item.current).toFixed(1)} {item.unit}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500">
                    Target Supplier: <strong className="text-gray-800">Addis Agri-Wholesale Co.</strong>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
              {poSubmitted ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setIsPoModalOpen(false);
                    setPoSubmitted(false);
                  }}
                  className="text-xs font-bold bg-gray-900 text-white"
                >
                  Done
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPoModalOpen(false)}
                    className="text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPoSubmitted(true)}
                    className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1"
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
