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
  Printer,
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
      <div className="p-3 sm:p-5 md:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-[#143225] rounded w-1/4" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 sm:h-24 bg-gray-200 dark:bg-[#0c2219] rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-[#0c2219] rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Bill Request Queue</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Process bill requests from waiters and generate bills for customers
        </p>
      </div>

      {/* Statistics Cards - 2x2 Grid on Mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-6">
        <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-100 dark:border-[#143225]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-0.5 sm:mt-1">{stats.pending}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-yellow-100 dark:bg-yellow-950/40 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-100 dark:border-[#143225]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Processing</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 sm:mt-1">{stats.processing}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-100 dark:border-[#143225]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-[#00e676] mt-0.5 sm:mt-1">{stats.completed}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-green-100 dark:bg-[#0c2219] flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-green-600 dark:text-[#00e676]" />
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-100 dark:border-[#143225]">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-1">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">Cancelled</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5 sm:mt-1">{stats.cancelled}</p>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-red-600 dark:text-red-400" />
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
                ? 'bg-yellow-600 hover:bg-yellow-700 text-white font-semibold cursor-pointer'
                : 'bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#0c2219] cursor-pointer'
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
                ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer'
                : 'bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#0c2219] cursor-pointer'
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
                ? 'bg-green-600 hover:bg-green-700 text-white font-semibold cursor-pointer'
                : 'bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#0c2219] cursor-pointer'
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
                ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-bold cursor-pointer'
                : 'bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#0c2219] cursor-pointer'
            }
          >
            All Requests
          </Button>
        </div>
      </div>

      {/* Bill Requests Table */}
      <div className="bg-white dark:bg-[#091a13] rounded-xl border border-gray-200 dark:border-[#143225] shadow-xs overflow-hidden">
        {billRequests.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <div className="text-gray-700 dark:text-gray-300 font-semibold mb-1">No bill requests</div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Bill requests from waiters will appear here automatically
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#143225] text-left">
              <thead className="bg-gray-50 dark:bg-[#0c2219] border-b border-gray-200 dark:border-[#143225]">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Table
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Items Ordered
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#143225] bg-white dark:bg-[#091a13]">
                {billRequests.map((request: BillRequest) => {
                  const tableNumber = request.table?.number || request.order?.table?.number;
                  const waiterName = request.requestedBy
                    ? `${request.requestedBy.firstName || ''} ${request.requestedBy.lastName || ''}`.trim() || 'Server'
                    : 'Server';
                  const items = request.order?.items || [];
                  const isUUID = request.notes && /^[0-9a-f-]{36}$/i.test(request.notes.trim());
                  const noteText = !isUUID && request.notes ? request.notes.trim() : null;

                  return (
                    <tr key={request.id} className="hover:bg-gray-50/80 dark:hover:bg-[#0c2f21]/30 transition-colors">
                      {/* Table */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-[#071a12] text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                          {tableNumber ? `Table ${tableNumber}` : 'Direct Order'}
                        </span>
                      </td>

                      {/* Waiter */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-[#071a12] flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#143225]">
                            <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900 dark:text-white">{waiterName}</div>
                            <div className="text-[11px] text-gray-400">Waiter</div>
                          </div>
                        </div>
                      </td>

                      {/* Items Ordered */}
                      <td className="px-4 py-3.5">
                        {items.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                              {items.slice(0, 3).map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 dark:bg-[#071a12] text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs font-medium border border-gray-200/60 dark:border-[#143225] whitespace-nowrap"
                                >
                                  <span className="font-bold text-gray-900 dark:text-white mr-1">{item.quantity}x</span>
                                  {item.menuItem?.name || item.name || 'Item'}
                                </span>
                              ))}
                              {items.length > 3 && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                  +{items.length - 3} more
                                </span>
                              )}
                            </div>
                            {noteText && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 italic max-w-sm truncate">
                                Note: {noteText}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Order #{request.order?.orderNumber ? request.order.orderNumber.slice(-8) : '—'}
                            </span>
                            {noteText && (
                              <p className="text-[11px] text-amber-700 dark:text-amber-400 italic max-w-sm truncate">
                                Note: {noteText}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Requested Time */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getTimeAgo(request.requestedAt)}</span>
                        </div>
                        {request.priority > 0 && (
                          <div className={`text-[11px] font-semibold mt-0.5 ${getPriorityColor(request.priority)}`}>
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Priority: {request.priority}
                          </div>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-extrabold text-gray-900 dark:text-[#00e676]">
                          Br {request.order?.total != null ? Number(request.order.total).toFixed(2) : '0.00'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge className={`${getStatusColor(request.status)} font-semibold text-xs border-0`}>
                          {request.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pending Actions */}
                          {request.status === BillRequestStatus.PENDING && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleProcessAndGenerate(request)}
                                className="h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Print Bill
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProcess(request.id)}
                                className="h-8 px-2.5 text-xs font-medium border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] cursor-pointer"
                              >
                                Process
                              </Button>
                            </>
                          )}

                          {/* Processing Actions */}
                          {request.status === BillRequestStatus.PROCESSING && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleGenerateBill(request)}
                                className="h-8 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white gap-1.5 shadow-2xs cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Print Bill
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleComplete(request.id)}
                                className="h-8 px-2.5 text-xs font-medium bg-green-600 hover:bg-green-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-bold gap-1 cursor-pointer"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                Done
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleCancel(request.id)}
                                className="h-8 px-2 text-xs bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                title="Cancel Request"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}

                          {/* Completed Actions */}
                          {request.status === BillRequestStatus.COMPLETED && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateBill(request)}
                              className="h-8 px-2.5 text-xs font-medium border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] gap-1.5 cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                              Re-Print
                            </Button>
                          )}

                          {/* View Details Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleViewDetails(request)}
                            className="h-8 w-8 p-0 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219] cursor-pointer"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bill Request Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#091a13] border dark:border-[#143225]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Bill Request Details</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {selectedRequest && format(new Date(selectedRequest.requestedAt), 'MMM dd, yyyy HH:mm')}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && selectedRequest.order && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                  <p className={`font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                    {selectedRequest.priority}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Table</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedRequest.table?.number ? `Table ${selectedRequest.table.number}` : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Requested By</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedRequest.requestedBy?.firstName} {selectedRequest.requestedBy?.lastName}
                  </p>
                </div>
                {selectedRequest.processedBy && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Processed By</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRequest.processedBy.firstName} {selectedRequest.processedBy.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Processed At</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {selectedRequest.processedAt &&
                          format(new Date(selectedRequest.processedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Order Details */}
              <div className="border-t border-gray-200 dark:border-[#143225] pt-4">
                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order Number</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.order.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Order Status</p>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedRequest.order.status}</p>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-2 mb-4">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-white">Items</h4>
                  {(selectedRequest.order.items || []).map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#071a12] border dark:border-[#143225] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{item.menuItem?.name || item.name || 'Unknown Item'}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 dark:text-[#00e676]">Br {(item.subtotal || 0).toFixed(2)}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          @ Br {(item.price || 0).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Totals */}
                <div className="border-t border-gray-200 dark:border-[#143225] pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                    <span className="font-medium text-gray-900 dark:text-white">Br {selectedRequest.order.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Tax</span>
                    <span className="font-medium text-gray-900 dark:text-white">Br {selectedRequest.order.tax?.toFixed(2)}</span>
                  </div>
                  {selectedRequest.order.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Service Charge</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        Br {selectedRequest.order.serviceCharge.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selectedRequest.order.discount > 0 && (
                    <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                      <span>Discount</span>
                      <span className="font-medium">
                        -Br {selectedRequest.order.discount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-[#143225] text-gray-900 dark:text-[#00e676]">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span>Br {selectedRequest.order.total?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && !/^[0-9a-f-]{36}$/i.test(selectedRequest.notes.trim()) && (
                <div className="border-t border-gray-200 dark:border-[#143225] pt-4">
                  <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Notes</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-[#143225]">
                {selectedRequest.status === BillRequestStatus.PENDING && (
                  <>
                    <Button
                      onClick={() => {
                        handleProcess(selectedRequest.id);
                        setIsDetailsModalOpen(false);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 cursor-pointer"
                    >
                      <Loader2 className="w-4 h-4 mr-2" />
                      Start Processing
                    </Button>
                    <Button
                      onClick={() => {
                        setIsDetailsModalOpen(false);
                        handleProcessAndGenerate(selectedRequest);
                      }}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer"
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
                      className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4 mr-2" />
                      Generate & Print Bill
                    </Button>
                    <Button
                      onClick={() => handleComplete(selectedRequest.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-bold cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleCancel(selectedRequest.id)}
                      className="cursor-pointer"
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
