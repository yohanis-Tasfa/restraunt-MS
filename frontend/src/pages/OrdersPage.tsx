import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi, OrderStatus, OrderType, type Order } from '../api/orders';
import { useAuthStore } from '../store/authStore';
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
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function OrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch orders
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', user?.branch?.id, page],
    queryFn: () =>
      ordersApi.getOrders({
        branchId: user?.branch?.id,
        page,
        limit,
      }),
    enabled: !!user?.branch?.id,
  });

  const orders = data?.data || [];
  const pagination = data?.pagination || null;

  // Filter orders by search term (client-side)
  const filteredOrders = (orders || []).filter(
    (order: Order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table?.number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order cancelled');
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });

  const handleViewDetails = async (order: Order) => {
    try {
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
    updateStatusMutation.mutate({ id: orderId, status });
  };

  const handleCancelOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
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
    total: (orders || []).length,
    pending: (orders || []).filter((o: Order) => o.status === OrderStatus.PENDING).length,
    cancelled: (orders || []).filter((o: Order) => o.status === OrderStatus.CANCELLED).length,
    completed: (orders || []).filter((o: Order) => o.status === OrderStatus.COMPLETED).length,
    totalRevenue: (orders || []).reduce((sum: number, o: Order) => sum + (o.total || 0), 0),
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track all orders</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <X className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {stats.totalRevenue.toFixed(0)} ETB
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search order id, customer, table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_100px_150px_1fr_120px_140px_120px_50px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div>Order</div>
          <div>Table</div>
          <div>Waiter</div>
          <div>Items</div>
          <div>Total</div>
          <div>Status</div>
          <div>Placed</div>
          <div></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">No orders found</div>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? 'Try adjusting your search'
                  : 'Orders will appear here once created'}
              </p>
            </div>
          ) : (
            sortedOrders.map((order: Order, index: number) => (
              <div
                key={order.id}
                className="grid grid-cols-[60px_100px_150px_1fr_120px_140px_120px_50px] gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center text-sm"
              >
                {/* Sequential Order Number */}
                <div className="font-medium text-gray-900">
                  {(page - 1) * limit + index + 1}
                </div>

                {/* Table */}
                <div className="text-gray-700">
                  {order.table ? `T-${order.table.number}` : '-'}
                </div>

                {/* Waiter */}
                <div className="text-gray-700">
                  {order.createdBy ? order.createdBy.firstName : '-'}
                </div>

                {/* Items - Show food names with quantity */}
                <div className="text-gray-700">
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
                    <span className="text-gray-500 text-sm">
                      {order._count.items} {order._count.items === 1 ? 'item' : 'items'}
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </div>

                {/* Total */}
                <div className="font-medium text-gray-900">
                  Br {order.total.toFixed(2)}
                </div>

                {/* Status */}
                <div>
                  <Badge className={`${getStatusColor(order.status)} font-normal text-xs`}>
                    ● {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </Badge>
                </div>

                {/* Time Ago */}
                <div className="text-gray-500 text-xs">{getTimeAgo(order.createdAt)}</div>

                {/* Actions Menu */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleViewDetails(order)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
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
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
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
                  <p className="text-sm text-gray-600">Order Type</p>
                  <p className="font-medium">{selectedOrder.type.replace('_', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedOrder.status)}>
                    {selectedOrder.status}
                  </Badge>
                </div>
                {selectedOrder.table && (
                  <div>
                    <p className="text-sm text-gray-600">Table</p>
                    <p className="font-medium">Table {selectedOrder.table.number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <Badge className={getPaymentStatusColor(selectedOrder.paymentStatus)}>
                    {selectedOrder.paymentStatus}
                  </Badge>
                </div>
                {selectedOrder.createdBy && (
                  <div>
                    <p className="text-sm text-gray-600">Waiter</p>
                    <p className="font-medium">
                      {selectedOrder.createdBy.firstName} {selectedOrder.createdBy.lastName}
                    </p>
                  </div>
                )}
                {selectedOrder.customer && (
                  <div>
                    <p className="text-sm text-gray-600">Customer</p>
                    <p className="font-medium">
                      {selectedOrder.customer.firstName} {selectedOrder.customer.lastName}
                    </p>
                  </div>
                )}
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold mb-3">Order Items</h3>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.menuItem?.name || 'Unknown Item'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                        {item.notes && (
                          <p className="text-sm text-gray-500 italic">Note: {item.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.subtotal.toFixed(2)} ETB</p>
                        <p className="text-sm text-gray-600">@ {item.price.toFixed(2)} ETB</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{selectedOrder.subtotal.toFixed(2)} ETB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    Tax ({selectedOrder.tax > 0 ? '15%' : '0%'})
                  </span>
                  <span className="font-medium">{selectedOrder.tax.toFixed(2)} ETB</span>
                </div>
                {selectedOrder.serviceCharge > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Charge</span>
                    <span className="font-medium">{selectedOrder.serviceCharge.toFixed(2)} ETB</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span className="font-medium">-{selectedOrder.discount.toFixed(2)} ETB</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{selectedOrder.total.toFixed(2)} ETB</span>
                </div>
              </div>

              {/* Notes */}
              {(selectedOrder.notes || selectedOrder.specialInstructions) && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  {selectedOrder.notes && (
                    <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
                  )}
                  {selectedOrder.specialInstructions && (
                    <p className="text-sm text-gray-600 italic">
                      Special: {selectedOrder.specialInstructions}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedOrder.status !== OrderStatus.CANCELLED &&
                  selectedOrder.status !== OrderStatus.COMPLETED && (
                    <>
                      {selectedOrder.status === OrderStatus.PENDING && (
                        <Button
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, OrderStatus.CONFIRMED)
                          }
                          className="flex-1"
                        >
                          Confirm Order
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.CONFIRMED && (
                        <Button
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, OrderStatus.PREPARING)
                          }
                          className="flex-1"
                        >
                          Start Preparing
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.PREPARING && (
                        <Button
                          onClick={() => handleStatusChange(selectedOrder.id, OrderStatus.READY)}
                          className="flex-1"
                        >
                          Mark as Ready
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.READY && (
                        <Button
                          onClick={() => handleStatusChange(selectedOrder.id, OrderStatus.SERVED)}
                          className="flex-1"
                        >
                          Mark as Served
                        </Button>
                      )}
                      {selectedOrder.status === OrderStatus.SERVED && (
                        <Button
                          onClick={() =>
                            handleStatusChange(selectedOrder.id, OrderStatus.COMPLETED)
                          }
                          className="flex-1"
                        >
                          Complete Order
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleCancelOrder(selectedOrder.id)}
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
    </div>
  );
}
