import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingBag,
  TrendingUp as ChartUp,
  AlertTriangle,
  Table,
  Users as UsersIcon,
  Clock,
  ChefHat,
  Calendar,
  Package,
} from 'lucide-react';

export default function DashboardPage() {
  // Mock data - replace with real API data
  const stats = {
    todaySales: 38900.0,
    salesChange: 12.4,
    ordersToday: 196,
    ordersChange: 8.1,
    profit: 84210.0,
    profitChange: 4.2,
    inventoryAlerts: 4,
  };

  const recentOrders = [
    { id: '10248', customer: 'Abenezer T.', table: 'T-04', waiter: 'Sara', total: 620.0, status: 'Paid' },
    { id: '10247', customer: 'Hana G.', table: 'T-11', waiter: 'Yonas', total: 1240.0, status: 'Preparing' },
    { id: '10246', customer: 'Walkin', table: 'T-02', waiter: 'Sara', total: 320.0, status: 'Pending' },
    { id: '10245', customer: 'Meron A.', table: 'T-08', waiter: 'Kaleb', total: 890.0, status: 'Paid' },
    { id: '10244', customer: 'Dawit L.', table: 'T-05', waiter: 'Yonas', total: 1580.0, status: 'Served' },
    { id: '10243', customer: 'Bethel M.', table: 'T-01', waiter: 'Sara', total: 410.0, status: 'Cancelled' },
  ];

  const lowStockItems = [
    { name: 'Berbere spice', current: 1.2, threshold: 3, unit: 'kg' },
    { name: 'Teff flour', current: 8, threshold: 20, unit: 'kg' },
    { name: 'Coffee beans', current: 2.4, threshold: 5, unit: 'kg' },
    { name: 'Cooking oil', current: 4, threshold: 10, unit: 'L' },
  ];

  const popularFoods = [
    { name: 'Doro Wat', percentage: 32, color: 'bg-green-500' },
    { name: 'Kitfo', percentage: 24, color: 'bg-orange-500' },
    { name: 'Shiro', percentage: 18, color: 'bg-blue-500' },
    { name: 'Tibs', percentage: 15, color: 'bg-yellow-500' },
    { name: 'Injera Plate', percentage: 11, color: 'bg-purple-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Preparing':
        return 'bg-blue-100 text-blue-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'Served':
        return 'bg-gray-100 text-gray-700';
      case 'Cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Good afternoon, Abel — here's what's happening at Bole Main.</p>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Sales */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {stats.salesChange}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Br {stats.todaySales.toLocaleString()}</h3>
              <p className="text-sm text-gray-500">Today's sales</p>
            </CardContent>
          </Card>

          {/* Orders Today */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {stats.ordersChange}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.ordersToday}</h3>
              <p className="text-sm text-gray-500">Orders today</p>
            </CardContent>
          </Card>

          {/* Profit */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <ChartUp className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  {stats.profitChange}%
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Br {stats.profit.toLocaleString()}</h3>
              <p className="text-sm text-gray-500">Profit [7d]</p>
            </CardContent>
          </Card>

          {/* Inventory Alerts */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-sm font-semibold text-red-600 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  2 new
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">{stats.inventoryAlerts} items</h3>
              <p className="text-sm text-gray-500">Inventory alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row - Sales Overview (2/3) + Popular Foods (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Overview - Takes 2 columns */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Sales overview</CardTitle>
                  <p className="text-sm text-gray-500">Revenue vs. expenses - last 7 months</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md">7d</button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md">30d</button>
                  <button className="px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md">90d</button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <span>800k</span>
                  <span>600k</span>
                  <span>400k</span>
                  <span>200k</span>
                  <span>0k</span>
                </div>

                {/* Chart area */}
                <div className="ml-10 mr-4 h-full pb-8 relative">
                  <svg className="w-full h-full" viewBox="0 0 700 200" preserveAspectRatio="none">
                    <defs>
                      {/* Gradient for revenue area */}
                      <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                      </linearGradient>
                      {/* Gradient for expense area */}
                      <linearGradient id="expenseGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="0" x2="700" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="50" x2="700" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="100" x2="700" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="150" x2="700" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="200" x2="700" y2="200" stroke="#e5e7eb" strokeWidth="1" />

                    {/* Revenue area fill */}
                    <polygon
                      points="0,100 100,90 200,95 300,70 400,60 500,55 600,45 700,40 700,200 0,200"
                      fill="url(#revenueGradient)"
                    />

                    {/* Expense area fill */}
                    <polygon
                      points="0,140 100,138 200,135 300,130 400,125 500,122 600,118 700,115 700,200 0,200"
                      fill="url(#expenseGradient)"
                    />

                    {/* Revenue line */}
                    <polyline
                      points="0,100 100,90 200,95 300,70 400,60 500,55 600,45 700,40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Expense line */}
                    <polyline
                      points="0,140 100,138 200,135 300,130 400,125 500,122 600,118 700,115"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  {/* Interactive data points with tooltips */}
                  {[
                    { x: 0, yRev: 100, yExp: 140, month: 'Jan', revenue: 420000, expense: 280000 },
                    { x: 100, yRev: 90, yExp: 138, month: 'Feb', revenue: 450000, expense: 285000 },
                    { x: 200, yRev: 95, yExp: 135, month: 'Mar', revenue: 440000, expense: 290000 },
                    { x: 300, yRev: 70, yExp: 130, month: 'Apr', revenue: 490000, expense: 300000 },
                    { x: 400, yRev: 60, yExp: 125, month: 'May', revenue: 510000, expense: 310000 },
                    { x: 500, yRev: 55, yExp: 122, month: 'Jun', revenue: 530000, expense: 315000 },
                    { x: 600, yRev: 45, yExp: 118, month: 'Jul', revenue: 560000, expense: 320000 },
                  ].map((point, i) => (
                    <div key={i}>
                      {/* Revenue point */}
                      <div
                        className="absolute group/point"
                        style={{
                          left: `${(point.x / 700) * 100}%`,
                          top: `${(point.yRev / 200) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white cursor-pointer hover:scale-150 transition-transform" />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 whitespace-nowrap">
                            <p className="text-xs font-semibold text-gray-900">{point.month}</p>
                            <p className="text-xs text-green-600">Revenue: Br {(point.revenue / 1000).toFixed(0)}k</p>
                            <p className="text-xs text-orange-600">Expense: Br {(point.expense / 1000).toFixed(0)}k</p>
                          </div>
                          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 absolute left-1/2 -translate-x-1/2 -bottom-1 rotate-45" />
                        </div>
                      </div>

                      {/* Expense point */}
                      <div
                        className="absolute"
                        style={{
                          left: `${(point.x / 700) * 100}%`,
                          top: `${(point.yExp / 200) * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                      >
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 border-2 border-white" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-xs text-gray-500 ml-10 mr-4">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Popular Foods - Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Popular foods</CardTitle>
              <p className="text-sm text-gray-500">Top sellers this week</p>
            </CardHeader>
            <CardContent>
              {/* Donut Chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Doro Wat - 32% - Green */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="20"
                      strokeDasharray={`${32 * 2.51} ${100 * 2.51}`}
                      strokeDashoffset="0"
                    />
                    {/* Kitfo - 24% - Orange */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#f97316"
                      strokeWidth="20"
                      strokeDasharray={`${24 * 2.51} ${100 * 2.51}`}
                      strokeDashoffset={`-${32 * 2.51}`}
                    />
                    {/* Shiro - 18% - Blue */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="20"
                      strokeDasharray={`${18 * 2.51} ${100 * 2.51}`}
                      strokeDashoffset={`-${(32 + 24) * 2.51}`}
                    />
                    {/* Tibs - 15% - Yellow */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#eab308"
                      strokeWidth="20"
                      strokeDasharray={`${15 * 2.51} ${100 * 2.51}`}
                      strokeDashoffset={`-${(32 + 24 + 18) * 2.51}`}
                    />
                    {/* Injera Plate - 11% - Purple */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="#a855f7"
                      strokeWidth="20"
                      strokeDasharray={`${11 * 2.51} ${100 * 2.51}`}
                      strokeDashoffset={`-${(32 + 24 + 18 + 15) * 2.51}`}
                    />
                  </svg>
                </div>
              </div>
              
              {/* Legend */}
              <div className="space-y-2">
                {popularFoods.map((food, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${food.color}`} />
                      <span className="text-sm text-gray-700">{food.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{food.percentage}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row - Sales This Week, Peak Hours, Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales This Week */}
          <Card>
            <CardHeader>
              <CardTitle>Sales this week</CardTitle>
              <p className="text-sm text-gray-500">Daily totals</p>
            </CardHeader>
            <CardContent>
              <div className="h-48 relative">
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
                  <span>40k</span>
                  <span>30k</span>
                  <span>20k</span>
                  <span>10k</span>
                  <span>0k</span>
                </div>
                
                {/* Chart area */}
                <div className="ml-8 h-full relative group">
                  <svg className="w-full h-full" viewBox="0 0 280 160" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2="280" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="40" x2="280" y2="40" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="80" x2="280" y2="80" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="120" x2="280" y2="120" stroke="#e5e7eb" strokeWidth="1" />
                    <line x1="0" y1="160" x2="280" y2="160" stroke="#e5e7eb" strokeWidth="1" />
                    
                    {/* Line path */}
                    <polyline
                      points="0,140 40,130 80,135 120,100 160,40 200,60 240,75"
                      fill="none"
                      stroke="#22c55e"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  
                  {/* Interactive data points with tooltips */}
                  {[
                    { x: 0, y: 140, day: 'Mon', sales: 20100 },
                    { x: 40, y: 130, day: 'Tue', sales: 21200 },
                    { x: 80, y: 135, day: 'Wed', sales: 20800 },
                    { x: 120, y: 100, day: 'Thu', sales: 26500 },
                    { x: 160, y: 40, day: 'Fri', sales: 38400 },
                    { x: 200, y: 60, day: 'Sat', sales: 34200 },
                    { x: 240, y: 75, day: 'Sun', sales: 31600 },
                  ].map((point, i) => (
                    <div
                      key={i}
                      className="absolute group/point"
                      style={{
                        left: `${(point.x / 280) * 100}%`,
                        top: `${(point.y / 160) * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <div className="relative">
                        <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white cursor-pointer hover:scale-150 transition-transform" />
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2 whitespace-nowrap">
                            <p className="text-xs font-semibold text-gray-900">{point.day}</p>
                            <p className="text-xs text-green-600">sales: Br {point.sales.toLocaleString()}</p>
                          </div>
                          <div className="w-2 h-2 bg-white border-r border-b border-gray-200 absolute left-1/2 -translate-x-1/2 -bottom-1 rotate-45" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* X-axis labels */}
                <div className="flex justify-between text-xs text-gray-500 mt-2 ml-8">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle>Peak hours</CardTitle>
              <p className="text-sm text-gray-500">Orders by hour - today</p>
            </CardHeader>
            <CardContent>
              <div className="h-48 flex items-end justify-between gap-1 px-2 relative">
                {[
                  { hour: '10a', orders: 15 },
                  { hour: '11a', orders: 18 },
                  { hour: '12p', orders: 45 },
                  { hour: '1p', orders: 32 },
                  { hour: '2p', orders: 38 },
                  { hour: '3p', orders: 25 },
                  { hour: '4p', orders: 40 },
                  { hour: '5p', orders: 28 },
                  { hour: '6p', orders: 50 },
                  { hour: '7p', orders: 65 },
                  { hour: '8p', orders: 78 },
                  { hour: '9p', orders: 58 },
                ].map((item, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center group/bar relative">
                    <div
                      className="w-full bg-orange-500 rounded-t transition-all hover:bg-orange-600 cursor-pointer relative"
                      style={{ height: `${item.orders * 1.5}px` }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
                          <p className="text-xs font-semibold text-gray-900">{item.hour}</p>
                          <p className="text-xs text-orange-600">{item.orders} orders</p>
                        </div>
                        <div className="w-2 h-2 bg-white border-r border-b border-gray-200 absolute left-1/2 -translate-x-1/2 -bottom-1 rotate-45" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-3 px-2">
                <span>10a</span>
                <span>11a</span>
                <span>12p</span>
                <span>1p</span>
                <span>2p</span>
                <span>3p</span>
                <span>4p</span>
                <span>5p</span>
                <span>6p</span>
                <span>7p</span>
                <span>8p</span>
                <span>9p</span>
              </div>
            </CardContent>
          </Card>

          {/* Operations */}
          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
              <p className="text-sm text-gray-500">Live status</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Table className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Active tables</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">18 / 24</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '75%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <ChefHat className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Kitchen queue</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">6 tickets</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: '40%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Reservations today</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">12</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <UsersIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Staff on shift</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">9 / 12</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row - Recent Orders (2/3) + Low Stock (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent orders</CardTitle>
                  <p className="text-sm text-gray-500">Latest transactions across all channels</p>
                </div>
                <Button variant="ghost" size="sm">Print</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Order</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Customer</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Table</th>
                      <th className="text-left py-3 px-2 text-xs font-semibold text-gray-600">Waiter</th>
                      <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600">Total</th>
                      <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-2 text-sm font-semibold text-gray-900">#{order.id}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{order.customer}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{order.table}</td>
                        <td className="py-3 px-2 text-sm text-gray-700">{order.waiter}</td>
                        <td className="py-3 px-2 text-sm font-semibold text-gray-900 text-right">
                          Br {order.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Low Stock */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Low stock
                  </CardTitle>
                  <p className="text-sm text-gray-500">Below reorder threshold</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-red-600">4</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lowStockItems.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{item.name}</span>
                    <span className="text-sm text-gray-600">
                      {item.current} {item.unit} / {item.threshold} {item.unit}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${(item.current / item.threshold) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full mt-4">
                <Package className="w-4 h-4 mr-2" />
                Create purchase order
              </Button>
            </CardContent>
          </Card>
        </div>
    </div>
  );
}
