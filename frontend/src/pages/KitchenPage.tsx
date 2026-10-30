import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, type Order, OrderStatus } from '../api/orders';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../contexts/WebSocketContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Clock,
  ChefHat,
  CheckCircle,
  Bell,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  Printer,
  AlertTriangle,
  User,
  History,
  CheckCircle2,
  Sparkles,
  Utensils,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const STATUS_COLORS = {
  [OrderStatus.PENDING]: 'bg-rose-50/70 border-rose-300 shadow-rose-100/50',
  [OrderStatus.PREPARING]: 'bg-amber-50/70 border-amber-300 shadow-amber-100/50',
  [OrderStatus.READY]: 'bg-emerald-50/70 border-emerald-300 shadow-emerald-100/50',
};

const STATUS_HEADER_COLORS = {
  [OrderStatus.PENDING]: 'bg-rose-600',
  [OrderStatus.PREPARING]: 'bg-amber-600',
  [OrderStatus.READY]: 'bg-emerald-600',
};

const STATUS_LABELS = {
  [OrderStatus.PENDING]: 'New Orders (Incoming)',
  [OrderStatus.PREPARING]: 'In Prep (Cooking)',
  [OrderStatus.READY]: 'Ready for Pickup (Pass)',
};

export default function KitchenPage() {
  const { user } = useAuthStore();
  const { socket, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'DINE_IN' | 'TAKEAWAY'>('ALL');

  const previousPendingCount = useRef(0);

  // Self-contained high-quality restaurant audio chime
  const playKitchenChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Dual-tone restaurant bell chime (A5 -> E6)
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch (err) {
      console.warn('Audio chime could not be played:', err);
    }
  }, [soundEnabled]);

  // Update clock every 10 seconds for live ticking timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active kitchen orders
  const { data, isLoading } = useQuery({
    queryKey: ['kitchen-orders', user?.branch?.id],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        limit: 150,
      }),
    refetchInterval: 15000, // Background poll every 15s as fallback to WebSocket
    enabled: !!user?.branch?.id,
  });

  // Fetch recent history (SERVED or COMPLETED orders from today)
  const { data: historyData } = useQuery({
    queryKey: ['kitchen-orders-history', user?.branch?.id],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        limit: 15,
      }),
    enabled: isHistoryOpen && !!user?.branch?.id,
  });

  const orders = data?.data || [];
  const historyOrders = (historyData?.data || []).filter(
    (o: Order) => o.status === OrderStatus.SERVED || o.status === OrderStatus.COMPLETED
  );

  // Real-time WebSocket listeners
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (payload: any) => {
      console.log('⚡ Kitchen received real-time order:created:', payload);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      playKitchenChime();
      const tableText = payload.order?.table?.number
        ? `Table ${payload.order.table.number}`
        : payload.order?.type || 'Order';
      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-rose-600 text-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 items-center gap-3`}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase font-extrabold tracking-wider text-rose-100">New Order Alert</p>
              <p className="text-base font-bold text-white">
                #{payload.order?.orderNumber ? payload.order.orderNumber.slice(-8) : 'NEW'} • {tableText}
              </p>
            </div>
          </div>
        ),
        { duration: 5000 }
      );
    };

    const handleStatusUpdated = (payload: any) => {
      console.log('⚡ Kitchen received order:status_updated:', payload);
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders-history'] });
    };

    socket.on('order:created', handleOrderCreated);
    socket.on('order:status_updated', handleStatusUpdated);

    return () => {
      socket.off('order:created', handleOrderCreated);
      socket.off('order:status_updated', handleStatusUpdated);
    };
  }, [socket, queryClient, playKitchenChime]);

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: OrderStatus }) =>
      ordersApi.updateOrderStatus(orderId, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders-history'] });
      if (variables.status === OrderStatus.READY) {
        toast.success('Order marked READY! Waiter notified.');
      } else if (variables.status === OrderStatus.SERVED) {
        toast.success('Order handed over to floor server!');
      } else {
        toast.success('Order status updated');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update order status');
    },
  });

  // Re-notify waiter mutation
  const notifyWaiterMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.notifyWaiter(orderId),
    onSuccess: () => {
      toast.success('🔔 Buzzer sent to server again!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to notify server');
    },
  });

  // Filter active orders
  const activeOrders = orders.filter((order: Order) => {
    const isKitchenStatus =
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.READY;

    if (!isKitchenStatus) return false;
    if (typeFilter === 'DINE_IN') return order.type === 'DINE_IN';
    if (typeFilter === 'TAKEAWAY') return order.type !== 'DINE_IN';
    return true;
  });

  const ordersByStatus = {
    [OrderStatus.PENDING]: activeOrders.filter((o: Order) => o.status === OrderStatus.PENDING),
    [OrderStatus.PREPARING]: activeOrders.filter((o: Order) => o.status === OrderStatus.PREPARING),
    [OrderStatus.READY]: activeOrders.filter((o: Order) => o.status === OrderStatus.READY),
  };

  // Trigger audio on new pending orders count increase
  useEffect(() => {
    const pendingCount = ordersByStatus[OrderStatus.PENDING].length;
    if (pendingCount > previousPendingCount.current && previousPendingCount.current > 0) {
      playKitchenChime();
    }
    previousPendingCount.current = pendingCount;
  }, [ordersByStatus, playKitchenChime]);

  // Elapsed wait time formatting
  const getTimeElapsed = (createdAt: string) => {
    const orderTime = new Date(createdAt);
    const diffMs = currentTime.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return '< 1m';
    if (diffMins < 60) return `${diffMins}m`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getUrgencyConfig = (createdAt: string) => {
    const diffMins = Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 60000);
    if (diffMins >= 25) {
      return {
        badgeClass: 'bg-red-600 text-white animate-pulse font-extrabold',
        borderClass: 'border-red-500 ring-2 ring-red-400/40',
        label: 'URGENT (25m+)',
      };
    }
    if (diffMins >= 15) {
      return {
        badgeClass: 'bg-amber-500 text-white font-bold',
        borderClass: 'border-amber-400',
        label: 'Delayed (15m+)',
      };
    }
    return {
      badgeClass: 'bg-emerald-100 text-emerald-800 font-semibold',
      borderClass: 'border-emerald-300',
      label: 'Normal',
    };
  };

  // Toggle item-level cook strike-through
  const toggleItemCheck = (itemId: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100/90 font-sans select-none">
      {/* Top Header / Kitchen Control Bar */}
      <header className="bg-white border-b border-gray-200 px-6 py-3.5 shadow-xs shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Identity & Live Orders Badge */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-gray-900 tracking-tight">Kitchen Display System</h1>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      isConnected ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'
                    }`}
                  />
                  {isConnected ? 'Live WebSocket' : 'Connecting'}
                </span>
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {user?.branch?.name || 'Main Kitchen'} • {activeOrders.length} active tickets
              </p>
            </div>
          </div>

          {/* Middle: Station / Order Type Filter */}
          <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-bold">
            <button
              onClick={() => setTypeFilter('ALL')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                typeFilter === 'ALL' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Tickets ({orders.filter((o) => ['PENDING', 'PREPARING', 'READY'].includes(o.status)).length})
            </button>
            <button
              onClick={() => setTypeFilter('DINE_IN')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                typeFilter === 'DINE_IN' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              🍽️ Dine-In
            </button>
            <button
              onClick={() => setTypeFilter('TAKEAWAY')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                typeFilter === 'TAKEAWAY' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              📦 Takeout / Delivery
            </button>
          </div>

          {/* Right: Controls, Audio Toggle, Fullscreen & Clock */}
          <div className="flex items-center gap-3">
            {/* Audio Toggle & Test */}
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg p-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`h-8 px-2.5 text-xs font-semibold gap-1.5 ${
                  soundEnabled ? 'text-emerald-700 bg-emerald-50' : 'text-gray-500'
                }`}
                title={soundEnabled ? 'Sound is ON (Click to Mute)' : 'Sound is MUTED (Click to Enable)'}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
                <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={playKitchenChime}
                className="h-8 px-2 text-xs text-gray-600 hover:text-gray-900"
                title="Test Audio Chime"
              >
                <Bell className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Recently Completed / Recall Drawer */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="h-9 px-3 text-xs font-semibold border-gray-300 text-gray-700 hover:bg-gray-100 gap-1.5 shadow-2xs"
            >
              <History className="w-4 h-4 text-gray-500" />
              <span>Recall History</span>
            </Button>

            {/* Fullscreen Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
              className="h-9 w-9 p-0 border-gray-300 text-gray-700 hover:bg-gray-100 shadow-2xs"
              title="Toggle Fullscreen Mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>

            {/* Live Clock */}
            <div className="text-right pl-2 border-l border-gray-200">
              <p className="text-lg font-black text-gray-900 leading-tight">
                {format(currentTime, 'HH:mm:ss')}
              </p>
              <p className="text-[11px] font-semibold text-gray-500">{format(currentTime, 'EEE, MMM d')}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main 3-Column Kanban Board */}
      <div className="flex-1 p-4 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-200 border-t-amber-600 mx-auto mb-4" />
              <p className="text-base font-bold text-gray-700">Connecting to Kitchen Stream...</p>
            </div>
          </div>
        ) : activeOrders.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white p-12 rounded-2xl border border-gray-200 shadow-sm max-w-md">
              <div className="w-20 h-20 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-1">Kitchen All Clear!</h3>
              <p className="text-sm text-gray-500">
                No active tickets in queue. Incoming orders from tables, POS, and waiters will chime here instantly.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-0">
            {[OrderStatus.PENDING, OrderStatus.PREPARING, OrderStatus.READY].map((status) => {
              const columnOrders = ordersByStatus[status as keyof typeof ordersByStatus];

              return (
                <div key={status} className="flex flex-col h-full min-h-0 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Column Header */}
                  <div className={`${STATUS_HEADER_COLORS[status as keyof typeof STATUS_HEADER_COLORS]} px-4 py-3 shrink-0`}>
                    <div className="flex items-center justify-between text-white">
                      <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 opacity-80" />
                        <h2 className="text-sm font-extrabold uppercase tracking-wide">
                          {STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                        </h2>
                      </div>
                      <span className="bg-white/20 text-white font-black text-xs px-2.5 py-0.5 rounded-full border border-white/25">
                        {columnOrders.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards Scrollable Column */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 bg-gray-50/60 divide-y divide-gray-100">
                    {columnOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-xs font-semibold gap-1">
                        <CheckCircle2 className="w-8 h-8 text-gray-300" />
                        <span>No tickets in this station</span>
                      </div>
                    ) : (
                      columnOrders.map((order: Order) => {
                        const urgency = getUrgencyConfig(order.createdAt);
                        const tableText = order.table?.number
                          ? `Table ${order.table.number}`
                          : order.type === 'DINE_IN'
                          ? 'Dine-In'
                          : 'Takeaway';
                        const serverName = order.createdBy
                          ? `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim() || 'Floor Staff'
                          : 'Floor Staff';
                        const items = order.items || [];
                        const checkedCount = items.filter((it: any) => checkedItems[it.id]).length;

                        return (
                          <Card
                            key={order.id}
                            className={`bg-white border-2 rounded-xl p-3.5 shadow-sm transition-all hover:shadow-md ${
                              urgency.borderClass
                            }`}
                          >
                            {/* Ticket Header */}
                            <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-extrabold bg-amber-500 text-white shadow-2xs">
                                    {tableText}
                                  </span>
                                  <span className="text-xs font-bold text-gray-700">
                                    #{order.orderNumber ? order.orderNumber.slice(-8) : order.id.slice(0, 8)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium mt-1">
                                  <User className="w-3.5 h-3.5 text-gray-400" />
                                  <span>Server: <strong className="text-gray-900">{serverName}</strong></span>
                                </div>
                              </div>

                              {/* Elapsed Timer */}
                              <div className="text-right">
                                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${urgency.badgeClass}`}>
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>{getTimeElapsed(order.createdAt)}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                  {items.length} {items.length === 1 ? 'dish' : 'dishes'}
                                </p>
                              </div>
                            </div>

                            {/* Special Instructions Warning Banner */}
                            {(order.specialInstructions || order.notes) && (
                              <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200/80 flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs font-bold text-amber-900 leading-snug">
                                  {order.specialInstructions || order.notes}
                                </div>
                              </div>
                            )}

                            {/* Order Items (Click to Strike-Through as Prepared) */}
                            <div className="space-y-1.5 mb-3.5">
                              {items.map((item: any, idx: number) => {
                                const isChecked = !!checkedItems[item.id];
                                return (
                                  <div
                                    key={item.id || idx}
                                    onClick={() => toggleItemCheck(item.id || String(idx))}
                                    className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between ${
                                      isChecked
                                        ? 'bg-emerald-50/80 border-emerald-200 text-gray-400 line-through'
                                        : 'bg-gray-50/80 border-gray-200/80 text-gray-900 hover:bg-gray-100'
                                    }`}
                                    title="Click to check off dish when prepped"
                                  >
                                    <div className="flex items-start gap-2 flex-1">
                                      <span
                                        className={`inline-block w-5 h-5 rounded-md text-center text-xs font-black leading-5 shrink-0 ${
                                          isChecked
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-gray-900 text-white'
                                        }`}
                                      >
                                        {item.quantity}
                                      </span>
                                      <div>
                                        <div className="font-bold flex items-center gap-1.5">
                                          <span>{item.menuItem?.name || item.name || 'Dish'}</span>
                                          {item.menuItem?.isSpicy && (
                                            <span className="text-[10px] px-1 bg-red-100 text-red-700 font-bold rounded">
                                              🌶️ Spicy
                                            </span>
                                          )}
                                          {item.menuItem?.preparationTime && (
                                            <span className="text-[10px] text-gray-400 font-normal">
                                              ~{item.menuItem.preparationTime}m
                                            </span>
                                          )}
                                        </div>
                                        {item.notes && (
                                          <p className="text-[11px] text-amber-800 italic mt-0.5 font-medium">
                                            Note: {item.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="shrink-0 ml-2">
                                      {isChecked ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <div className="w-4 h-4 rounded border border-gray-300" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Ticket Action Buttons Based on Status */}
                            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                              {/* 1. New Orders Column Action */}
                              {status === OrderStatus.PENDING && (
                                <Button
                                  className="w-full h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-2xs gap-1.5"
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      orderId: order.id,
                                      status: OrderStatus.PREPARING,
                                    })
                                  }
                                  disabled={updateStatusMutation.isPending}
                                >
                                  <ChefHat className="w-4 h-4" />
                                  <span>Start Cooking</span>
                                </Button>
                              )}

                              {/* 2. Preparing Column Actions */}
                              {status === OrderStatus.PREPARING && (
                                <>
                                  <Button
                                    className="flex-1 h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        orderId: order.id,
                                        status: OrderStatus.READY,
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Food Ready! (Notify Server)</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPrintOrder(order)}
                                    className="h-9 px-2.5 text-xs text-gray-700 border-gray-300 hover:bg-gray-100"
                                    title="Print Kitchen Ticket Chit"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}

                              {/* 3. Ready Column Actions (Clearable, Re-Ring, Recall) */}
                              {status === OrderStatus.READY && (
                                <>
                                  {/* Mark Handed Over / Served: Clears the ticket! */}
                                  <Button
                                    className="flex-1 h-9 text-xs font-extrabold bg-green-700 hover:bg-green-800 text-white shadow-2xs gap-1.5"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        orderId: order.id,
                                        status: OrderStatus.SERVED,
                                      })
                                    }
                                    disabled={updateStatusMutation.isPending}
                                    title="Food picked up by server: Clear ticket from screen"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span>Handed Over (Clear)</span>
                                  </Button>

                                  {/* Re-ring waiter */}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => notifyWaiterMutation.mutate(order.id)}
                                    disabled={notifyWaiterMutation.isPending}
                                    className="h-9 px-2.5 text-xs font-bold text-amber-700 border-amber-300 hover:bg-amber-50 gap-1"
                                    title="Re-ring Server buzzer"
                                  >
                                    <Bell className="w-3.5 h-3.5 text-amber-600" />
                                    <span>Ring</span>
                                  </Button>

                                  {/* Recall back to preparing */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        orderId: order.id,
                                        status: OrderStatus.PREPARING,
                                      })
                                    }
                                    className="h-9 px-2 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                    title="Recall back to Cooking"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recall / History Drawer Modal */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <History className="w-5 h-5 text-gray-700" />
              <span>Recently Handed Over / Cleared Tickets</span>
            </DialogTitle>
            <DialogDescription>
              Review the last cleared tickets or recall an accidentally dismissed order back to the active board.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            {historyOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No recently completed orders found today
              </div>
            ) : (
              historyOrders.map((histOrder: Order) => (
                <div
                  key={histOrder.id}
                  className="p-3 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded">
                        {histOrder.table?.number ? `Table ${histOrder.table.number}` : histOrder.type}
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        #{histOrder.orderNumber ? histOrder.orderNumber.slice(-8) : histOrder.id.slice(0, 8)}
                      </span>
                      <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        {histOrder.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(histOrder.items || []).map((it: any) => `${it.quantity}x ${it.menuItem?.name || 'Dish'}`).join(', ')}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateStatusMutation.mutate({
                        orderId: histOrder.id,
                        status: OrderStatus.PREPARING,
                      });
                      setIsHistoryOpen(false);
                    }}
                    className="h-8 text-xs font-semibold text-amber-700 border-amber-300 hover:bg-amber-50 gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Recall to Kitchen</span>
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Kitchen Ticket Slip Print Modal */}
      <Dialog open={!!printOrder} onOpenChange={(open) => !open && setPrintOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900">
              Kitchen Order Ticket (KOT)
            </DialogTitle>
          </DialogHeader>

          {printOrder && (
            <div className="border p-4 rounded-lg bg-white font-mono text-xs space-y-3">
              <div className="text-center border-b pb-2">
                <h3 className="font-bold text-sm uppercase">KITCHEN ORDER TICKET</h3>
                <p className="text-gray-500">{user?.branch?.name || 'Main Branch'}</p>
                <p className="text-gray-400 mt-0.5">{format(new Date(printOrder.createdAt), 'MMM dd, yyyy HH:mm:ss')}</p>
              </div>

              <div className="flex justify-between border-b pb-2 font-bold text-sm">
                <span>
                  {printOrder.table?.number ? `TABLE: ${printOrder.table.number}` : printOrder.type}
                </span>
                <span>#{printOrder.orderNumber ? printOrder.orderNumber.slice(-8) : ''}</span>
              </div>

              <div className="space-y-1.5 py-1">
                {(printOrder.items || []).map((it: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <span className="font-bold">{it.quantity}x {it.menuItem?.name || it.name}</span>
                    {it.notes && <span className="text-[10px] text-gray-500 italic block">({it.notes})</span>}
                  </div>
                ))}
              </div>

              {printOrder.specialInstructions && (
                <div className="border-t pt-2 font-bold text-red-600">
                  SPECIAL: {printOrder.specialInstructions}
                </div>
              )}

              <div className="pt-3 border-t flex gap-2">
                <Button
                  className="w-full bg-gray-900 text-white font-bold"
                  onClick={() => window.print()}
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  Print Physical Chit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
