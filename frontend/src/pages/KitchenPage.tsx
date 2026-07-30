import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, type Order, OrderStatus } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, ChefHat, CheckCircle, ArrowRight, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-800 border-blue-200',
  [OrderStatus.PREPARING]: 'bg-orange-100 text-orange-800 border-orange-200',
  [OrderStatus.READY]: 'bg-green-100 text-green-800 border-green-200',
  [OrderStatus.SERVED]: 'bg-gray-100 text-gray-800 border-gray-200',
};

const STATUS_LABELS = {
  [OrderStatus.PENDING]: 'New Order',
  [OrderStatus.CONFIRMED]: 'Confirmed',
  [OrderStatus.PREPARING]: 'Preparing',
  [OrderStatus.READY]: 'Ready',
  [OrderStatus.SERVED]: 'Served',
};

const NEXT_STATUS = {
  [OrderStatus.PENDING]: OrderStatus.CONFIRMED,
  [OrderStatus.CONFIRMED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY,
  [OrderStatus.READY]: OrderStatus.SERVED,
};

export default function KitchenPage() {
  const { user, logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['kitchen-orders', user?.branch?.id],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
      }),
    refetchInterval: 10000, // Refetch every 10 seconds
    enabled: !!user?.branch?.id,
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast.success('Order status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleUpdateStatus = (order: Order) => {
    const nextStatus = NEXT_STATUS[order.status as keyof typeof NEXT_STATUS];
    if (nextStatus) {
      updateStatusMutation.mutate({ orderId: order.id, status: nextStatus });
    }
  };

  const getTimeSinceOrder = (createdAt: string) => {
    const orderTime = new Date(createdAt);
    const diffMs = currentTime.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m ago`;
  };

  // Filter orders by status
  const activeOrders = orders.filter(
    (order: Order) =>
      order.status !== OrderStatus.SERVED &&
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.CANCELLED
  );

  const ordersByStatus = {
    [OrderStatus.PENDING]: activeOrders.filter((o: Order) => o.status === OrderStatus.PENDING),
    [OrderStatus.CONFIRMED]: activeOrders.filter((o: Order) => o.status === OrderStatus.CONFIRMED),
    [OrderStatus.PREPARING]: activeOrders.filter((o: Order) => o.status === OrderStatus.PREPARING),
    [OrderStatus.READY]: activeOrders.filter((o: Order) => o.status === OrderStatus.READY),
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-600 to-orange-700 flex items-center justify-center text-white shadow">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Kitchen Display System</h1>
              <p className="text-sm text-gray-500">
                {user?.branch?.name} • {activeOrders.length} active orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {currentTime.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-xs text-gray-500">
                {currentTime.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Order Columns */}
      <div className="flex-1 overflow-hidden p-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Orders</h3>
              <p className="text-gray-500">New orders will appear here automatically</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6 h-full">
            {[
              OrderStatus.PENDING,
              OrderStatus.CONFIRMED,
              OrderStatus.PREPARING,
              OrderStatus.READY,
            ].map((status) => (
              <div key={status} className="flex flex-col">
                {/* Column Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                    </h2>
                    <Badge variant="secondary">
                      {ordersByStatus[status as keyof typeof ordersByStatus].length}
                    </Badge>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        status === OrderStatus.PENDING
                          ? 'bg-yellow-500'
                          : status === OrderStatus.CONFIRMED
                          ? 'bg-blue-500'
                          : status === OrderStatus.PREPARING
                          ? 'bg-orange-500'
                          : 'bg-green-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Order Cards */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {ordersByStatus[status as keyof typeof ordersByStatus].map((order: Order) => (
                    <Card
                      key={order.id}
                      className={`p-4 ${
                        STATUS_COLORS[status as keyof typeof STATUS_COLORS]
                      } border-2`}
                    >
                      {/* Order Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold">#{order.orderNumber}</h3>
                          <p className="text-xs opacity-75">
                            {order.table ? `Table ${order.table.tableNumber}` : order.type}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold">
                          <Clock className="w-3 h-3" />
                          {getTimeSinceOrder(order.createdAt)}
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2 mb-4">
                        {order.items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="font-medium">
                              {item.quantity}x {item.menuItem?.name || 'Item'}
                            </span>
                            {item.specialInstructions && (
                              <span className="text-xs italic opacity-75">
                                {item.specialInstructions}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      {status !== OrderStatus.READY && (
                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => handleUpdateStatus(order)}
                          disabled={updateStatusMutation.isPending}
                        >
                          {status === OrderStatus.PENDING && (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Confirm Order
                            </>
                          )}
                          {status === OrderStatus.CONFIRMED && (
                            <>
                              <ChefHat className="w-4 h-4" />
                              Start Preparing
                            </>
                          )}
                          {status === OrderStatus.PREPARING && (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Mark as Ready
                            </>
                          )}
                        </Button>
                      )}
                      {status === OrderStatus.READY && (
                        <div className="w-full py-2 text-center text-sm font-semibold text-green-700 bg-green-50 rounded-md">
                          Ready for Pickup
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
