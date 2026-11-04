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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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

      {/* Statistics Cards - Balanced 4-Grid with interactive filtering */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 mb-4 sm:mb-6">
        <div
          onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${
            statusFilter === 'pending'
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-amber-300/80 hover:bg-amber-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">Pending</span>
            {statusFilter === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{stats.pending}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'processing' ? 'all' : 'processing')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${
            statusFilter === 'processing'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-blue-300/80 hover:bg-blue-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">Processing</span>
            {statusFilter === 'processing' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{stats.processing}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'completed' ? 'all' : 'completed')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${
            statusFilter === 'completed'
              ? 'bg-emerald-50/80 dark:bg-[#071a12] border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-emerald-300/80 hover:bg-emerald-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">Completed</span>
            {statusFilter === 'completed' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-bold text-emerald-600 dark:text-[#00e676] mt-0.5">{stats.completed}</p>
          </div>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'cancelled' ? 'all' : 'cancelled')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${
            statusFilter === 'cancelled'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-rose-300/80 hover:bg-rose-50/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">Cancelled</span>
            {statusFilter === 'cancelled' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
          </div>
          <div className="mt-1 sm:mt-2">
            <p className="text-lg sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{stats.cancelled}</p>
          </div>
        </div>
      </div>

      {/* Filter Toolbar: Mobile Dropdown / Desktop Segmented Buttons */}
      <div className="mb-4">
        {/* Mobile Dropdown */}
        <div className="block sm:hidden">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full h-10 text-xs font-semibold rounded-xl bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225] shadow-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
              <SelectItem value="all">All Requests ({billRequests.length})</SelectItem>
              <SelectItem value="pending">Pending ({stats.pending})</SelectItem>
              <SelectItem value="processing">Processing ({stats.processing})</SelectItem>
              <SelectItem value="completed">Completed ({stats.completed})</SelectItem>
              <SelectItem value="cancelled">Cancelled ({stats.cancelled})</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Desktop Segmented Buttons */}
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
            className={
              statusFilter === 'pending'
                ? 'bg-amber-600 hover:bg-amber-700 text-white font-semibold cursor-pointer'
                : 'bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border-gray-300 dark:border-[#143225] hover:bg-gray-50 dark:hover:bg-[#0c2219] cursor-pointer'
            }
          >
            <Clock className="w-4 h-4 mr-1.5" />
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
            <Loader2 className="w-4 h-4 mr-1.5" />
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
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Completed ({stats.completed})
          </Button>
        </div>
      </div>

      {/* Bill Requests Table - Restructured with Action on Far Left (100% Mobile Width) */}
      <div className="bg-white dark:bg-[#091a13] rounded-2xl border border-gray-200/80 dark:border-[#143225] shadow-xs overflow-hidden w-full">
        {billRequests.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <div className="text-gray-700 dark:text-gray-300 font-semibold mb-1">No bill requests</div>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Bill requests from waiters will appear here automatically
            </p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left">
              <thead className="bg-gray-50/90 dark:bg-[#07150f] border-b border-gray-200 dark:border-[#143225] text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                <tr>
                  {/* Column 1: Action (FAR LEFT for mobile accessibility) */}
                  <th className="py-3 px-3 sm:px-4 w-[120px] sm:w-[150px]">
                    Action
                  </th>
                  {/* Column 2: Table & Waiter */}
                  <th className="py-3 px-2 sm:px-4">
                    Table
                  </th>
                  {/* Column 3: Total */}
                  <th className="py-3 px-2 sm:px-4">
                    Total
                  </th>
                  {/* Column 4: Status */}
                  <th className="py-3 px-2 sm:px-4">
                    Status
                  </th>
                  {/* Desktop Columns */}
                  <th className="py-3 px-4 hidden md:table-cell">
                    Requested By
                  </th>
                  <th className="py-3 px-4 hidden lg:table-cell">
                    Items Ordered
                  </th>
                  <th className="py-3 px-4 hidden md:table-cell">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#143225] bg-white dark:bg-[#091a13] text-xs sm:text-sm">
                {billRequests.map((request: BillRequest) => {
                  const tableNumber = request.table?.number || request.order?.table?.number;
                  const waiterName = request.requestedBy
                    ? `${request.requestedBy.firstName || ''} ${request.requestedBy.lastName || ''}`.trim() || 'Server'
                    : 'Server';
                  const items = request.order?.items || [];
                  const isUUID = request.notes && /^[0-9a-f-]{36}$/i.test(request.notes.trim());
                  const noteText = !isUUID && request.notes ? request.notes.trim() : null;

                  return (
                    <tr
                      key={request.id}
                      onClick={() => handleViewDetails(request)}
                      className="hover:bg-gray-50/80 dark:hover:bg-[#0c2f21]/30 transition-colors cursor-pointer"
                    >
                      {/* 1. Action (FAR LEFT) */}
                      <td
                        className="py-3 px-3 sm:px-4 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-1.5">
                          {/* Pending Actions */}
                          {request.status === BillRequestStatus.PENDING && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessAndGenerate(request)}
                              className="h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                            >
                              <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              <span>Print Bill</span>
                            </Button>
                          )}

                          {/* Processing Actions */}
                          {request.status === BillRequestStatus.PROCESSING && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleGenerateBill(request)}
                                className="h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                              >
                                <Printer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>Print</span>
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleComplete(request.id)}
                                className="h-7 sm:h-8 px-2 text-[11px] sm:text-xs font-bold bg-green-600 hover:bg-green-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] cursor-pointer"
                                title="Complete"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}

                          {/* Completed Actions */}
                          {request.status === BillRequestStatus.COMPLETED && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleGenerateBill(request)}
                              className="h-7 sm:h-8 px-2 sm:px-2.5 text-[11px] sm:text-xs font-medium border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] gap-1 cursor-pointer"
                            >
                              <Printer className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                              <span>Re-Print</span>
                            </Button>
                          )}

                          {/* Cancelled State */}
                          {request.status === BillRequestStatus.CANCELLED && (
                            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium italic">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 2. Table & Waiter */}
                      <td className="py-3 px-2 sm:px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold bg-amber-50 dark:bg-[#071a12] text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 whitespace-nowrap">
                          {tableNumber ? (tableNumber.toLowerCase().startsWith('t') ? tableNumber : `T-${tableNumber}`) : 'Direct'}
                        </span>
                        <div className="text-[10px] text-gray-400 dark:text-gray-500 md:hidden mt-0.5 truncate max-w-[80px]">
                          {waiterName}
                        </div>
                      </td>

                      {/* 3. Total */}
                      <td className="py-3 px-2 sm:px-4 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-[#00e676]">
                          Br {request.order?.total != null ? Number(request.order.total).toFixed(0) : '0'}
                        </div>
                        <div className="text-[10px] text-gray-400 md:hidden">
                          {getTimeAgo(request.requestedAt)}
                        </div>
                      </td>

                      {/* 4. Status */}
                      <td className="py-3 px-2 sm:px-4 whitespace-nowrap">
                        <Badge className={`${getStatusColor(request.status)} font-semibold text-[10px] sm:text-xs border-0 py-0.5 px-1.5`}>
                          {request.status}
                        </Badge>
                      </td>

                      {/* Desktop Col: Requested By */}
                      <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-[#071a12] flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#143225]">
                            <User className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-900 dark:text-white">{waiterName}</div>
                            <div className="text-[10px] text-gray-400">Waiter</div>
                          </div>
                        </div>
                      </td>

                      {/* Desktop Col: Items Ordered */}
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {items.length > 0 ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap max-w-sm">
                              {items.slice(0, 2).map((item: any, idx: number) => (
                                <span
                                  key={idx}
                                  className="bg-gray-100 dark:bg-[#071a12] text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-[11px] font-medium border border-gray-200/60 dark:border-[#143225] whitespace-nowrap"
                                >
                                  <span className="font-bold text-gray-900 dark:text-white mr-1">{item.quantity}x</span>
                                  {item.menuItem?.name || item.name || 'Item'}
                                </span>
                              ))}
                              {items.length > 2 && (
                                <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                                  +{items.length - 2} more
                                </span>
                              )}
                            </div>
                            {noteText && (
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 italic max-w-sm truncate">
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
                              <p className="text-[10px] text-amber-700 dark:text-amber-400 italic max-w-sm truncate">
                                Note: {noteText}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Desktop Col: Requested Time */}
                      <td className="py-3 px-4 whitespace-nowrap hidden md:table-cell">
                        <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{getTimeAgo(request.requestedAt)}</span>
                        </div>
                        {request.priority > 0 && (
                          <div className={`text-[10px] font-semibold mt-0.5 ${getPriorityColor(request.priority)}`}>
                            <AlertCircle className="w-3 h-3 inline mr-1" />
                            Priority: {request.priority}
                          </div>
                        )}
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
