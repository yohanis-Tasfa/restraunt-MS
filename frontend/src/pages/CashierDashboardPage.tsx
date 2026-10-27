import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  DollarSign,
  ShoppingBag,
  CreditCard,
  Clock,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { billRequestsApi } from '../api/billRequests';
import { useBillRequestNotifications } from '../hooks/useBillRequestNotifications';

export default function CashierDashboardPage() {
  const navigate = useNavigate();

  // Listen for real-time bill requests from waiters
  useBillRequestNotifications();

  // Query pending bill requests count
  const { data: pendingCountData } = useQuery({
    queryKey: ['bill-requests', 'pending-count'],
    queryFn: () => billRequestsApi.getPendingCount(),
    refetchInterval: 5000,
  });

  const pendingBillsCount = pendingCountData?.count || 0;
  // Mock data - replace with real API data filtered for cashier's own transactions
  const stats = {
    todaySales: 12400.0,
    salesChange: 8.2,
    ordersToday: 42,
    ordersChange: 5.3,
    paymentsProcessed: 38,
    averageOrderValue: 295.24,
  };

  const recentOrders = [
    { id: '10248', customer: 'Abenezer T.', table: 'T-04', total: 620.0, status: 'Paid', time: '2m ago' },
    { id: '10247', customer: 'Hana G.', table: 'T-11', total: 1240.0, status: 'Pending', time: '5m ago' },
    { id: '10246', customer: 'Walk-in', table: 'T-02', total: 320.0, status: 'Paid', time: '8m ago' },
    { id: '10245', customer: 'Meron A.', table: 'T-08', total: 890.0, status: 'Paid', time: '12m ago' },
    { id: '10244', customer: 'Dawit L.', table: 'T-05', total: 1580.0, status: 'Pending', time: '15m ago' },
  ];

  const paymentMethods = [
    { method: 'Cash', count: 18, percentage: 47, color: 'bg-green-500' },
    { method: 'Card', count: 12, percentage: 32, color: 'bg-blue-500' },
    { method: 'Mobile', count: 8, percentage: 21, color: 'bg-purple-500' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-700';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700';
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
        <h1 className="text-2xl font-bold text-gray-900">Cashier Dashboard</h1>
        <p className="text-gray-500">Track your transactions and performance</p>
      </div>

      {/* Stats Cards - Cashier specific */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Sales (My Transactions) */}
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
            <p className="text-sm text-gray-500">My sales today</p>
          </CardContent>
        </Card>

        {/* Orders Processed */}
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
            <p className="text-sm text-gray-500">Orders processed</p>
          </CardContent>
        </Card>

        {/* Payments Processed */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.paymentsProcessed}</h3>
            <p className="text-sm text-gray-500">Payments processed</p>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Br {stats.averageOrderValue.toFixed(2)}</h3>
            <p className="text-sm text-gray-500">Avg order value</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Recent Transactions</CardTitle>
                <p className="text-sm text-gray-500">Orders you processed today</p>
              </div>
              <Button 
                size="sm"
                onClick={() => window.location.href = '/admin/pos'}
                className="bg-green-600 hover:bg-green-700"
              >
                Open POS
              </Button>
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
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600">Total</th>
                    <th className="text-center py-3 px-2 text-xs font-semibold text-gray-600">Status</th>
                    <th className="text-right py-3 px-2 text-xs font-semibold text-gray-600">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-2 text-sm font-semibold text-gray-900">#{order.id}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">{order.customer}</td>
                      <td className="py-3 px-2 text-sm text-gray-700">{order.table}</td>
                      <td className="py-3 px-2 text-sm font-semibold text-gray-900 text-right">
                        Br {order.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-500 text-right">{order.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <p className="text-sm text-gray-500">Breakdown by type today</p>
          </CardHeader>
          <CardContent>
            {/* Donut Chart */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Cash - 47% - Green */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="20"
                    strokeDasharray={`${47 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset="0"
                  />
                  {/* Card - 32% - Blue */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="20"
                    strokeDasharray={`${32 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${47 * 2.51}`}
                  />
                  {/* Mobile - 21% - Purple */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#a855f7"
                    strokeWidth="20"
                    strokeDasharray={`${21 * 2.51} ${100 * 2.51}`}
                    strokeDashoffset={`-${(47 + 32) * 2.51}`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">{stats.paymentsProcessed}</p>
                    <p className="text-xs text-gray-500">Total</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="space-y-3">
              {paymentMethods.map((method, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${method.color}`} />
                    <span className="text-sm text-gray-700">{method.method}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-gray-900">{method.count}</span>
                    <span className="text-sm text-gray-500 ml-1">({method.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <p className="text-sm text-gray-500">Common cashier billing & checkout tasks</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2 relative bg-blue-50/50 border-blue-200 hover:bg-blue-100/50"
              onClick={() => navigate('/admin/bill-requests')}
            >
              <div className="relative">
                <FileText className="w-6 h-6 text-blue-600" />
                {pendingBillsCount > 0 && (
                  <span className="absolute -top-1 -right-2 px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
                    {pendingBillsCount}
                  </span>
                )}
              </div>
              <span className="text-sm font-medium text-blue-900">Bill Requests Queue</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin/pos')}
            >
              <DollarSign className="w-6 h-6" />
              <span className="text-sm">POS Register</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin/orders')}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="text-sm">View Orders</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin/profile')}
            >
              <Clock className="w-6 h-6" />
              <span className="text-sm">My Profile</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
