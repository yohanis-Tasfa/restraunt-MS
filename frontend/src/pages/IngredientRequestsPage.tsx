import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ingredientRequestsApi, type IngredientRequest } from '../api/ingredientRequests';
import inventoryApi from '../api/inventory';
import { useAuthStore } from '../store/authStore';
import { useWebSocket } from '../contexts/WebSocketContext';
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
  PackagePlus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Boxes,
  Send,
  Loader2,
  PackageCheck,
  Check,
  X,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function IngredientRequestsPage() {
  const { user } = useAuthStore();
  const { socket } = useWebSocket();
  const queryClient = useQueryClient();

  const userRole = user?.role?.name || '';
  const isManagerOrOwner = ['Owner', 'Manager', 'Super Admin', 'Admin'].includes(userRole);
  const isKitchenStaff = userRole === 'Kitchen Staff';

  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<IngredientRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Form states
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [notes, setNotes] = useState('');

  // Fetch ingredient requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['ingredient-requests', user?.branch?.id],
    queryFn: () => ingredientRequestsApi.getAll({ branchId: user?.branch?.id }),
    refetchInterval: 10000,
  });

  // Fetch inventory items for dropdown
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-dropdown', user?.branch?.id],
    queryFn: () => inventoryApi.getAll({ limit: 1000 }),
  });
  const inventoryItems = inventoryData?.items || [];

  // Listen for real-time WebSocket events
  useEffect(() => {
    if (!socket) return;

    const handleCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-requests'] });
    };

    const handleUpdated = (payload: any) => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dropdown'] });
      // Kitchen Staff who requested sees update toast
      if (user?.role?.name === 'Kitchen Staff') {
        toast.success(payload.message || 'Ingredient request updated');
      }
    };

    socket.on('ingredientRequest:created', handleCreated);
    socket.on('ingredientRequest:updated', handleUpdated);

    return () => {
      socket.off('ingredientRequest:created', handleCreated);
      socket.off('ingredientRequest:updated', handleUpdated);
    };
  }, [socket, queryClient, user]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: () =>
      ingredientRequestsApi.create({
        inventoryId: selectedInventoryId,
        quantity: parseFloat(quantity),
        priority,
        notes,
        branchId: user?.branch?.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-requests'] });
      toast.success('Ingredient request submitted to store!');
      setIsCreateModalOpen(false);
      setSelectedInventoryId('');
      setQuantity('');
      setPriority('NORMAL');
      setNotes('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    },
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => ingredientRequestsApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-requests'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dropdown'] });
      toast.success('Request approved! Stock deducted and issued to kitchen.');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve request');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      ingredientRequestsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-requests'] });
      toast.success('Request rejected');
      setRejectingRequest(null);
      setRejectionReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject request');
    },
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => ingredientRequestsApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-requests'] });
      toast.success('Request cancelled');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    },
  });

  const selectedItemObject = inventoryItems.find((i: any) => i.id === selectedInventoryId);

  // Stats calculation
  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  const filteredRequests = requests.filter((r) => {
    if (activeTab === 'pending') return r.status === 'PENDING';
    if (activeTab === 'approved') return r.status === 'APPROVED';
    if (activeTab === 'rejected') return r.status === 'REJECTED' || r.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Ingredient Requests</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Kitchen raw stock requisitions & store fulfillment
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: "+ Request Ingredients" */}
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-2 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Request Ingredients</span>
        </Button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Awaiting Store Approval</p>
              <p className="text-2xl font-black text-amber-900 dark:text-amber-300 mt-1">{pendingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-700 dark:text-[#00e676] uppercase tracking-wider">Approved & Issued</p>
              <p className="text-2xl font-black text-emerald-900 dark:text-[#00e676] mt-1">{approvedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-[#00e676]">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Rejected / Cancelled</p>
              <p className="text-2xl font-black text-rose-900 dark:text-rose-300 mt-1">{rejectedCount}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-700 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
        </Card>

        <Card className="p-4 border-blue-200 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">Total Requisitions</p>
              <p className="text-2xl font-black text-blue-900 dark:text-blue-300 mt-1">{requests.length}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center text-blue-700 dark:text-blue-400">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-[#143225] pb-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219]'
          }`}
        >
          <span>Pending Approval</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'pending' ? 'bg-white text-amber-700' : 'bg-gray-200 dark:bg-[#143225] text-gray-700 dark:text-gray-300'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219]'
          }`}
        >
          <span>Issued / Approved</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'approved' ? 'bg-white text-emerald-700' : 'bg-gray-200 dark:bg-[#143225] text-gray-700 dark:text-gray-300'
            }`}
          >
            {approvedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-rose-600 text-white shadow-2xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219]'
          }`}
        >
          <span>Rejected / Cancelled</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              activeTab === 'rejected' ? 'bg-white text-rose-700' : 'bg-gray-200 dark:bg-[#143225] text-gray-700 dark:text-gray-300'
            }`}
          >
            {rejectedCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-gray-900 dark:bg-[#143225] text-white shadow-2xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219]'
          }`}
        >
          All Requests ({requests.length})
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-[#091a13] rounded-xl border border-gray-200 dark:border-[#143225] shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500 font-medium">Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16">
            <Boxes className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">No ingredient requests</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Click &quot;Request Ingredients&quot; above to request raw ingredients from the store.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-[#143225] text-left">
              <thead className="bg-gray-50 dark:bg-[#071a12] border-b border-gray-200 dark:border-[#143225]">
                <tr>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Request #
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Requested By
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Ingredient & Quantity
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Kitchen Note
                  </th>
                  <th className="px-4 py-3.5 text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#143225] bg-white dark:bg-[#091a13]">
                {filteredRequests.map((req) => {
                  const itemInStore = inventoryItems.find((i: any) => i.id === req.inventoryId);
                  const availableStock = itemInStore ? itemInStore.quantity : null;
                  const isSufficient = availableStock != null ? availableStock >= req.quantity : true;

                  return (
                    <tr key={req.id} className="hover:bg-gray-50/80 dark:hover:bg-[#0c2f21]/30 transition-colors">
                      {/* Request # & Date */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-mono text-xs font-bold text-gray-900 dark:text-white">{req.requestNumber}</div>
                        <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(req.createdAt), 'MMM dd, HH:mm')}</span>
                        </div>
                      </td>

                      {/* Requested By */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-400">
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 dark:text-white">{req.requestedByName}</div>
                            <div className="text-[11px] text-gray-400 dark:text-gray-500">Kitchen Staff</div>
                          </div>
                        </div>
                      </td>

                      {/* Ingredient & Quantity */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                            {req.quantity} {req.unit}
                          </span>
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-[#0c2219] px-2 py-0.5 rounded border border-gray-200 dark:border-[#143225]">
                            {req.inventoryName}
                          </span>
                        </div>
                        {availableStock != null && req.status === 'PENDING' && (
                          <div
                            className={`text-[11px] font-medium mt-1 ${
                              isSufficient ? 'text-emerald-600 dark:text-[#00e676]' : 'text-rose-600 dark:text-rose-400 font-bold'
                            }`}
                          >
                            Store Stock: {availableStock} {req.unit} {isSufficient ? '(Available)' : '(Low Stock!)'}
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {req.priority === 'URGENT' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-black bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 animate-pulse border border-rose-300 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3" />
                            URGENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 dark:bg-[#0c2219] text-gray-600 dark:text-gray-300 border border-transparent dark:border-[#143225]">
                            Normal Prep
                          </span>
                        )}
                      </td>

                      {/* Notes / Reason */}
                      <td className="px-4 py-3.5 max-w-xs">
                        {req.notes ? (
                          <p className="text-xs text-gray-700 dark:text-gray-300 italic truncate">{req.notes}</p>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                        )}
                        {req.rejectionReason && (
                          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-0.5">
                            Reason: {req.rejectionReason}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {req.status === 'PENDING' && (
                          <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 font-bold text-xs">
                            Pending Store
                          </Badge>
                        )}
                        {req.status === 'APPROVED' && (
                          <div className="space-y-0.5">
                            <Badge className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 font-bold text-xs">
                              Issued to Kitchen
                            </Badge>
                            {req.processedByName && (
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">By {req.processedByName}</p>
                            )}
                          </div>
                        )}
                        {req.status === 'REJECTED' && (
                          <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 font-bold text-xs">
                            Rejected
                          </Badge>
                        )}
                        {req.status === 'CANCELLED' && (
                          <Badge className="bg-gray-100 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#143225] font-medium text-xs">
                            Cancelled
                          </Badge>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        {req.status === 'PENDING' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Manager Actions: Approve & Issue / Reject */}
                            {isManagerOrOwner && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveMutation.mutate(req.id)}
                                  disabled={approveMutation.isPending}
                                  className="h-8 px-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                                  title="Approve & automatically deduct from inventory"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Issue</span>
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setRejectingRequest(req)}
                                  className="h-8 px-2 text-xs font-semibold text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                                  title="Reject request"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}

                            {/* Kitchen Staff Actions: Cancel */}
                            {isKitchenStaff && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelMutation.mutate(req.id)}
                                disabled={cancelMutation.isPending}
                                className="h-8 px-2.5 text-xs text-gray-600 dark:text-gray-300 border-gray-300 dark:border-[#143225] hover:bg-gray-100 dark:hover:bg-[#0c2219] cursor-pointer"
                              >
                                Cancel
                              </Button>
                            )}
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

      {/* "+ Request Ingredients" Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225] text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
              <PackagePlus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span>Request Ingredients from Store</span>
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Select the raw stock item needed for kitchen preparation. Store managers will be alerted immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            {/* Inventory Item Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Select Ingredient <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedInventoryId}
                onChange={(e) => setSelectedInventoryId(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-[#071a12] border border-gray-300 dark:border-[#143225] rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="">-- Choose an ingredient from store --</option>
                {inventoryItems.map((item: any) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit} in store) {item.category ? `• ${item.category}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Unit */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                Quantity Needed <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="e.g. 5"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="flex-1 h-10 px-3 bg-white dark:bg-[#071a12] border border-gray-300 dark:border-[#143225] rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                />
                <span className="h-10 px-3 bg-gray-100 dark:bg-[#0c2219] border border-gray-300 dark:border-[#143225] rounded-lg flex items-center justify-center text-xs font-bold text-gray-700 dark:text-gray-300 min-w-16">
                  {selectedItemObject?.unit || 'Unit'}
                </span>
              </div>
              {selectedItemObject && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Currently available in store: <strong className="text-gray-800 dark:text-gray-200">{selectedItemObject.quantity} {selectedItemObject.unit}</strong>
                </p>
              )}
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Priority Level</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority('NORMAL')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                    priority === 'NORMAL'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-200 ring-2 ring-amber-400/40'
                      : 'bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c2219]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <div>
                    <div>Normal Prep</div>
                    <div className="text-[10px] font-normal text-gray-500 dark:text-gray-400">For upcoming shift / prep</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPriority('URGENT')}
                  className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                    priority === 'URGENT'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 ring-2 ring-rose-400/40'
                      : 'bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c2219]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <div>
                    <div>Urgent / Stalled</div>
                    <div className="text-[10px] font-normal text-rose-500 dark:text-rose-400">Active tickets waiting</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Kitchen Notes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">Notes / Reason (Optional)</label>
              <textarea
                rows={2}
                placeholder="e.g. For dinner rush marination, ran out on the line"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-[#071a12] border border-gray-300 dark:border-[#143225] rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 border-t border-gray-200 dark:border-[#143225] flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                className="border-gray-300 dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219] cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!selectedInventoryId || !quantity || createMutation.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5 cursor-pointer"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Request</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Reason Modal */}
      <Dialog open={!!rejectingRequest} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225] text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 dark:text-white">
              Reject Ingredient Request
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Provide a reason to the kitchen team why this ingredient cannot be issued.
            </DialogDescription>
          </DialogHeader>

          {rejectingRequest && (
            <div className="space-y-3 mt-2">
              <div className="p-2.5 rounded bg-gray-50 dark:bg-[#071a12] border border-gray-200 dark:border-[#143225] text-xs text-gray-800 dark:text-gray-200">
                Request: <strong>{rejectingRequest.quantity} {rejectingRequest.unit} of {rejectingRequest.inventoryName}</strong>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-1">
                  Reason for Rejection
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Out of stock in main store, replacement arriving at 4 PM"
                  className="w-full p-2 bg-white dark:bg-[#071a12] border border-gray-300 dark:border-[#143225] rounded-lg text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200 dark:border-[#143225]">
                <Button variant="outline" size="sm" onClick={() => setRejectingRequest(null)} className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219] cursor-pointer">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    rejectMutation.mutate({
                      id: rejectingRequest.id,
                      reason: rejectionReason,
                    })
                  }
                  disabled={rejectMutation.isPending}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Confirm Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

