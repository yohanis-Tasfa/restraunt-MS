import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, type Order, OrderStatus } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Clock, ChefHat, CheckCircle, Bell } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-red-50 border-red-300',
  [OrderStatus.PREPARING]: 'bg-orange-50 border-orange-300',
  [OrderStatus.COMPLETED]: 'bg-green-50 border-green-300',
};

const STATUS_HEADER_COLORS = {
  [OrderStatus.PENDING]: 'bg-red-500',
  [OrderStatus.PREPARING]: 'bg-orange-500',
  [OrderStatus.COMPLETED]: 'bg-green-500',
};

const STATUS_LABELS = {
  [OrderStatus.PENDING]: 'New Orders',
  [OrderStatus.PREPARING]: 'Preparing',
  [OrderStatus.COMPLETED]: 'Ready',
};

const NEXT_STATUS = {
  [OrderStatus.PENDING]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.COMPLETED,
};

const ACTION_LABELS = {
  [OrderStatus.PENDING]: 'Start Preparing',
  [OrderStatus.PREPARING]: 'Mark as Ready',
};

export default function KitchenPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());
  const previousOrderCount = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio for notifications
  useEffect(() => {
    // Create a simple beep sound using Web Audio API
    audioRef.current = new Audio(
      'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eaeTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkUAKFF606+uoVRQKRp/g8r5sIQUrgc7y2Yk2CBlouu3mnkwQDFCn4/C2YhwGOJLX8sx5LAUkd8fw3ZFAChRet+vrqFUUCkaf4PK+bCEFK4HO8tmJNggZaLrt5p5MEAxQp+PwtmIcBjiS1/LMeSwFJHfH8N2RQAoUXrfr66hVFApGn+DyvmwhBSuBzvLZiTYIGWi67eaeTBAMUKfj8LZiHAY4ktfyzHksBSR3x/DdkUAKFF636+uoVRQKRp/g8r5sIQUrgc7y2Yk2CBlouu3mnkwQDFCn4/C2YhwGOJLX8sx5LAUkd8fw3ZFAChRet+vrqFUUCkaf4PK+bCEFK4HO8tmJNggZaLrt5p5MEAxQp+PwtmIcBjiS1/LMeSwFJHfH8N2RQAoUXrfr66hVFApGn+DyvmwhBSuBzvLZiTYIGWi67eaeTBAMUKfj8LZiHAY4ktfyzHksBSR3x/DdkUAKFF636+uoVRQKRp/g8r5sIQU='
    );
  }, []);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active orders
  const { data, isLoading } = useQuery({
    queryKey: ['kitchen-orders', user?.branch?.id],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        limit: 100,
      }),
    refetchInterval: 30000, // Refetch every 30 seconds
    enabled: !!user?.branch?.id,
  });

  const orders = data?.data || [];

  // Play sound when new order arrives
  useEffect(() => {
    if (orders.length > previousOrderCount.current && previousOrderCount.current > 0) {
      // New order detected
      if (audioRef.current) {
        audioRef.current.play().catch(() => {
          // Ignore errors if audio play is blocked
        });
      }
      toast('🔔 New order received!', {
        duration: 3000,
        style: {
          background: '#FEE2E2',
          color: '#991B1B',
          fontWeight: 'bold',
        },
      });
    }
    previousOrderCount.current = orders.length;
  }, [orders.length]);

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

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getTimeColor = (createdAt: string) => {
    const diffMins = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000);
    if (diffMins > 30) return 'text-red-600 font-bold';
    if (diffMins > 15) return 'text-orange-600 font-semibold';
    return 'text-gray-600';
  };

  // Filter orders by status (only show active kitchen orders)
  const activeOrders = orders.filter(
    (order: Order) =>
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.COMPLETED
  );

  const ordersByStatus = {
    [OrderStatus.PENDING]: activeOrders.filter((o: Order) => o.status === OrderStatus.PENDING),
    [OrderStatus.PREPARING]: activeOrders.filter((o: Order) => o.status === OrderStatus.PREPARING),
    [OrderStatus.COMPLETED]: activeOrders.filter((o: Order) => o.status === OrderStatus.COMPLETED),
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kitchen Display</h1>
              <p className="text-sm text-gray-500">
                {user?.branch?.name} • {activeOrders.length} active{' '}
                {activeOrders.length === 1 ? 'order' : 'orders'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Current Time */}
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {format(currentTime, 'HH:mm')}
              </p>
              <p className="text-sm text-gray-500">{format(currentTime, 'EEE, MMM d')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Order Columns */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Loading orders...</p>
            </div>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
                <ChefHat className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">All Clear!</h3>
              <p className="text-lg text-gray-500">No active orders • New orders will appear here</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 min-h-full">
            {[
              OrderStatus.PENDING,
              OrderStatus.PREPARING,
              OrderStatus.COMPLETED,
            ].map((status) => (
              <div key={status} className="flex flex-col min-h-0">
                {/* Column Header */}
                <div className={`${STATUS_HEADER_COLORS[status as keyof typeof STATUS_HEADER_COLORS]} rounded-t-lg px-4 py-3 shadow`}>
                  <div className="flex items-center justify-between text-white">
                    <h2 className="text-lg font-bold">
                      {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                    </h2>
                    <Badge className="bg-white/20 text-white border-white/30 font-bold text-base px-3 py-1">
                      {ordersByStatus[status as keyof typeof ordersByStatus].length}
                    </Badge>
                  </div>
                </div>

                {/* Order Cards Container */}
                <div className="flex-1 overflow-y-auto bg-white rounded-b-lg shadow p-3 space-y-3 min-h-0">
                  {ordersByStatus[status as keyof typeof ordersByStatus].length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
                      No orders
                    </div>
                  ) : (
                    ordersByStatus[status as keyof typeof ordersByStatus].map((order: Order) => (
                      <Card
                        key={order.id}
                        className={`${
                          STATUS_COLORS[status as keyof typeof STATUS_COLORS]
                        } border-2 p-4 shadow-md hover:shadow-lg transition-shadow`}
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-3 pb-2 border-b border-gray-200">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">
                              #{order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">
                              {order.table
                                ? `Table ${order.table.number}`
                                : order.type.replace('_', ' ')}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 text-sm font-semibold ${getTimeColor(
                              order.createdAt
                            )}`}
                          >
                            <Clock className="w-4 h-4" />
                            {getTimeSinceOrder(order.createdAt)}
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="space-y-2 mb-4">
                          {(order.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="bg-white rounded p-2 border border-gray-200">
                              <div className="flex items-start justify-between">
                                <span className="font-semibold text-gray-900">
                                  <span className="inline-block w-6 h-6 rounded-full bg-gray-200 text-center text-sm leading-6 mr-2">
                                    {item.quantity}
                                  </span>
                                  {item.menuItem?.name || 'Item'}
                                </span>
                              </div>
                              {item.notes && (
                                <p className="text-xs text-gray-600 italic mt-1 ml-8">
                                  Note: {item.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Special Instructions */}
                        {order.specialInstructions && (
                          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                            <p className="text-xs font-semibold text-yellow-800">
                              ⚠️ {order.specialInstructions}
                            </p>
                          </div>
                        )}

                        {/* Action Button */}
                        {status !== OrderStatus.COMPLETED ? (
                          <Button
                            className="w-full font-semibold"
                            size="lg"
                            onClick={() => handleUpdateStatus(order)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {ACTION_LABELS[status as keyof typeof ACTION_LABELS]}
                          </Button>
                        ) : (
                          <div className="w-full py-3 text-center text-base font-bold text-green-700 bg-green-100 rounded-lg border-2 border-green-300">
                            ✓ Ready - Call Waiter
                          </div>
                        )}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
