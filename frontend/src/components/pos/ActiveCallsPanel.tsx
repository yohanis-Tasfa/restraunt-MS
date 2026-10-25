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

const requestTypeIcons = {
  ASSISTANCE: '🔔',
  ORDER_READY: '🛒',
  BILL_REQUEST: '💳',
  OTHER: '❓',
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
    if (call.selectedItems && call.selectedItems.items) {
      // Close the panel first
      onOpenChange(false);
      
      // Navigate to POS with prefilled cart
      navigate('/admin/pos', {
        state: {
          customerCart: call.selectedItems,
          tableNumber: call.table.number,
          orderType: call.selectedItems.orderType,
          callId: call.id,
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
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              Active Calls
              <Badge className="bg-green-100 text-green-700">
                {calls.length}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Manage pending customer requests and orders
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto max-h-[60vh] space-y-4 pr-2">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading calls...
              </div>
            ) : calls.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No active calls</p>
              </div>
            ) : (
              <>
                {/* Pending Calls */}
                {pendingCalls.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-600 uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                      Pending ({pendingCalls.length})
                    </h4>
                    {pendingCalls.map((call) => (
                      <div
                        key={call.id}
                        className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">
                                {requestTypeIcons[call.requestType]}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Table {call.table.number}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {requestTypeLabels[call.requestType]}
                                </p>
                              </div>
                            </div>
                            {call.notes && (
                              <p className="text-sm text-gray-700 italic bg-white/50 rounded px-2 py-1 mb-2">
                                "{call.notes}"
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(call.createdAt), {
                                addSuffix: true,
                              })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {call.selectedItems && call.selectedItems.items ? (
                            <Button
                              size="sm"
                              onClick={() => handleProcessOrder(call)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Process Order ({call.selectedItems.totalItems} items)
                            </Button>
                          ) : call.requestType === 'BILL_REQUEST' && call.selectedItems ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => acknowledge({ id: call.id })}
                                variant="outline"
                                className="flex-1"
                              >
                                I'm Going
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleCollectPayment(call)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
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
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                Acknowledge
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => complete({ id: call.id })}
                                className="flex-1 bg-green-600 hover:bg-green-700"
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
                    <h4 className="text-sm font-semibold text-gray-600 uppercase flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      In Progress ({acknowledgedCalls.length})
                    </h4>
                    {acknowledgedCalls.map((call) => (
                      <div
                        key={call.id}
                        className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">
                                {requestTypeIcons[call.requestType]}
                              </span>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  Table {call.table.number}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {requestTypeLabels[call.requestType]}
                                </p>
                              </div>
                            </div>
                            {call.notes && (
                              <p className="text-sm text-gray-700 italic bg-white/50 rounded px-2 py-1 mb-2">
                                "{call.notes}"
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                              <Clock className="w-3 h-3" />
                              Acknowledged{' '}
                              {call.acknowledgedAt &&
                                formatDistanceToNow(new Date(call.acknowledgedAt), {
                                  addSuffix: true,
                                })}
                            </div>
                            {call.assignedWaiter && (
                              <p className="text-xs text-gray-600">
                                Waiter: {call.assignedWaiter.firstName}{' '}
                                {call.assignedWaiter.lastName}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {call.selectedItems && call.selectedItems.items ? (
                            <Button
                              size="sm"
                              onClick={() => handleProcessOrder(call)}
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Process Order ({call.selectedItems.totalItems} items)
                            </Button>
                          ) : call.requestType === 'BILL_REQUEST' && call.selectedItems ? (
                            <Button
                              size="sm"
                              onClick={() => handleCollectPayment(call)}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              <Receipt className="w-4 h-4 mr-2" />
                              Collect Payment
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => complete({ id: call.id })}
                              className="w-full bg-green-600 hover:bg-green-700"
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
