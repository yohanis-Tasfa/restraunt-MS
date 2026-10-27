import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billRequestsApi, BillRequestStatus } from '../api/billRequests';
import type { BillRequest } from '../api/billRequests';
import { useAuthStore } from '../store/authStore';
import { useBillRequestNotifications } from '../hooks/useBillRequestNotifications';
import { Button } from '../components/ui/button';
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
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  User,
  Table as TableIcon,
  DollarSign,
  Eye,
  Receipt,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import BillGenerator from '../components/bills/BillGenerator';

export default function BillRequestQueuePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<BillRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBillGeneratorOpen, setIsBillGeneratorOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // Changed to 'all' to show all requests initially

  // Enable real-time notifications
  useBillRequestNotifications();

  // Fetch bill requests
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bill-requests', statusFilter],
    queryFn: async () => {
      console.log('Fetching bill requests with params:', {
        status: statusFilter === 'all' ? undefined : statusFilter.toUpperCase(),
      });
      const result = await billRequestsApi.getAll({
        status: statusFilter === 'all' ? undefined : (statusFilter.toUpperCase() as BillRequestStatus),
        // Not filtering by branch for now since backend returns empty when branchId is passed
        page: 1,
        limit: 50,
      });
      console.log('Bill requests fetched:', result);
      return result;
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // The API returns { data: [...], pagination: {...} }
  const billRequests = data?.data || [];
  const pagination = data?.pagination;
  
  console.log('Bill requests in component:', billRequests);

  // Process bill request mutation
  const processMutation = useMutation({
    mutationFn: (id: string) => billRequestsApi.process(id, user?.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
      toast.success('Bill request is now being processed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process bill request');
    },
  });

  // Complete bill request mutation
  const completeMutation = useMutation({
    mutationFn: ({ id, billId }: { id: string; billId?: string }) =>
      billRequestsApi.complete(id, billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
      toast.success('Bill request completed');
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete bill request');
    },
  });

  // Cancel bill request mutation
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      billRequestsApi.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
      toast.success('Bill request cancelled');
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel bill request');
    },
  });

  const handleViewDetails = async (request: BillRequest) => {
    try {
      // Fetch full details
      const fullRequest = await billRequestsApi.getById(request.id);
      setSelectedRequest(fullRequest);
      setIsDetailsModalOpen(true);
    } catch (error: any) {
      toast.error('Failed to load bill request details');
      console.error('Error loading bill request:', error);
    }
  };

  const handleProcess = (id: string) => {
    processMutation.mutate(id);
  };

  const handleProcessAndGenerate = async (request: BillRequest) => {
    try {
      if (request.status === BillRequestStatus.PENDING) {
        await billRequestsApi.process(request.id, user?.id);
        queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
      }
      const fullRequest = await billRequestsApi.getById(request.id);
      setSelectedRequest(fullRequest);
      setIsBillGeneratorOpen(true);
    } catch (error: any) {
      toast.error('Failed to process and generate bill');
      console.error('Error in handleProcessAndGenerate:', error);
    }
  };

  const handleGenerateBill = async (request: BillRequest) => {
    try {
      // Fetch full details if needed
      const fullRequest = await billRequestsApi.getById(request.id);
      setSelectedRequest(fullRequest);
      setIsBillGeneratorOpen(true);
    } catch (error: any) {
      toast.error('Failed to load bill request details');
      console.error('Error loading bill request:', error);
    }
  };

  const handleComplete = (id: string) => {
    if (window.confirm('Mark this bill request as completed?')) {
      completeMutation.mutate({ id });
    }
  };

  const handleCancel = (id: string) => {
    const reason = window.prompt('Reason for cancellation:');
    if (reason !== null) {
      cancelMutation.mutate({ id, reason });
    }
  };

  const getStatusColor = (status: BillRequestStatus) => {
    switch (status) {
      case BillRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700';
      case BillRequestStatus.PROCESSING:
        return 'bg-blue-100 text-blue-700';
      case BillRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-700';
      case BillRequestStatus.CANCELLED:
        return 'bg-red-100 text-red-700';
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

  const getPriorityColor = (priority: number) => {
    if (priority >= 30) return 'text-red-600';
    if (priority >= 15) return 'text-orange-600';
    return 'text-gray-600';
  };

  // Statistics
  const stats = {
    pending: billRequests.filter((r: BillRequest) => r.status === BillRequestStatus.PENDING).length,
    processing: billRequests.filter((r: BillRequest) => r.status === BillRequestStatus.PROCESSING)
      .length,
    completed: billRequests.filter((r: BillRequest) => r.status === BillRequestStatus.COMPLETED)
      .length,
    cancelled: billRequests.filter((r: BillRequest) => r.status === BillRequestStatus.CANCELLED)
      .length,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded" />
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
        <h1 className="text-2xl font-bold text-gray-900">Bill Request Queue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Process bill requests from waiters and generate bills for customers
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.processing}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className={
              statusFilter === 'pending'
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            <Clock className="w-4 h-4 mr-2" />
            Pending ({stats.pending})
          </Button>
          <Button
            variant={statusFilter === 'processing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('processing')}
            className={
              statusFilter === 'processing'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            <Loader2 className="w-4 h-4 mr-2" />
            Processing ({stats.processing})
          </Button>
          <Button
            variant={statusFilter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('completed')}
            className={
              statusFilter === 'completed'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed ({stats.completed})
          </Button>
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
            className={
              statusFilter === 'all'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'
            }
          >
            All Requests
          </Button>
        </div>
      </div>

      {/* Bill Requests List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {billRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <div className="text-gray-400 mb-2">No bill requests</div>
            <p className="text-sm text-gray-500">
              Bill requests from waiters will appear here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {billRequests.map((request: BillRequest) => (
              <div
                key={request.id}
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={`${getStatusColor(request.status)} font-normal`}>
                        {request.status}
                      </Badge>
                      {request.priority > 0 && (
                        <span className={`text-sm font-medium ${getPriorityColor(request.priority)}`}>
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          Priority: {request.priority}
                        </span>
                      )}
                      <span className="text-sm text-gray-500">{getTimeAgo(request.requestedAt)}</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Order Number</p>
                        <p className="font-medium text-sm text-gray-900">
                          {request.order?.orderNumber || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Table</p>
                        <p className="font-medium text-sm text-gray-900 flex items-center">
                          <TableIcon className="w-3 h-3 mr-1" />
                          {request.table?.number || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Requested By</p>
                        <p className="font-medium text-sm text-gray-900 flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {request.requestedBy?.firstName || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-1">Total Amount</p>
                        <p className="font-medium text-sm text-gray-900 flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {request.order?.total?.toFixed(2) || '0.00'} ETB
                        </p>
                      </div>
                    </div>

                    {request.notes && (
                      <p className="text-sm text-gray-600 italic mt-2">Note: {request.notes}</p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(request)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>

                    {request.status === BillRequestStatus.PENDING && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleProcess(request.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <Loader2 className="w-4 h-4 mr-1" />
                          Process
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleProcessAndGenerate(request)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Generate Bill
                        </Button>
                      </>
                    )}

                    {request.status === BillRequestStatus.PROCESSING && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateBill(request)}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Generate
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleComplete(request.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleCancel(request.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Request Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bill Request Details</DialogTitle>
            <DialogDescription>
              {selectedRequest && format(new Date(selectedRequest.requestedAt), 'MMM dd, yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && selectedRequest.order && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Priority</p>
                  <p className={`font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Table</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.table?.number ? `Table ${selectedRequest.table.number}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Requested By</p>
                  <p className="font-medium text-gray-900">
                    {selectedRequest.requestedBy?.firstName} {selectedRequest.requestedBy?.lastName}
                  </p>
                </div>
                {selectedRequest.processedBy && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Processed By</p>
                      <p className="font-medium text-gray-900">
                        {selectedRequest.processedBy.firstName} {selectedRequest.processedBy.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Processed At</p>
                      <p className="font-medium text-gray-900">
                        {selectedRequest.processedAt &&
                          format(new Date(selectedRequest.processedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Order Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3 text-gray-900">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Order Number</p>
                    <p className="font-medium text-gray-900">{selectedRequest.order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Status</p>
                    <p className="font-medium text-gray-900">{selectedRequest.order.status}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-sm text-gray-900">Items</h4>
                  {(selectedRequest.order.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.menuItem?.name || 'Unknown Item'}</p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{(item.subtotal || 0).toFixed(2)} ETB</p>
                        <p className="text-sm text-gray-600">
                          @ {(item.price || 0).toFixed(2)} ETB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{selectedRequest.order.subtotal?.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">{selectedRequest.order.tax?.toFixed(2)} ETB</span>
                  </div>
                  {selectedRequest.order.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service Charge</span>
                      <span className="font-medium text-gray-900">
                        {selectedRequest.order.serviceCharge.toFixed(2)} ETB
                      </span>
                    </div>
                  )}
                  {selectedRequest.order.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600">
                      <span>Discount</span>
                      <span className="font-medium">
                        -{selectedRequest.order.discount.toFixed(2)} ETB
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t text-gray-900">
                    <span>Total</span>
                    <span>{selectedRequest.order.total?.toFixed(2)} ETB</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 text-gray-900">Notes</h3>
                  <p className="text-sm text-gray-600">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedRequest.status === BillRequestStatus.PENDING && (
                  <>
                    <Button
                      onClick={() => {
                        handleProcess(selectedRequest.id);
                        setIsDetailsModalOpen(false);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Start Processing
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleProcessAndGenerate(selectedRequest);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Generate Bill
                    </Button>
                  </>
                )}

                {selectedRequest.status === BillRequestStatus.PROCESSING && (
                  <>
                    <Button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleGenerateBill(selectedRequest);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Generate & Print Bill
                    </Button>
                    <Button
                      onClick={() => handleComplete(selectedRequest.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(selectedRequest.id)}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bill Generator Modal */}
      {selectedRequest && (
        <BillGenerator
          billRequest={selectedRequest}
          open={isBillGeneratorOpen}
          onOpenChange={setIsBillGeneratorOpen}
        />
      )}
    </div>
  );
}
