import { useState } from 'react';
import { Bell, Clock, ShoppingCart, Receipt } from 'lucide-react';
import { useActiveCalls, useWaiterCallActions } from '../../hooks/useWaiterCalls';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import PaymentCollectionDialog from './PaymentCollectionDialog';

const renderRequestIcon = (type: string) => {
  switch (type) {
    case 'ASSISTANCE':
      return <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'ORDER_READY':
      return <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'BILL_REQUEST':
      return <Receipt className="w-5 h-5 text-emerald-600 dark:text-[#00e676]" />;
    default:
      return <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
  }
};

const requestTypeLabels = {
  ASSISTANCE: 'Assistance',
  ORDER_READY: 'Ready to Order',
  BILL_REQUEST: 'Bill Request',
  OTHER: 'Other',
};

interface ActiveCallsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ActiveCallsPanel({ open, onOpenChange }: ActiveCallsPanelProps) {
  const [selectedBillRequest, setSelectedBillRequest] = useState<any>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { calls, isLoading, refetch } = useActiveCalls(false);
  const { acknowledge, complete } = useWaiterCallActions();
  const navigate = useNavigate();

  const pendingCalls = calls.filter((call) => call.status === 'PENDING');
  const acknowledgedCalls = calls.filter((call) => call.status === 'ACKNOWLEDGED');

  const handleProcessOrder = (call: any) => {
    const rawItems: any[] = Array.isArray(call.selectedItems)
      ? call.selectedItems
      : Array.isArray(call.selectedItems?.items)
      ? call.selectedItems.items
      : [];

    if (rawItems.length > 0) {
      // Close the panel first
      onOpenChange(false);

      const customerCart = {
        sessionId: call.sessionId,
        tableId: call.tableId,
        tableNumber: call.table?.number,
        items: rawItems.map((item: any, idx: number) => ({
          menuItemId: item.menuItemId || item.id || `item-pos-${idx}-${Date.now()}`,
          name: item.name || 'Selected Dish',
          price: Number(item.price || 0),
          quantity: Number(item.quantity || 1),
          subtotal: Number(item.subtotal || Number(item.price || 0) * Number(item.quantity || 1)),
          image: item.image,
          notes: item.notes,
        })),
        total: rawItems.reduce(
          (sum: number, it: any) => sum + Number(it.price || 0) * Number(it.quantity || 1),
          0
        ),
        orderType: call.selectedItems?.orderType || 'DINE_IN',
      };

      // Navigate to POS with prefilled cart and auto-open checkout
      navigate('/admin/pos', {
        state: {
          tableId: call.tableId,
          tableNumber: call.table?.number,
          orderType: customerCart.orderType,
          callId: call.id,
          customerCart,
          autoOpenCheckout: true,
        },
      });
    }
  };

  const handleCollectPayment = (call: any) => {
    setSelectedBillRequest(call);
    setIsPaymentDialogOpen(true);
  };

  const handlePaymentComplete = () => {
    setIsPaymentDialogOpen(false);
    setSelectedBillRequest(null);
    refetch();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225] text-gray-900 dark:text-gray-100">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Bell className="w-5 h-5 text-emerald-600 dark:text-[#00e676]" />
              Active Calls
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-[#123627] dark:text-[#00e676] dark:border dark:border-[#1a4a35]">
                {calls.length}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Manage pending customer requests and orders
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[65vh] space-y-4 pr-1">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Loading calls...
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">No active calls</p>
              </div>
            ) : (
              <>
                {/* Pending Calls */}
                {pendingCalls.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Pending ({pendingCalls.length})
                    </h4>
                    {pendingCalls.map((call) => (
                      <div
                        key={call.id}
                        className="bg-red-50/80 dark:bg-[#190a0d] border border-red-200/80 dark:border-[#3d1820] border-l-4 border-l-red-500 dark:border-l-red-500 rounded-xl p-4 space-y-3 shadow-sm transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-2">
                              <span className="p-2 rounded-lg bg-red-100 dark:bg-[#2b1016] border border-red-200/50 dark:border-[#4d1f29] flex items-center justify-center shrink-0">
                                {renderRequestIcon(call.requestType)}
                              </span>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base">
                                  Table {call.table.number}
                                </p>
                                <p className="text-sm font-medium text-red-700 dark:text-red-400">
                                  {requestTypeLabels[call.requestType]}
                                </p>
                              </div>
                            </div>
                            {call.notes && (
                              <p className="text-sm text-gray-700 dark:text-gray-200 italic bg-white/70 dark:bg-[#250d12] border border-red-100 dark:border-[#3d1820] rounded-lg px-2.5 py-1.5 mb-2">
                                "{call.notes}"
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                              <Clock className="w-3.5 h-3.5" />
                              {formatDistanceToNow(new Date(call.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          {(Array.isArray(call.selectedItems) && call.selectedItems.length > 0) || (call.selectedItems?.items && call.selectedItems.items.length > 0) ? (
                            <Button
                              size="sm"
                              onClick={() => handleProcessOrder(call)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Process Order ({Array.isArray(call.selectedItems) ? call.selectedItems.length : call.selectedItems?.items?.length || 0} items)
                            </Button>
                          ) : call.requestType === 'BILL_REQUEST' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => acknowledge({ id: call.id })}
                                variant="outline"
                                className="flex-1 border-gray-300 dark:border-[#3d1820] text-gray-700 dark:text-gray-200 hover:bg-white dark:hover:bg-[#250d12] cursor-pointer"
                              >
                                I'm Going
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCollectPayment(call)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
                              >
                                <Receipt className="w-4 h-4 mr-2" />
                                Collect Payment
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => acknowledge({ id: call.id })}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
                              >
                                Acknowledge
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => complete({ id: call.id })}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                              >
                                Complete
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Acknowledged Calls */}
                {acknowledgedCalls.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      In Progress ({acknowledgedCalls.length})
                    </h4>
                    {acknowledgedCalls.map((call) => (
                      <div
                        key={call.id}
                        className="bg-blue-50/80 dark:bg-[#071524] border border-blue-200/80 dark:border-[#102d47] border-l-4 border-l-blue-500 dark:border-l-blue-500 rounded-xl p-4 space-y-3 shadow-sm transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2.5 mb-2">
                              <span className="p-2 rounded-lg bg-blue-100 dark:bg-[#0d2238] border border-blue-200/50 dark:border-[#14395c] flex items-center justify-center shrink-0">
                                {renderRequestIcon(call.requestType)}
                              </span>
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base">
                                  Table {call.table.number}
                                </p>
                                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                  {requestTypeLabels[call.requestType]}
                                </p>
                              </div>
                            </div>
                            {call.notes && (
                              <p className="text-sm text-gray-700 dark:text-gray-200 italic bg-white/70 dark:bg-[#0c1f33] border border-blue-100 dark:border-[#102d47] rounded-lg px-2.5 py-1.5 mb-2">
                                "{call.notes}"
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                              <Clock className="w-3.5 h-3.5" />
                              Acknowledged{' '}
                              {call.acknowledgedAt &&
                                formatDistanceToNow(new Date(call.acknowledgedAt), {
                                  addSuffix: true,
                                })}
                            </div>
                            {call.assignedWaiter && (
                              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                Waiter: {call.assignedWaiter.firstName}{' '}
                                {call.assignedWaiter.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          {(Array.isArray(call.selectedItems) && call.selectedItems.length > 0) || (call.selectedItems?.items && call.selectedItems.items.length > 0) ? (
                            <Button
                              size="sm"
                              onClick={() => handleProcessOrder(call)}
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Process Order ({Array.isArray(call.selectedItems) ? call.selectedItems.length : call.selectedItems?.items?.length || 0} items)
                            </Button>
                          ) : call.requestType === 'BILL_REQUEST' ? (
                            <Button
                              size="sm"
                              onClick={() => handleCollectPayment(call)}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
                            >
                              <Receipt className="w-4 h-4 mr-2" />
                              Collect Payment
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => complete({ id: call.id })}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm cursor-pointer"
                            >
                              Mark Complete
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Collection Dialog */}
      {selectedBillRequest && (
        <PaymentCollectionDialog
          open={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          billRequest={selectedBillRequest}
          onPaymentComplete={handlePaymentComplete}
        />
      )}
    </>
  );
}
