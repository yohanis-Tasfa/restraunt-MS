import { useState } from 'react';
import { useActiveCalls, useWaiterCallActions } from '../hooks/useWaiterCalls';
import { type WaiterCall } from '../api/waiter-calls';
import { useCustomerCartStore } from '../store/customerCartStore';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingCart,
  CreditCard,
  Phone,
  User,
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
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
  const { calls, isLoading, refetch } = useActiveCalls();
  const { acknowledge, complete, cancel, isLoading: isActionLoading } = useWaiterCallActions();
  const { getCustomerCart } = useCustomerCartStore();

  const [selectedCall, setSelectedCall] = useState<WaiterCall | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [notes, setNotes] = useState('');

  // Filter and sort calls
  const filteredCalls = calls
    .filter((call) => {
      const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
      const matchesType = filterType === 'all' || call.requestType === filterType;
      const matchesSearch =
        searchQuery === '' ||
        call.table.number.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesType && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by priority (higher first), then by creation date
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Group calls by status
  const pendingCalls = filteredCalls.filter((c) => c.status === 'PENDING');
  const acknowledgedCalls = filteredCalls.filter((c) => c.status === 'ACKNOWLEDGED');

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

  const handleCreateOrder = (call: WaiterCall) => {
    // Get customer cart from store
    const cart = getCustomerCart(call.sessionId);
    
    if (cart && cart.items.length > 0) {
      // Navigate to POS with pre-filled cart
      navigate('/pos', { 
        state: { 
          tableId: call.tableId,
          tableNumber: call.table.number,
          customerCart: cart,
          sessionId: call.sessionId,
        } 
      });
      
      // Mark call as acknowledged
      acknowledge({ id: call.id, notes: 'Creating order from customer cart' });
    } else {
      // No cart items, just go to POS
      navigate('/pos', { 
        state: { 
          tableId: call.tableId,
          tableNumber: call.table.number,
        } 
      });
      acknowledge({ id: call.id });
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'ASSISTANCE':
        return <Bell className="w-5 h-5" />;
      case 'ORDER_READY':
        return <ShoppingCart className="w-5 h-5" />;
      case 'BILL_REQUEST':
        return <CreditCard className="w-5 h-5" />;
      default:
        return <Phone className="w-5 h-5" />;
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

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'ASSISTANCE':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'ORDER_READY':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'BILL_REQUEST':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="destructive">Pending</Badge>;
      case 'ACKNOWLEDGED':
        return <Badge className="bg-blue-500">In Progress</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleString();
  };

  const getWaitTime = (call: WaiterCall) => {
    const start = new Date(call.createdAt);
    const now = new Date();
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000 / 60); // minutes
    return diff;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Bell className="w-8 h-8 text-blue-600" />
              Waiter Calls
            </h1>
            <p className="text-gray-600 mt-1">Manage customer requests and notifications</p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 border-l-4 border-l-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Calls</p>
                <p className="text-3xl font-bold text-gray-900">{pendingCalls.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{acknowledgedCalls.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </Card>

          <Card className="p-4 border-l-4 border-l-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Active</p>
                <p className="text-3xl font-bold text-gray-900">{calls.length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by table number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="ACKNOWLEDGED">In Progress</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Request Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="ORDER_READY">Ready to Order</SelectItem>
              <SelectItem value="ASSISTANCE">Assistance</SelectItem>
              <SelectItem value="BILL_REQUEST">Bill Request</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calls List */}
      {filteredCalls.length === 0 ? (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Calls</h3>
          <p className="text-gray-600">
            {calls.length === 0
              ? 'All caught up! No customer calls at the moment.'
              : 'No calls match your filters.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Pending Calls Section */}
          {pendingCalls.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Pending Calls ({pendingCalls.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingCalls.map((call) => (
                  <CallCard
                    key={call.id}
                    call={call}
                    onViewDetails={handleViewDetails}
                    onAcknowledge={handleAcknowledge}
                    onCreateOrder={handleCreateOrder}
                    getRequestTypeIcon={getRequestTypeIcon}
                    getRequestTypeLabel={getRequestTypeLabel}
                    getRequestTypeColor={getRequestTypeColor}
                    getStatusBadge={getStatusBadge}
                    formatTime={formatTime}
                    getWaitTime={getWaitTime}
                    isActionLoading={isActionLoading}
                    getCustomerCart={getCustomerCart}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Acknowledged Calls Section */}
          {acknowledgedCalls.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" />
                In Progress ({acknowledgedCalls.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {acknowledgedCalls.map((call) => (
                  <CallCard
                    key={call.id}
                    call={call}
                    onViewDetails={handleViewDetails}
                    onAcknowledge={handleAcknowledge}
                    onCreateOrder={handleCreateOrder}
                    getRequestTypeIcon={getRequestTypeIcon}
                    getRequestTypeLabel={getRequestTypeLabel}
                    getRequestTypeColor={getRequestTypeColor}
                    getStatusBadge={getStatusBadge}
                    formatTime={formatTime}
                    getWaitTime={getWaitTime}
                    isActionLoading={isActionLoading}
                    getCustomerCart={getCustomerCart}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call Details Modal */}
      {selectedCall && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {getRequestTypeIcon(selectedCall.requestType)}
                Table {selectedCall.table.number} - {getRequestTypeLabel(selectedCall.requestType)}
              </DialogTitle>
              <DialogDescription>
                Request received {formatTime(selectedCall.createdAt)} • Wait time:{' '}
                {getWaitTime(selectedCall)} minutes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Status */}
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <div className="mt-1">{getStatusBadge(selectedCall.status)}</div>
              </div>

              {/* Waiter Info */}
              {selectedCall.waiter && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Assigned Waiter</label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>
                      {selectedCall.waiter.firstName} {selectedCall.waiter.lastName}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Cart Items */}
              {selectedCall.requestType === 'ORDER_READY' && selectedCall.selectedItems && selectedCall.selectedItems.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Customer's Selected Items
                  </label>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Qty</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedCall.selectedItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-center">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 text-right">
                              {item.price.toFixed(2)} ETB
                            </td>
                            <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                              {item.subtotal.toFixed(2)} ETB
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                            Total:
                          </td>
                          <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                            {selectedCall.selectedItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)} ETB
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this call..."
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              {selectedCall.status === 'PENDING' && (
                <>
                  {selectedCall.requestType === 'ORDER_READY' && (
                    <Button
                      onClick={() => handleCreateOrder(selectedCall)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isActionLoading}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Create Order
                    </Button>
                  )}
                  <Button
                    onClick={() => handleAcknowledge(selectedCall)}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isActionLoading}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Acknowledge
                  </Button>
                </>
              )}
              {selectedCall.status === 'ACKNOWLEDGED' && (
                <Button
                  onClick={() => handleComplete(selectedCall)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isActionLoading}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              )}
              <Button
                onClick={() => handleCancel(selectedCall)}
                variant="destructive"
                disabled={isActionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Call Card Component
interface CallCardProps {
  call: WaiterCall;
  onViewDetails: (call: WaiterCall) => void;
  onAcknowledge: (call: WaiterCall) => void;
  onCreateOrder: (call: WaiterCall) => void;
  getRequestTypeIcon: (type: string) => JSX.Element;
  getRequestTypeLabel: (type: string) => string;
  getRequestTypeColor: (type: string) => string;
  getStatusBadge: (status: string) => JSX.Element;
  formatTime: (date: string) => string;
  getWaitTime: (call: WaiterCall) => number;
  isActionLoading: boolean;
  getCustomerCart: (sessionId: string) => any;
}

function CallCard({
  call,
  onViewDetails,
  onAcknowledge,
  onCreateOrder,
  getRequestTypeIcon,
  getRequestTypeLabel,
  getRequestTypeColor,
  getStatusBadge,
  formatTime,
  getWaitTime,
  isActionLoading,
  getCustomerCart,
}: CallCardProps) {
  const waitTime = getWaitTime(call);
  const isUrgent = waitTime > 5; // More than 5 minutes
  const cart = call.requestType === 'ORDER_READY' ? getCustomerCart(call.sessionId) : null;

  return (
    <Card
      className={`p-4 hover:shadow-lg transition-all cursor-pointer ${
        call.status === 'PENDING' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'
      } ${isUrgent && call.status === 'PENDING' ? 'animate-pulse' : ''}`}
      onClick={() => onViewDetails(call)}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getRequestTypeColor(call.requestType)}`}>
              {getRequestTypeIcon(call.requestType)}
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Table {call.table.number}</h3>
              <p className="text-sm text-gray-600">{getRequestTypeLabel(call.requestType)}</p>
            </div>
          </div>
          {getStatusBadge(call.status)}
        </div>

        {/* Wait Time */}
        <div className="flex items-center gap-2 text-sm">
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} />
          <span className={isUrgent ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {formatTime(call.createdAt)} • {waitTime}m wait
          </span>
        </div>

        {/* Cart Info */}
        {call.requestType === 'ORDER_READY' && cart && cart.items.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <ShoppingCart className="w-4 h-4" />
              <span className="font-medium">
                {cart.items.length} item{cart.items.length !== 1 ? 's' : ''} • {cart.total.toFixed(2)} ETB
              </span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2 border-t border-gray-200">
          {call.status === 'PENDING' && call.requestType === 'ORDER_READY' && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onCreateOrder(call);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isActionLoading}
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              Order
            </Button>
          )}
          {call.status === 'PENDING' && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onAcknowledge(call);
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={isActionLoading}
            >
              Accept
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(call);
            }}
            className="flex-1"
          >
            Details
          </Button>
        </div>
      </div>
    </Card>
  );
}
