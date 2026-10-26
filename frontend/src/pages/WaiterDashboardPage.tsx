import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Bell,
  ShoppingBag,
  Users,
  Clock,
  ChefHat,
  CheckCircle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useActiveCalls } from '../hooks/useWaiterCalls';
import { useBillRequestNotifications } from '../hooks/useBillRequestNotifications';
import { useNavigate } from 'react-router-dom';

export default function WaiterDashboardPage() {
  const navigate = useNavigate();
  const { calls } = useActiveCalls(false);

  // Enable real-time bill request notifications
  useBillRequestNotifications();

  // Mock data - replace with real API data filtered for waiter's assigned tables/orders
  const stats = {
    myTables: 5,
    activeOrders: 8,
    pendingCalls: calls.length,
    completedToday: 24,
  };

  const myActiveTables = [
    { number: 'T10', status: 'Occupied', guests: 4, orderStatus: 'Preparing', timeElapsed: '15m' },
    { number: 'T04', status: 'Occupied', guests: 2, orderStatus: 'Ready', timeElapsed: '25m' },
    { number: 'T11', status: 'Occupied', guests: 6, orderStatus: 'Served', timeElapsed: '45m' },
    { number: 'T08', status: 'Occupied', guests: 3, orderStatus: 'Pending', timeElapsed: '5m' },
    { number: 'T05', status: 'Occupied', guests: 2, orderStatus: 'Ready', timeElapsed: '30m' },
  ];

  const recentOrders = [
    { id: '10248', table: 'T-04', items: 3, status: 'Ready', total: 620.0, time: '2m ago' },
    { id: '10247', table: 'T-11', items: 5, status: 'Preparing', total: 1240.0, time: '5m ago' },
    { id: '10246', table: 'T-10', items: 2, status: 'Served', total: 320.0, time: '8m ago' },
  ];

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'Ready':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'Preparing':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'Served':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Waiter Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here's your service overview</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* My Tables */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.myTables}</h3>
            <p className="text-sm text-gray-500">My Active Tables</p>
          </CardContent>
        </Card>

        {/* Active Orders */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.activeOrders}</h3>
            <p className="text-sm text-gray-500">Active Orders</p>
          </CardContent>
        </Card>

        {/* Pending Calls */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Bell className="w-5 h-5 text-red-600" />
              </div>
              {stats.pendingCalls > 0 && (
                <span className="text-sm font-semibold text-red-600 flex items-center gap-1 animate-pulse">
                  <AlertCircle className="w-4 h-4" />
                  Urgent
                </span>
              )}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingCalls}</h3>
            <p className="text-sm text-gray-500">Pending Calls</p>
          </CardContent>
        </Card>

        {/* Completed Today */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +8
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.completedToday}</h3>
            <p className="text-sm text-gray-500">Completed Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* My Active Tables - Takes 2 columns */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Active Tables</CardTitle>
                <p className="text-sm text-gray-500">Tables currently under your service</p>
              </div>
              <Button 
                size="sm"
                onClick={() => navigate('/admin/tables')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View All Tables
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myActiveTables.map((table) => (
                <div
                  key={table.number}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/tables')}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <span className="font-bold text-blue-700">{table.number}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Table {table.number}</p>
                      <p className="text-sm text-gray-600">{table.guests} guests • {table.timeElapsed}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getOrderStatusColor(table.orderStatus)} font-normal text-xs mb-1`}>
                      {table.orderStatus}
                    </Badge>
                    {table.orderStatus === 'Ready' && (
                      <p className="text-xs text-green-600 font-medium">Ready to serve!</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <p className="text-sm text-gray-500">Your latest orders</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate('/admin/orders')}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-gray-900">#{order.id}</span>
                    <Badge className={`${getOrderStatusColor(order.status)} font-normal text-xs`}>
                      {order.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{order.table} • {order.items} items</span>
                    <span className="font-medium text-gray-900">Br {order.total.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{order.time}</p>
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
          <p className="text-sm text-gray-500">Common waiter tasks</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin/pos')}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="text-sm">New Order</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin/tables')}
            >
              <Users className="w-6 h-6" />
              <span className="text-sm">Manage Tables</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin/waiter-calls')}
            >
              <Bell className="w-6 h-6" />
              <span className="text-sm">View Calls</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex flex-col items-center justify-center gap-2"
              onClick={() => navigate('/admin/kitchen')}
            >
              <ChefHat className="w-6 h-6" />
              <span className="text-sm">Kitchen Status</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
