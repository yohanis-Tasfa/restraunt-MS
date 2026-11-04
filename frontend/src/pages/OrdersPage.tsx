import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, OrderStatus, OrderType, type Order } from '../api/orders';
import { billRequestsApi } from '../api/billRequests';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { useBillRequestNotifications } from '../hooks/useBillRequestNotifications';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Search,
  Eye,
  MoreVertical,
  X,
  Clock,
  ShoppingBag,
  ChefHat,
  CheckCircle,
  DollarSign,
  CreditCard,
  FileText,
  Printer,
  Receipt,
  Calendar,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import PaymentDialog from '../components/orders/PaymentDialog';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userRole = user?.role?.name;
  const isWaiter = userRole === 'Waiter';
  const isCashier = userRole === 'Cashier';
  const isManagerOrOwner = ['Owner', 'Manager'].includes(userRole || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [orderToPrint, setOrderToPrint] = useState<{ order: Order; type: 'BILL' | 'RECEIPT' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

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

  const handlePresetChange = (preset: 'all' | 'today' | 'week' | 'month') => {
    setDateFilter(preset);
    setSelectedDate('');
    setPage(1);
  };

  const handleDateSelect = (dateStr: string) => {
    setSelectedDate(dateStr);
    if (dateStr) {
      setDateFilter('custom');
    } else {
      setDateFilter('all');
    }
    setPage(1);
  };

  const handleClearDate = () => {
    setSelectedDate('');
    setDateFilter('all');
    setPage(1);
  };

  const { resolveOrderNotifications, markOrderAsRead, syncOrdersStatus } = useNotificationStore();

  // Enable real-time bill request notifications
  useBillRequestNotifications();

  // Fetch bill requests to check status for orders
  const { data: billRequestsData } = useQuery({
    queryKey: ['bill-requests'],
    queryFn: () => billRequestsApi.getAll({ page: 1, limit: 100 }),
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const billRequests = billRequestsData?.data || [];

  // Helper to get bill request for an order
  const getBillRequestForOrder = (orderId: string) => {
    return billRequests.find(
      (br: any) =>
        br.orderId === orderId && ['PENDING', 'PROCESSING', 'COMPLETED'].includes(br.status)
    );
  };

  const handleProcessPayment = (order: Order) => {
    setSelectedOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handleOpenPrintSlip = async (order: Order, type: 'BILL' | 'RECEIPT') => {
    try {
      if (!order.items || order.items.length === 0) {
        const fullOrder = await ordersApi.getOrder(order.id);
        setOrderToPrint({ order: fullOrder, type });
      } else {
        setOrderToPrint({ order, type });
      }
    } catch {
      setOrderToPrint({ order, type });
    }
  };

  // Fetch orders (Waiters are strictly locked to their own orders at their assigned branch)
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', user?.branch?.id, page, isWaiter ? 'my' : 'all', dateParams.startDate, dateParams.endDate],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        waiterId: isWaiter ? user?.id : undefined,
        page,
        limit,
        startDate: dateParams.startDate,
        endDate: dateParams.endDate,
      }),
    enabled: !!user?.branch?.id,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination || null;

  // Auto-sync any existing order notifications with current orders status
  useEffect(() => {
    if (orders && orders.length > 0) {
      syncOrdersStatus(orders);
    }
  }, [orders, syncOrdersStatus]);

  // Filter orders by date range (client safety check in sync with server parameters)
  const dateScopedOrders = useMemo(() => {
    return (orders || []).filter((order: Order) => {
      if (dateFilter === 'all') return true;
      if (!order.createdAt) return true;
      const orderDate = new Date(order.createdAt).getTime();
      if (dateParams.startDate && orderDate < new Date(dateParams.startDate).getTime()) return false;
      if (dateParams.endDate && orderDate > new Date(dateParams.endDate).getTime()) return false;
      return true;
    });
  }, [orders, dateFilter, dateParams]);

  // Filter orders by search term, status, payment status, and waiter scope (client-side safety check)
  const filteredOrders = dateScopedOrders.filter((order: Order) => {
    const matchesWaiterScope =
      !isWaiter ||
      order.createdById === user?.id ||
      order.table?.assignedWaiterId === user?.id ||
      order.table?.assignedWaiter?.id === user?.id;

    // Search filter
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && order.status === OrderStatus.PENDING) ||
      (statusFilter === 'ready' && order.status === OrderStatus.READY) ||
      (statusFilter === 'bill_requested' && !!getBillRequestForOrder(order.id));

    // Payment filter
    const matchesPayment =
      paymentFilter === 'all' ||
      (paymentFilter === 'unpaid' && order.paymentStatus === 'UNPAID') ||
      (paymentFilter === 'paid' && order.paymentStatus === 'PAID');

    return matchesWaiterScope && matchesSearch && matchesStatus && matchesPayment;
  });

  // Sort orders by date (newest first)
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      ordersApi.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancelOrder(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      resolveOrderNotifications(id, { newStatus: 'CANCELLED' });
      toast.success('Order cancelled');
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });

  // Request bill mutation
  const requestBillMutation = useMutation({
    mutationFn: ({ orderId, tableId, notes }: { orderId: string; tableId?: string; notes?: string }) =>
      billRequestsApi.create({ orderId, tableId, notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
      toast.success('Bill request sent to cashier');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request bill');
    },
  });

  // Mark order as SERVED mutation (when waiter delivers food to customer)
  const markAsServedMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.updateOrderStatus(orderId, OrderStatus.SERVED),
    onSuccess: (_data, orderId) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      // Instantly mark notification as SERVED & decrease unread badge counter
      resolveOrderNotifications(orderId, { newStatus: 'SERVED' });
      toast.success('Order marked as served!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleViewDetails = async (order: Order) => {
    try {
      // Mark notification as read when waiter inspects order
      markOrderAsRead(order.id);
      // Fetch full order details with all items
      const fullOrder = await ordersApi.getOrder(order.id);
      setSelectedOrder(fullOrder);
      setIsDetailsModalOpen(true);
    } catch (error: any) {
      toast.error('Failed to load order details');
      console.error('Error loading order:', error);
    }
  };

  const handleStatusChange = (orderId: string, status: OrderStatus) => {
    if (['SERVED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      resolveOrderNotifications(orderId, { newStatus: status });
    }
    updateStatusMutation.mutate({ id: orderId, status });
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleRequestBill = (order: Order) => {
    if (window.confirm('Request bill for this order?')) {
      requestBillMutation.mutate({
        orderId: order.id,
        tableId: order.tableId,
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-700';
      case OrderStatus.PREPARING:
        return 'bg-purple-100 text-purple-700';
      case OrderStatus.READY:
        return 'bg-green-100 text-green-700';
      case OrderStatus.SERVED:
        return 'bg-teal-100 text-teal-700';
      case OrderStatus.COMPLETED:
        return 'bg-green-100 text-green-700';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700';
      case 'UNPAID':
        return 'bg-red-100 text-red-700';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Statistics
  const stats = {
    total: dateScopedOrders.length,
    pending: dateScopedOrders.filter((o: Order) => o.status === OrderStatus.PENDING).length,
    ready: dateScopedOrders.filter((o: Order) => o.status === OrderStatus.READY).length,
    cancelled: dateScopedOrders.filter((o: Order) => o.status === OrderStatus.CANCELLED).length,
    completed: dateScopedOrders.filter((o: Order) => o.status === OrderStatus.COMPLETED).length,
    unpaid: dateScopedOrders.filter((o: Order) => o.paymentStatus === 'UNPAID').length,
    paid: dateScopedOrders.filter((o: Order) => o.paymentStatus === 'PAID').length,
    totalRevenue: dateScopedOrders.reduce((sum: number, o: Order) => sum + (o.total || 0), 0),
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-12 bg-gray-200 rounded" />
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track all orders</p>
        </div>

        {/* Date Filters & Date Picker (Top Right above KPI cards) */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Quick preset pills */}
          <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-[#071a12] p-1 border border-gray-200 dark:border-[#143225]">
            <button
              type="button"
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                dateFilter === 'all'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
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
              className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                dateFilter === 'month'
                  ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
              }`}
            >
              This Month
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

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4 border-gray-200 dark:border-[#143225] dark:bg-[#091a13]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-[#143225] dark:bg-[#091a13]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-[#143225] dark:bg-[#091a13]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unpaid</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.unpaid}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-[#143225] dark:bg-[#091a13]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-green-600 dark:text-[#00e676] mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-[#0c2219] flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-[#00e676]" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-gray-200 dark:border-[#143225] dark:bg-[#091a13]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold text-green-600 dark:text-[#00e676] mt-1">
                Br {stats.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-[#0c2219] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-[#00e676]" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === 'all' && paymentFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setPaymentFilter('all');
            }}
            className={
              statusFilter === 'all' && paymentFilter === 'all'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                : 'bg-white dark:bg-[#0c2219] text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#12281d]'
            }
          >
            All Orders ({stats.total})
          </Button>

          {isCashier && (
            <Button
              variant={statusFilter === 'bill_requested' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setStatusFilter('bill_requested');
                setPaymentFilter('all');
              }}
              className={
                statusFilter === 'bill_requested'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold'
                  : 'bg-white dark:bg-[#0c2219] text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#12281d]'
              }
            >
              <FileText className="w-4 h-4 mr-1.5" />
              Bill Requested ({billRequests.filter((b: any) => b.status === 'PENDING').length})
            </Button>
          )}

          {!isCashier && (
            <>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter('pending');
                  setPaymentFilter('all');
                }}
                className={
                  statusFilter === 'pending'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-white dark:bg-[#0c2219] text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#12281d]'
                }
              >
                Pending ({stats.pending})
              </Button>
              <Button
                variant={statusFilter === 'ready' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setStatusFilter('ready');
                  setPaymentFilter('all');
                }}
                className={
                  statusFilter === 'ready'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-white dark:bg-[#0c2219] text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#12281d]'
                }
              >
                🍽️ Ready ({stats.ready})
              </Button>
            </>
          )}

          <Button
            variant={paymentFilter === 'unpaid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setPaymentFilter('unpaid');
            }}
            className={
              paymentFilter === 'unpaid'
                ? 'bg-red-600 hover:bg-red-700 text-white font-semibold'
                : 'bg-white dark:bg-[#0c2219] text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#12281d]'
            }
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Unpaid Orders ({stats.unpaid})
          </Button>
          <Button
            variant={paymentFilter === 'paid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setPaymentFilter('paid');
            }}
            className={
              paymentFilter === 'paid'
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                : 'bg-white dark:bg-[#0c2219] text-gray-900 dark:text-gray-300 border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#12281d]'
            }
          >
            <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-400" />
            Paid Orders ({stats.paid})
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search order id, customer, table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225] dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-[#091a13] rounded-lg border border-gray-200 dark:border-[#143225] overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_100px_150px_1fr_120px_140px_140px_120px_100px] gap-4 px-4 py-3 bg-gray-50 dark:bg-[#07150f] border-b border-gray-200 dark:border-[#143225] text-sm font-medium text-gray-600 dark:text-gray-400">
          <div>Order</div>
          <div>Table</div>
          <div>Waiter</div>
          <div>Items</div>
          <div>Total</div>
          <div>Status</div>
          <div>Payment</div>
          <div>Placed</div>
          <div></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200 dark:divide-[#143225]">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 mb-2">No orders found</div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Orders will appear here once created'}
              </p>
            </div>
          ) : (
            sortedOrders.map((order: Order, index: number) => (
              <div
                key={order.id}
                className="grid grid-cols-[60px_100px_150px_1fr_120px_140px_140px_120px_100px] gap-4 px-4 py-4 hover:bg-gray-50 dark:hover:bg-[#0c2f21]/30 transition-colors items-center text-sm"
              >
                {/* Sequential Order Number */}
                <div className="font-medium text-gray-900 dark:text-white">
                  {(page - 1) * limit + index + 1}
                </div>

                {/* Table */}
                <div className="text-gray-700 dark:text-gray-300">
                  {order.table ? `T-${order.table.number}` : '-'}
                </div>

                {/* Waiter */}
                <div className="text-gray-700 dark:text-gray-300">
                  {order.createdBy ? order.createdBy.firstName : '-'}
                </div>

                {/* Items - Show food names with quantity */}
                <div className="text-gray-700 dark:text-gray-300">
                  {order.items && order.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {order.items.map((item: any, idx: number) => (
                        <span key={idx} className="text-sm">
                          {item.menuItem?.name || 'Unknown'} {item.quantity}
                          {idx < order.items.length - 1 && ','}
                        </span>
                      ))}
                    </div>
                  ) : order._count?.items ? (
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {order._count.items} {order._count.items === 1 ? 'item' : 'items'}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  )}
                </div>

                {/* Total */}
                <div className="font-semibold text-gray-900 dark:text-[#00e676]">
                  Br {order.total.toFixed(2)}
                </div>

                {/* Status */}
                <div>
                  <Badge className={`${getStatusColor(order.status)} font-normal text-xs`}>
                    ● {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </Badge>
                </div>

                {/* Payment Status */}
                <div>
                  <Badge className={`${getPaymentStatusColor(order.paymentStatus)} font-normal text-xs`}>
                    {order.paymentStatus}
                  </Badge>
                </div>

                {/* Time Ago */}
                <div className="text-gray-500 dark:text-gray-400 text-xs">{getTimeAgo(order.createdAt)}</div>

                {/* Actions */}
                <div className="flex justify-end gap-2 items-center">
                  {(() => {
                    const billRequest = getBillRequestForOrder(order.id);
                    const isUnpaid = order.paymentStatus === 'UNPAID';
                    const isReady = order.status === OrderStatus.READY;

                    // Cashier Role Actions:
                    // Cashiers audit, print customer bills, and print settled payment receipts.
                    // Cashiers do NOT collect payment at table-side (Waiters do).
                    if (isCashier) {
                      return (
                        <>
                          {isUnpaid ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenPrintSlip(order, 'BILL')}
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 px-2.5 gap-1 font-semibold shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print Bill
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPrintSlip(order, 'RECEIPT')}
                              className="border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c2219] text-xs h-8 px-2.5 gap-1 font-semibold"
                            >
                              <Receipt className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
                              Receipt
                            </Button>
                          )}

                          <button
                            onClick={() => handleViewDetails(order)}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#0c2219] rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </>
                      );
                    }

                    // Waiter & Manager Role Actions
                    const canRequestBill =
                      (isWaiter || isManagerOrOwner) &&
                      ['SERVED', 'COMPLETED'].includes(order.status) &&
                      isUnpaid &&
                      !billRequest;

                    const billReady = billRequest?.status === 'COMPLETED' && isUnpaid;
                    const billInProgress = billRequest && billRequest.status !== 'COMPLETED';

                    return (
                      <>
                        {/* Mark as Served button - only for Waiter or Manager */}
                        {isReady && (isWaiter || isManagerOrOwner) && (
                          <Button
                            size="sm"
                            onClick={() => markAsServedMutation.mutate(order.id)}
                            disabled={markAsServedMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Mark as Served
                          </Button>
                        )}

                        {/* Show bill status badge */}
                        {billInProgress && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300 font-normal text-xs">
                            {billRequest.status === 'PENDING' && '📄 Bill Requested'}
                            {billRequest.status === 'PROCESSING' && '⏳ Bill Processing'}
                          </Badge>
                        )}

                        {/* Request Bill button - ONLY for Waiters/Managers */}
                        {canRequestBill && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestBill(order)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs h-8"
                          >
                            <FileText className="w-3.5 h-3.5 mr-1" />
                            Request Bill
                          </Button>
                        )}

                        {/* Collect Payment button for Waiter/Manager */}
                        {(billReady || (isUnpaid && !billRequest && !canRequestBill)) && (
                          <Button
                            size="sm"
                            onClick={() => handleProcessPayment(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8"
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Collect Payment
                          </Button>
                        )}

                        <button
                          onClick={() => handleViewDetails(order)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-[#0c2219] rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-400 dark:text-gray-400" />
                        </button>

                        {order.status !== OrderStatus.CANCELLED &&
                          order.status !== OrderStatus.COMPLETED &&
                          (isWaiter || isManagerOrOwner) && (
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                              title="Cancel / Void Order"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
          >
            Next
          </Button>
        </div>
      )}

      {/* Order Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              #{selectedOrder?.orderNumber} •{' '}
              {selectedOrder && format(new Date(selectedOrder.createdAt), 'MMM dd, yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Order Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedOrder.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                {selectedOrder.table && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Table</p>
                    <p className="font-medium text-gray-900 dark:text-white">Table {selectedOrder.table.number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
                  <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
                {selectedOrder.createdBy && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Waiter</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.createdBy.firstName} {selectedOrder.createdBy.lastName}
                    </p>
                  </div>
                )}
                {selectedOrder.customer && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Order Items</h3>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#071a12] border border-gray-100 dark:border-[#143225] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.menuItem?.name || 'Unknown Item'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">Br {(item.subtotal || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">@ Br {(item.price || 0).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t border-gray-200 dark:border-[#143225] pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-medium text-gray-900 dark:text-white">Br {selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Tax ({selectedOrder.tax > 0 ? '15%' : '0%'})
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">Br {selectedOrder.tax.toFixed(2)}</span>
                </div>
                {selectedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Service Charge</span>
                    <span className="font-medium text-gray-900 dark:text-white">Br {selectedOrder.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                    <span>Discount</span>
                    <span className="font-medium">-Br {selectedOrder.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-[#143225]">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="font-extrabold text-emerald-800 dark:text-[#00e676]">
                    Br {selectedOrder.total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {(selectedOrder.notes || selectedOrder.specialInstructions) && (
                <div>
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Notes</h3>
                  {selectedOrder.notes && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedOrder.notes}</p>
                  )}
                  {selectedOrder.specialInstructions && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Special: {selectedOrder.specialInstructions}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t flex-wrap">
                {(() => {
                  const billRequest = getBillRequestForOrder(selectedOrder.id);
                  const isUnpaid = selectedOrder.paymentStatus === 'UNPAID';

                  // Cashier Role: Print Bill (if unpaid) or Print Receipt (if paid)
                  if (isCashier) {
                    return (
                      <div className="flex gap-2 w-full">
                        {isUnpaid ? (
                          <Button
                            onClick={() => {
                              setIsDetailsModalOpen(false);
                              handleOpenPrintSlip(selectedOrder, 'BILL');
                            }}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
                          >
                            <Printer className="w-4 h-4" />
                            Print Customer Bill
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setIsDetailsModalOpen(false);
                              handleOpenPrintSlip(selectedOrder, 'RECEIPT');
                            }}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                          >
                            <Receipt className="w-4 h-4" />
                            Print Payment Receipt
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => setIsDetailsModalOpen(false)}
                          className="px-4"
                        >
                          Close
                        </Button>
                      </div>
                    );
                  }

                  // Waiter & Manager Role Actions
                  const canRequestBill =
                    (isWaiter || isManagerOrOwner) &&
                    ['SERVED', 'COMPLETED'].includes(selectedOrder.status) &&
                    isUnpaid &&
                    !billRequest;

                  const billReady = billRequest?.status === 'COMPLETED' && isUnpaid;
                  const billInProgress = billRequest && billRequest.status !== 'COMPLETED';

                  return (
                    <>
                      {/* Show bill status message */}
                      {billInProgress && (
                        <div className="w-full mb-2 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                          <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
                            {billRequest.status === 'PENDING' && '📄 Bill request sent to cashier'}
                            {billRequest.status === 'PROCESSING' && '⏳ Cashier is processing bill request'}
                          </p>
                        </div>
                      )}

                      {billReady && (
                        <div className="w-full mb-2 p-3 bg-green-50 dark:bg-emerald-950/30 border border-green-200 dark:border-[#143225] rounded-lg">
                          <p className="text-sm text-green-800 dark:text-[#00e676] font-medium">
                            ✅ Bill is ready! You can now collect payment from customer
                          </p>
                        </div>
                      )}

                      {/* Request Bill button - ONLY for Waiters/Managers */}
                      {canRequestBill && (
                        <Button
                          onClick={() => {
                            setIsDetailsModalOpen(false);
                            handleRequestBill(selectedOrder);
                          }}
                          variant="outline"
                          className="flex-1 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Request Bill
                        </Button>
                      )}

                      {/* Collect Payment Button when bill is ready */}
                      {billReady && (
                        <Button
                          onClick={() => {
                            setIsDetailsModalOpen(false);
                            handleProcessPayment(selectedOrder);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Collect Payment
                        </Button>
                      )}

                      {/* Manager/Owner fallback payment button */}
                      {isManagerOrOwner && isUnpaid && !billRequest && !canRequestBill && (
                        <Button
                          onClick={() => {
                            setIsDetailsModalOpen(false);
                            handleProcessPayment(selectedOrder);
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Collect Payment
                        </Button>
                      )}
                    </>
                  );
                })()}

                {!isCashier &&
                  selectedOrder.status !== OrderStatus.CANCELLED &&
                  selectedOrder.status !== OrderStatus.COMPLETED && (
                    <>
                      {selectedOrder.status === OrderStatus.PENDING && (
                        <Button
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, OrderStatus.CONFIRMED)
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Confirm Order
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.CONFIRMED && (
                        <Button
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, OrderStatus.PREPARING)
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.PREPARING && (
                        <Button
                          onClick={() => handleStatusChange(selectedOrder.id, OrderStatus.READY)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Mark as Ready
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.READY && (
                        <Button
                          onClick={() => handleStatusChange(selectedOrder.id, OrderStatus.SERVED)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Mark as Served
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.SERVED && (
                        <Button
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, OrderStatus.COMPLETED)
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          Complete Order
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelOrder(selectedOrder.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel Order
                      </Button>
                    </>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Printable Bill / Receipt Slip Modal */}
      <Dialog open={!!orderToPrint} onOpenChange={(open) => !open && setOrderToPrint(null)}>
        <DialogContent className="max-w-md p-6 bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225] rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
              <Printer className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              {orderToPrint?.type === 'BILL' ? 'Print Official Customer Bill' : 'Print Settled Payment Receipt'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              Thermal receipt slip preview for Table {orderToPrint?.order.table?.number || 'Takeaway'}
            </DialogDescription>
          </DialogHeader>

          {orderToPrint && (
            <div className="bg-gray-50 dark:bg-[#071a12] border border-gray-200 dark:border-[#143225] rounded-xl p-4 font-mono text-xs space-y-2.5">
              <div className="text-center pb-2 border-b border-gray-300 dark:border-[#143225]">
                <h4 className="font-extrabold text-sm uppercase text-gray-900 dark:text-white">
                  {user?.branch?.name || 'Habesha Restaurant'}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">Bole, Addis Ababa, Ethiopia</p>
                <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 mt-1">
                  {orderToPrint.type === 'BILL' ? '*** CUSTOMER BILL ***' : '*** OFFICIAL PAYMENT RECEIPT ***'}
                </p>
              </div>

              <div className="text-[11px] space-y-0.5 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Order: #{orderToPrint.order.orderNumber}</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {orderToPrint.order.table ? `Table ${orderToPrint.order.table.number}` : 'Takeaway'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Waiter: {orderToPrint.order.createdBy?.firstName || 'Staff'}</span>
                  <span>{format(new Date(orderToPrint.order.createdAt), 'MMM dd, HH:mm')}</span>
                </div>
                {orderToPrint.type === 'RECEIPT' && (
                  <div className="flex justify-between text-emerald-700 dark:text-[#00e676] font-semibold">
                    <span>Payment: {orderToPrint.order.paymentMethod || 'SETTLED'}</span>
                    <span>Status: PAID</span>
                  </div>
                )}
              </div>

              <div className="border-t border-b border-dashed border-gray-300 dark:border-[#143225] py-2 space-y-1.5">
                {(orderToPrint.order.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-gray-900 dark:text-gray-200">
                    <span className="truncate pr-2">
                      {item.quantity}x {item.menuItem?.name || 'Item'}
                    </span>
                    <span className="font-semibold shrink-0">
                      Br {(item.subtotal || item.price * item.quantity || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Br {orderToPrint.order.subtotal?.toFixed(2) || orderToPrint.order.total.toFixed(2)}</span>
                </div>
                {orderToPrint.order.tax > 0 && (
                  <div className="flex justify-between">
                    <span>VAT (15%):</span>
                    <span>Br {orderToPrint.order.tax.toFixed(2)}</span>
                  </div>
                )}
                {orderToPrint.order.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span>Service Charge:</span>
                    <span>Br {orderToPrint.order.serviceCharge.toFixed(2)}</span>
                  </div>
                )}
                {orderToPrint.order.discount > 0 && (
                  <div className="flex justify-between text-rose-600 dark:text-rose-400">
                    <span>Discount:</span>
                    <span>-Br {orderToPrint.order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-gray-900 dark:text-white pt-1 border-t border-gray-300 dark:border-[#143225]">
                  <span>TOTAL DUE:</span>
                  <span className="text-emerald-700 dark:text-[#00e676]">Br {orderToPrint.order.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center pt-2 text-[10px] text-gray-400">
                <p>Thank you for dining with us!</p>
                <p>Ameseginalehu</p>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrderToPrint(null)}
              className="flex-1 text-xs dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
            >
              Close
            </Button>
            <Button
              size="sm"
              onClick={() => {
                window.print();
                toast.success(
                  orderToPrint?.type === 'BILL' ? 'Bill sent to printer!' : 'Receipt sent to printer!'
                );
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 font-semibold"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Thermal Slip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        order={selectedOrder}
      />
    </div>
  );
}
