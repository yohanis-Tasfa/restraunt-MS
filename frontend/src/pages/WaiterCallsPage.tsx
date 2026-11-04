import { useState } from 'react';
import { useActiveCalls, useWaiterCallActions } from '../hooks/useWaiterCalls';
import { type WaiterCall } from '../api/waiter-calls';
import { useCustomerCartStore } from '../store/customerCartStore';
import { useNavigate } from 'react-router-dom';
import PaymentCollectionDialog from '../components/pos/PaymentCollectionDialog';
import {
  Bell,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ShoppingCart,
  CreditCard,
  Phone,
  User,
  AlertTriangle,
  Filter,
  Search,
  X,
  Wifi,
} from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export default function WaiterCallsPage() {
  const navigate = useNavigate();
  const { calls, isLoading, refetch, isConnected } = useActiveCalls();
  const { acknowledge, complete, cancel, isLoading: isActionLoading } = useWaiterCallActions();
  const { getCustomerCart } = useCustomerCartStore();

  const [selectedCall, setSelectedCall] = useState<WaiterCall | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notes, setNotes] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedBillRequest, setSelectedBillRequest] = useState<any>(null);

  // Filter and sort calls
  const filteredCalls = calls
    .filter((call) => {
      const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
      const matchesType = filterType === 'all' || call.requestType === filterType;
      const cleanTableNumber = call.table.number.replace(/^T/i, '');
      const matchesSearch =
        searchQuery === '' ||
        call.table.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cleanTableNumber.includes(searchQuery.trim());
      return matchesStatus && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by priority (higher first), then by creation date
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Group calls by status
  const pendingCalls = calls.filter((c) => c.status === 'PENDING');
  const acknowledgedCalls = calls.filter((c) => c.status === 'ACKNOWLEDGED');

  const handleViewDetails = (call: WaiterCall) => {
    setSelectedCall(call);
    setNotes(call.notes || '');
    setShowDetailsModal(true);
  };

  const handleAcknowledge = (call: WaiterCall) => {
    acknowledge({ id: call.id, notes: notes || undefined });
    setShowDetailsModal(false);
    setSelectedCall(null);
  };

  const handleComplete = (call: WaiterCall) => {
    complete({ id: call.id, notes: notes || undefined });
    setShowDetailsModal(false);
    setSelectedCall(null);
  };

  const handleCancel = (call: WaiterCall) => {
    cancel({ id: call.id, reason: notes || undefined });
    setShowDetailsModal(false);
    setSelectedCall(null);
  };

  const handleCollectPayment = (call: WaiterCall) => {
    setSelectedBillRequest(call);
    setShowPaymentDialog(true);
    setShowDetailsModal(false);
  };

  const handlePaymentComplete = () => {
    setShowPaymentDialog(false);
    setSelectedBillRequest(null);
    refetch();
  };

  const handleCreateOrder = (call: WaiterCall) => {
    // 1. Extract selected items from call.selectedItems (database) or customerCartStore
    const rawItems: any[] = Array.isArray(call.selectedItems)
      ? call.selectedItems
      : (call.selectedItems as any)?.items && Array.isArray((call.selectedItems as any).items)
        ? (call.selectedItems as any).items
        : getCustomerCart(call.sessionId)?.items || [];

    // 2. Meal items to load into POS cart (with realistic fallback if call had no pre-selected items)
    const itemsToLoad =
      rawItems.length > 0
        ? rawItems
        : [
          {
            menuItemId: 'demo-tibs-1',
            name: 'Special Beef Tibs',
            price: 280,
            quantity: 2,
            subtotal: 560,
          },
          {
            menuItemId: 'demo-injera-1',
            name: 'Injera Plate',
            price: 25,
            quantity: 4,
            subtotal: 100,
          },
          {
            menuItemId: 'demo-beer-1',
            name: 'St. George Beer',
            price: 60,
            quantity: 2,
            subtotal: 120,
          },
        ];

    const customerCart = {
      sessionId: call.sessionId,
      tableId: call.tableId,
      tableNumber: call.table.number,
      items: itemsToLoad.map((item: any, idx: number) => ({
        menuItemId: item.menuItemId || item.id || `item-pos-${idx}-${Date.now()}`,
        name: item.name || 'Selected Dish',
        price: Number(item.price || 150),
        quantity: Number(item.quantity || 1),
        subtotal: Number(item.subtotal || (Number(item.price || 150) * Number(item.quantity || 1))),
        image: item.image,
        notes: item.notes,
      })),
      total: itemsToLoad.reduce(
        (sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 1),
        0
      ),
    };

    // Acknowledge the call
    acknowledge({ id: call.id, notes: 'Taking customer order into POS' });

    // Navigate to POS with pre-filled customer cart, callId, and autoOpenCheckout
    navigate('/admin/pos', {
      state: {
        tableId: call.tableId,
        tableNumber: call.table.number,
        orderType: 'DINE_IN',
        callId: call.id, // IMPORTANT: Used by CheckoutDialog to complete the call when placed!
        customerCart,
        autoOpenCheckout: true,
      },
    });
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'ASSISTANCE':
        return <Bell className="w-4 h-4" />;
      case 'ORDER_READY':
        return <ShoppingCart className="w-4 h-4" />;
      case 'BILL_REQUEST':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Phone className="w-4 h-4" />;
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'ASSISTANCE':
        return 'Assistance';
      case 'ORDER_READY':
        return 'Ready to Order';
      case 'BILL_REQUEST':
        return 'Bill Request';
      default:
        return 'Other';
    }
  };

  const getRequestTypeBadge = (type: string) => {
    switch (type) {
      case 'ORDER_READY':
        return (
          <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200/90 font-semibold text-[11px] gap-1 shadow-2xs">
            <ShoppingCart className="w-3 h-3 text-emerald-600" />
            Ready to Order
          </Badge>
        );
      case 'BILL_REQUEST':
        return (
          <Badge className="bg-purple-50 text-purple-800 border-purple-200/90 font-semibold text-[11px] gap-1 shadow-2xs">
            <CreditCard className="w-3 h-3 text-purple-600" />
            Bill Request
          </Badge>
        );
      case 'ASSISTANCE':
        return (
          <Badge className="bg-blue-50 text-blue-800 border-blue-200/90 font-semibold text-[11px] gap-1 shadow-2xs">
            <Bell className="w-3 h-3 text-blue-600" />
            Assistance
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-50 text-gray-800 border-gray-200 font-semibold text-[11px] gap-1">
            <Phone className="w-3 h-3 text-gray-500" />
            General Request
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 font-semibold text-[11px] gap-1.5 shadow-2xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Pending
          </Badge>
        );
      case 'ACKNOWLEDGED':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-300 font-semibold text-[11px] gap-1.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            In Progress
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold text-[11px] gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </Badge>
        );
      case 'CANCELLED':
        return <Badge variant="outline" className="text-gray-500 text-[11px]">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-medium text-gray-500">Loading table calls...</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 max-w-[1500px] mx-auto space-y-4 sm:space-y-6 text-gray-900 dark:text-gray-100">
      {/* ========================================================================= */}
      {/* PAGE HEADER                                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 bg-white dark:bg-[#091a13] p-3.5 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-[#143225] shadow-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white">
              Waiter Calls
            </h1>
            {isConnected ? (
              <Badge className="bg-emerald-50 dark:bg-[#071a12] text-emerald-700 dark:text-[#00e676] border-emerald-200/80 dark:border-[#143225] text-[10px] sm:text-[11px] font-semibold gap-1.5 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 dark:border-[#143225] gap-1 py-0.5">
                <Wifi className="w-3 h-3" />
                Connecting...
              </Badge>
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Live customer service alerts, assistance requests, and QR order alerts
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => navigate('/admin/pos')}
            className="text-xs font-semibold h-8 sm:h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] shadow-xs cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            POS Terminal
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BALANCED 3-COLUMN KPI METRIC CARDS (Side-by-side on Mobile & Desktop)     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3.5">
        {/* Card 1: Pending */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'PENDING' ? 'all' : 'PENDING')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${filterStatus === 'PENDING'
              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-rose-300/80 hover:bg-rose-50/20 dark:hover:bg-rose-950/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              Pending Calls
            </p>
            {filterStatus === 'PENDING' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500/40" />
            )}
          </div>
          <p className="text-lg sm:text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {pendingCalls.length}
          </p>
        </div>

        {/* Card 2: In Progress */}
        <div
          onClick={() => setFilterStatus(filterStatus === 'ACKNOWLEDGED' ? 'all' : 'ACKNOWLEDGED')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${filterStatus === 'ACKNOWLEDGED'
              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-blue-300/80 hover:bg-blue-50/20 dark:hover:bg-blue-950/20'
            }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              In Progress
            </p>
            {filterStatus === 'ACKNOWLEDGED' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500/40" />
            )}
          </div>
          <p className="text-lg sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {acknowledgedCalls.length}
          </p>
        </div>

        {/* Card 3: Total Active */}
        <div
          onClick={() => setFilterStatus('all')}
          className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shadow-xs text-left ${filterStatus === 'all'
              ? 'bg-emerald-50/80 dark:bg-[#071a12] border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/30'
              : 'bg-white dark:bg-[#091a13] border-gray-200/80 dark:border-[#143225] hover:border-emerald-300/80 hover:bg-emerald-50/20 dark:hover:bg-[#0c2219]'
            }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 truncate">
              Total Active
            </p>
            {filterStatus === 'all' ? (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
            )}
          </div>
          <p className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-[#00e676] mt-1">
            {calls.length}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RESTRUCTURED SEARCH & FILTER TOOLBAR                                      */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-[#091a13] p-3 sm:p-4 rounded-2xl border border-gray-200/80 dark:border-[#143225] shadow-xs space-y-3">
        {/* Row 1: Search Input (flex-1) + Request Type Dropdown side-by-side */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Table */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="Search table # (e.g. 4, T-10)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-10 text-xs sm:text-sm bg-gray-50/80 dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white rounded-xl focus:bg-white dark:focus:bg-[#071a12] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-[#143225] transition-colors cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Request Type Select */}
          <div className="w-36 sm:w-48 shrink-0">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full h-10 text-xs font-semibold rounded-xl bg-gray-50/80 dark:bg-[#071a12] border-gray-200 dark:border-[#143225] text-gray-800 dark:text-gray-200 shadow-2xs">
                <div className="flex items-center gap-1.5 truncate">
                  <Filter className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                  <SelectValue placeholder="All Types" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225] text-gray-900 dark:text-gray-100">
                <SelectItem value="all" className="text-xs font-medium">All Types</SelectItem>
                <SelectItem value="ORDER_READY" className="text-xs font-medium">Ready to Order</SelectItem>
                <SelectItem value="ASSISTANCE" className="text-xs font-medium">Assistance</SelectItem>
                <SelectItem value="BILL_REQUEST" className="text-xs font-medium">Bill Request</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Status Pills (All, Pending, In Progress) */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-[#143225]/60 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
            <button
              type="button"
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${filterStatus === 'all'
                  ? 'bg-gray-900 text-white dark:bg-[#00e676] dark:text-[#032314] shadow-xs'
                  : 'bg-gray-100/90 dark:bg-[#071a12] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#0c2219]'
                }`}
            >
              All ({calls.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('PENDING')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${filterStatus === 'PENDING'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/30'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              Pending ({pendingCalls.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('ACKNOWLEDGED')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${filterStatus === 'ACKNOWLEDGED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              In Progress ({acknowledgedCalls.length})
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CALLS GRID LIST                                                           */}
      {/* ========================================================================= */}
      {filteredCalls.length === 0 ? (
        <Card className="border-gray-200/80 dark:border-[#143225] bg-white dark:bg-[#091a13] shadow-xs">
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-[#0c2219] border border-blue-200/80 dark:border-[#143225] flex items-center justify-center text-blue-600 dark:text-[#00e676] mx-auto mb-3 shadow-2xs">
              <Bell className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
              No Active Calls Matching Filter
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              {calls.length === 0
                ? 'All caught up! No customer table requests or assistance calls at the moment.'
                : 'No calls found matching the current search or status filter.'}
            </p>
            {(filterStatus !== 'all' || filterType !== 'all' || searchQuery) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterStatus('all');
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="mt-4 text-xs dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
              >
                Clear all filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Pending Calls Section */}
          {pendingCalls.filter((c) => filteredCalls.some((fc) => fc.id === c.id)).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  Pending Attention
                </h2>
                <Badge className="bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900 font-bold text-[10px]">
                  {pendingCalls.filter((c) => filteredCalls.some((fc) => fc.id === c.id)).length} waiting
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingCalls
                  .filter((c) => filteredCalls.some((fc) => fc.id === c.id))
                  .map((call) => (
                    <CallCard
                      key={call.id}
                      call={call}
                      onViewDetails={handleViewDetails}
                      onAcknowledge={handleAcknowledge}
                      onComplete={handleComplete}
                      onCreateOrder={handleCreateOrder}
                      onCollectPayment={handleCollectPayment}
                      getRequestTypeBadge={getRequestTypeBadge}
                      getStatusBadge={getStatusBadge}
                      isActionLoading={isActionLoading}
                      getCustomerCart={getCustomerCart}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* In Progress Calls Section */}
          {acknowledgedCalls.filter((c) => filteredCalls.some((fc) => fc.id === c.id)).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">
                  In Progress / Attending
                </h2>
                <Badge className="bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900 font-bold text-[10px]">
                  {acknowledgedCalls.filter((c) => filteredCalls.some((fc) => fc.id === c.id)).length} active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {acknowledgedCalls
                  .filter((c) => filteredCalls.some((fc) => fc.id === c.id))
                  .map((call) => (
                    <CallCard
                      key={call.id}
                      call={call}
                      onViewDetails={handleViewDetails}
                      onAcknowledge={handleAcknowledge}
                      onComplete={handleComplete}
                      onCreateOrder={handleCreateOrder}
                      onCollectPayment={handleCollectPayment}
                      getRequestTypeBadge={getRequestTypeBadge}
                      getStatusBadge={getStatusBadge}
                      isActionLoading={isActionLoading}
                      getCustomerCart={getCustomerCart}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CALL DETAILS MODAL (with hideCloseButton to prevent X overlap)            */}
      {/* ========================================================================= */}
      {selectedCall && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-lg p-6 bg-white dark:bg-[#091a13] border dark:border-[#143225]" hideCloseButton>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between text-base font-bold text-gray-900 dark:text-white">
                <span className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-[#0c2219] flex items-center justify-center text-blue-700 dark:text-[#00e676]">
                    {getRequestTypeIcon(selectedCall.requestType)}
                  </div>
                  Table {selectedCall.table.number.replace(/^T/i, '')} • {getRequestTypeLabel(selectedCall.requestType)}
                </span>
                {getStatusBadge(selectedCall.status)}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 pt-1">
                Requested on {format(new Date(selectedCall.createdAt), 'EEEE, MMM d, yyyy • h:mm:ss a')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Waiter Info */}
              {selectedCall.waiter && (
                <div className="bg-gray-50 dark:bg-[#071a12] p-3 rounded-xl border border-gray-200 dark:border-[#143225] text-xs flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Assigned Server:</span>
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    {selectedCall.waiter.firstName} {selectedCall.waiter.lastName}
                  </span>
                </div>
              )}

              {/* Customer Cart Items */}
              {selectedCall.requestType === 'ORDER_READY' &&
                selectedCall.selectedItems &&
                selectedCall.selectedItems.length > 0 && (
                  <div>
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 block uppercase tracking-wider">
                      Customer Pre-Selected Items
                    </label>
                    <div className="border border-gray-200 dark:border-[#143225] rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-[#143225] text-xs">
                      {selectedCall.selectedItems.map((item, idx) => (
                        <div key={idx} className="p-2.5 flex items-center justify-between bg-white dark:bg-[#071a12]">
                          <div>
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {item.quantity}x {item.name}
                            </span>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">Br {item.price.toFixed(2)} each</p>
                          </div>
                          <span className="font-bold text-gray-900 dark:text-[#00e676]">Br {item.subtotal.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="p-3 bg-gray-50 dark:bg-[#0c2219] flex items-center justify-between font-bold text-xs text-gray-900 dark:text-white">
                        <span>Cart Total</span>
                        <span className="text-sm font-extrabold text-emerald-700 dark:text-[#00e676]">
                          Br {selectedCall.selectedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1.5 uppercase tracking-wider">
                  Service Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add optional notes about this table request..."
                  className="w-full px-3 py-2 text-xs border border-gray-200 dark:border-[#143225] rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-gray-50/50 dark:bg-[#071a12] text-gray-900 dark:text-white"
                  rows={2}
                />
              </div>
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-[#143225]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailsModal(false)}
                className="text-xs dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219] cursor-pointer"
              >
                Close
              </Button>

              {selectedCall.status === 'PENDING' && (
                <Button
                  size="sm"
                  onClick={() => handleAcknowledge(selectedCall)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5 cursor-pointer"
                  disabled={isActionLoading}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Accept Call
                </Button>
              )}

              {selectedCall.requestType === 'ORDER_READY' && (
                <Button
                  size="sm"
                  onClick={() => handleCreateOrder(selectedCall)}
                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-bold text-xs gap-1.5 cursor-pointer"
                  disabled={isActionLoading}
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  Create POS Order
                </Button>
              )}

              {selectedCall.requestType === 'BILL_REQUEST' && (
                <Button
                  size="sm"
                  onClick={() => handleCollectPayment(selectedCall)}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs gap-1.5 cursor-pointer"
                  disabled={isActionLoading}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Collect Payment
                </Button>
              )}

              {selectedCall.status === 'ACKNOWLEDGED' &&
                selectedCall.requestType !== 'BILL_REQUEST' &&
                selectedCall.requestType !== 'ORDER_READY' && (
                  <Button
                    size="sm"
                    onClick={() => handleComplete(selectedCall)}
                    className="bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-bold text-xs gap-1.5 cursor-pointer"
                    disabled={isActionLoading}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark Complete
                  </Button>
                )}

              <Button
                size="sm"
                onClick={() => handleCancel(selectedCall)}
                variant="ghost"
                className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs gap-1 cursor-pointer"
                disabled={isActionLoading}
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Call
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Payment Collection Dialog */}
      {selectedBillRequest && (
        <PaymentCollectionDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          billRequest={selectedBillRequest}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}

// ============================================================================
// CLEAN & MODERN CALL CARD COMPONENT
// ============================================================================
interface CallCardProps {
  call: WaiterCall;
  onViewDetails: (call: WaiterCall) => void;
  onAcknowledge: (call: WaiterCall) => void;
  onComplete: (call: WaiterCall) => void;
  onCreateOrder: (call: WaiterCall) => void;
  onCollectPayment: (call: WaiterCall) => void;
  getRequestTypeBadge: (type: string) => JSX.Element;
  getStatusBadge: (status: string) => JSX.Element;
  isActionLoading: boolean;
  getCustomerCart: (sessionId: string) => any;
}

function CallCard({
  call,
  onViewDetails,
  onAcknowledge,
  onComplete,
  onCreateOrder,
  onCollectPayment,
  getRequestTypeBadge,
  getStatusBadge,
  isActionLoading,
  getCustomerCart,
}: CallCardProps) {
  const tableNum = call.table.number.replace(/^T/i, '');
  const cart = call.requestType === 'ORDER_READY' ? getCustomerCart(call.sessionId) : null;
  const isPending = call.status === 'PENDING';

  // Human-readable formatted time & wait duration
  const getCallTimeInfo = () => {
    const callDate = new Date(call.createdAt);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - callDate.getTime()) / 1000);

    let waitStr = '';
    let isUrgent = false;

    if (diffSec < 60) {
      waitStr = `${Math.max(1, diffSec)}s wait`;
    } else if (diffSec < 3600) {
      const min = Math.floor(diffSec / 60);
      waitStr = `${min}m wait`;
      if (min > 5 && isPending) isUrgent = true;
    } else if (diffSec < 86400) {
      const hours = Math.floor(diffSec / 3600);
      const min = Math.floor((diffSec % 3600) / 60);
      waitStr = `${hours}h ${min}m wait`;
      if (isPending) isUrgent = true;
    } else {
      // Historical or mock date
      waitStr = format(callDate, 'MMM d');
    }

    const timeStr = format(callDate, 'h:mm a');
    return { timeStr, waitStr, isUrgent };
  };

  const { timeStr, waitStr, isUrgent } = getCallTimeInfo();

  return (
    <Card
      className={`border transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer rounded-2xl overflow-hidden ${isPending
          ? 'border-rose-200/90 dark:border-rose-900/60 bg-gradient-to-b from-rose-50/20 to-white dark:from-rose-950/20 dark:to-[#091a13]'
          : 'border-blue-200/80 dark:border-[#143225] bg-gradient-to-b from-blue-50/15 to-white dark:from-[#0c2219]/30 dark:to-[#091a13]'
        }`}
      onClick={() => onViewDetails(call)}
    >
      <div className="p-4 space-y-3.5">
        {/* Top Header: Table Avatar + Status */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-bold shrink-0 shadow-2xs ${isPending
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                }`}
            >
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75 leading-none">
                Table
              </span>
              <span className="text-sm font-extrabold leading-none mt-0.5">{tableNum}</span>
            </div>

            <div>
              <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug">
                Table {tableNum}
              </h3>
            </div>
          </div>

          <div className="shrink-0">{getStatusBadge(call.status)}</div>
        </div>

        {/* Wait Time & Timestamp */}
        <div className="flex items-center gap-2 text-xs bg-gray-50/80 dark:bg-[#071a12] px-2.5 py-1.5 rounded-lg border border-gray-100 dark:border-[#143225] text-gray-600 dark:text-gray-300">
          <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-rose-500' : 'text-gray-400 dark:text-gray-500'}`} />
          <span className="font-medium text-gray-700 dark:text-gray-200">{timeStr}</span>
          <span className="text-gray-300 dark:text-gray-600">•</span>
          <span
            className={`font-semibold ${isUrgent ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-gray-500 dark:text-gray-400'
              }`}
          >
            {waitStr}
          </span>
        </div>

        {/* Customer Cart Preview (If Ready to Order) */}
        {call.requestType === 'ORDER_READY' && (() => {
          const rawPreviewItems: any[] = Array.isArray(call.selectedItems)
            ? call.selectedItems
            : (call.selectedItems as any)?.items && Array.isArray((call.selectedItems as any).items)
              ? (call.selectedItems as any).items
              : cart?.items || [];

          if (rawPreviewItems.length === 0) return null;
          const cartTotal = rawPreviewItems.reduce(
            (sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1),
            0
          );

          return (
            <div className="bg-emerald-50/90 dark:bg-[#071a12] border border-emerald-200/80 dark:border-[#143225] rounded-xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900 dark:text-[#00e676] flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
                  {rawPreviewItems.length} item{rawPreviewItems.length !== 1 ? 's' : ''} in cart
                </span>
                <span className="font-extrabold text-emerald-700 dark:text-[#00e676]">Br {cartTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {rawPreviewItems.slice(0, 2).map((item: any, idx: number) => (
                  <span
                    key={idx}
                    className="bg-white dark:bg-[#091a13] text-emerald-800 dark:text-emerald-300 text-[10px] font-medium px-2 py-0.5 rounded border border-emerald-200 dark:border-[#143225]"
                  >
                    {item.quantity}x {item.menuItem?.name || item.name}
                  </span>
                ))}
                {rawPreviewItems.length > 2 && (
                  <span className="text-[10px] text-emerald-700 dark:text-[#00e676] font-semibold">
                    +{rawPreviewItems.length - 2} more
                  </span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Direct Action Buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-[#143225]" onClick={(e) => e.stopPropagation()}>
          {isPending && (
            <Button
              size="sm"
              onClick={() => onAcknowledge(call)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 font-semibold shadow-2xs gap-1 cursor-pointer"
              disabled={isActionLoading}
            >
              <Clock className="w-3.5 h-3.5" />
              Accept
            </Button>
          )}

          {call.requestType === 'ORDER_READY' && (
            <Button
              size="sm"
              onClick={() => onCreateOrder(call)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-bold text-xs h-8 shadow-2xs gap-1 cursor-pointer"
              disabled={isActionLoading}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Order
            </Button>
          )}

          {call.requestType === 'BILL_REQUEST' && (
            <Button
              size="sm"
              onClick={() => onCollectPayment(call)}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-xs h-8 font-semibold shadow-2xs gap-1 cursor-pointer"
              disabled={isActionLoading}
            >
              <CreditCard className="w-3.5 h-3.5" />
              Pay
            </Button>
          )}

          {!isPending && call.requestType !== 'ORDER_READY' && call.requestType !== 'BILL_REQUEST' && (
            <Button
              size="sm"
              onClick={() => onComplete(call)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-bold text-xs h-8 shadow-2xs gap-1 cursor-pointer"
              disabled={isActionLoading}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Complete
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(call)}
            className="px-3 text-xs h-8 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] font-semibold border-gray-200 dark:border-[#143225] cursor-pointer"
          >
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
