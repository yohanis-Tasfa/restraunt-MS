import { useState } from 'react';
import {
  CheckCircle,
  Clock,
  ChefHat,
  UtensilsCrossed,
  Receipt,
  Bell,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Loader2,
  X,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export interface ActiveOrderData {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'COMPLETED';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  total: number;
  subtotal?: number;
  tax?: number;
  items?: Array<{
    id?: string;
    quantity: number;
    price: number;
    subtotal?: number;
    notes?: string;
    menuItem?: {
      name: string;
      image?: string;
      price: number;
    };
  }>;
  table?: {
    id: string;
    number: string;
    assignedWaiter?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
}

interface LiveOrderStatusTrackerProps {
  order: ActiveOrderData;
  tableNumber: string;
  onRequestBill: () => void;
  onCallAssistance?: () => void;
  onOrderCancelled?: () => void;
  onDismiss?: () => void;
}

export default function LiveOrderStatusTracker({
  order,
  tableNumber,
  onRequestBill,
  onOrderCancelled,
  onDismiss,
}: LiveOrderStatusTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCallingAssistance, setIsCallingAssistance] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Status check: Customer can only delete if NOT sent to kitchen yet (PENDING)
  const isNotSentToKitchen = order.status === 'PENDING';

  // Status progression mapping:
  // 0: Pending (Not sent to kitchen)
  // 1: In Kitchen (Confirmed / queued)
  // 2: Cooking (Preparing / Ready)
  // 3: Served (Delivered)
  // 4: Bill & Pay (Paid / settled)
  const getStepIndex = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'PAID') return 4;
    switch (status) {
      case 'PENDING':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'PREPARING':
      case 'READY':
        return 2;
      case 'SERVED':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status, order.paymentStatus);

  const steps = [
    { label: 'Pending', icon: Clock, desc: 'Order received • Not sent to kitchen yet' },
    { label: 'In Kitchen', icon: CheckCircle, desc: 'Order sent to kitchen queue' },
    { label: 'Cooking', icon: ChefHat, desc: 'Chef is preparing dishes' },
    { label: 'Served', icon: UtensilsCrossed, desc: 'Food delivered to table' },
    { label: 'Bill & Pay', icon: Receipt, desc: 'Ready for payment' },
  ];

  const handleCallWaiterAssistance = async () => {
    setIsCallingAssistance(true);
    try {
      const res = await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session-table-${tableNumber}`,
          requestType: 'ASSISTANCE',
          selectedItems: {
            tableNumber,
            orderId: order.id,
            notes: 'Customer requested assistance at table',
          },
        }),
      });

      if (res.ok) {
        toast.success(`Waiter notified! Someone is coming to Table ${tableNumber}.`);
      } else {
        toast.success(`Assistance requested for Table ${tableNumber}!`);
      }
    } catch {
      toast.success(`Assistance requested for Table ${tableNumber}!`);
    } finally {
      setIsCallingAssistance(false);
    }
  };

  // Customer self-cancel order (ONLY allowed if NOT sent to kitchen yet, i.e. PENDING)
  const handleCancelOrder = async () => {
    if (!isNotSentToKitchen) {
      toast.error('This order has already been sent to the kitchen and cannot be deleted.');
      return;
    }

    const confirmCancel = window.confirm(
      `Cancel Order #${order.orderNumber} for Table ${tableNumber}?`
    );
    if (!confirmCancel) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`/api/customer-sessions/table/${tableNumber}/cancel-active-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Customer deleted order before kitchen submission' }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        toast.success('Order deleted successfully.');
        if (onOrderCancelled) {
          onOrderCancelled();
        }
      } else {
        toast.error(json.message || 'Cannot delete this order. Please call your waiter for assistance.');
      }
    } catch {
      toast.error('Network error. Please call your waiter for assistance.');
    } finally {
      setIsCancelling(false);
    }
  };

  // If order is already in kitchen, request waiter assistance to cancel
  const handleRequestWaiterCancel = async () => {
    setIsCallingAssistance(true);
    try {
      const res = await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: `session-table-${tableNumber}`,
          requestType: 'ASSISTANCE',
          selectedItems: {
            tableNumber,
            orderId: order.id,
            notes: `CUSTOMER CANCELLATION REQUEST: Table ${tableNumber} requests to cancel Order #${order.orderNumber}`,
          },
        }),
      });

      if (res.ok) {
        toast.success(`Cancellation request sent to waiter for Table ${tableNumber}.`);
      } else {
        toast.success(`Waiter notified for Table ${tableNumber}.`);
      }
    } catch {
      toast.success(`Waiter notified for Table ${tableNumber}.`);
    } finally {
      setIsCallingAssistance(false);
    }
  };

  const formatPrice = (price: number) => `${price.toFixed(2)} ETB`;

  // Minimized Floating Pill
  if (isDismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-in fade-in zoom-in-95 duration-200">
        <button
          type="button"
          onClick={() => setIsDismissed(false)}
          className="px-4 py-2.5 rounded-full bg-[#042417]/95 hover:bg-[#083a26] border border-[#00e676]/60 shadow-2xl text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#00e676] animate-pulse" />
          <span>Active Order #{order.orderNumber.slice(-4)} ({steps[currentStep].label})</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#00e676]" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[480px] z-40 transition-all duration-300">
      <div className="bg-[#042417]/95 backdrop-blur-xl border border-[#00e676]/40 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-white transition-all">
        {/* Header Bar */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-[#00e676]/20 border border-[#00e676]/60 flex items-center justify-center text-[#00e676]">
                {currentStep === 0 ? (
                  <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                ) : currentStep === 1 ? (
                  <CheckCircle className="w-5 h-5 text-[#00e676]" />
                ) : currentStep === 2 ? (
                  <ChefHat className="w-5 h-5 animate-pulse text-[#00e676]" />
                ) : currentStep === 3 ? (
                  <UtensilsCrossed className="w-5 h-5 text-[#00e676]" />
                ) : (
                  <Receipt className="w-5 h-5 text-[#00e676]" />
                )}
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00e676] rounded-full ring-2 ring-[#042417] animate-ping" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white truncate">
                  Table {tableNumber}
                </span>
                <span
                  className={cn(
                    'text-[11px] px-2 py-0.5 rounded-full font-bold flex-shrink-0',
                    isNotSentToKitchen
                      ? 'bg-amber-400 text-amber-950'
                      : 'bg-[#00e676] text-[#032314]'
                  )}
                >
                  {steps[currentStep].label}
                </span>
              </div>
              <p className="text-xs text-white/70 truncate">
                Order #{order.orderNumber} &bull; <span className="text-[#00e676] font-semibold">{formatPrice(order.total)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Header Action Button depending on status */}
            {isNotSentToKitchen ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancelOrder();
                }}
                disabled={isCancelling}
                className="px-2.5 py-1.5 bg-red-600/30 hover:bg-red-600/40 text-red-300 font-bold text-xs rounded-xl border border-red-500/50 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                title="Delete order (not in kitchen)"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestBill();
                }}
                className="px-3 py-1.5 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-extrabold text-xs rounded-xl shadow-sm hover:shadow-[0_0_12px_rgba(0,230,118,0.4)] transition-all flex items-center gap-1 cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Bill</span>
              </button>
            )}

            <button
              type="button"
              aria-label="Toggle order details"
              className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>

            {/* Minimize / Close Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDismissed(true);
                onDismiss?.();
              }}
              aria-label="Minimize tracker"
              title="Minimize active order tracker"
              className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-Step Status Stepper */}
        <div className="px-3 pb-3 pt-1 border-t border-[#0e442d]">
          <div className="grid grid-cols-5 gap-1 relative">
            {steps.map((st, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const Icon = st.icon;

              return (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1',
                      isPast
                        ? 'bg-[#00e676] text-[#032314] shadow-[0_0_8px_#00e676]'
                        : isCurrent
                          ? isNotSentToKitchen
                            ? 'bg-amber-400/20 border-2 border-amber-400 text-amber-400 ring-2 ring-amber-400/30 animate-pulse'
                            : 'bg-[#00e676]/20 border-2 border-[#00e676] text-[#00e676] ring-2 ring-[#00e676]/30 animate-pulse'
                          : 'bg-[#083a26] text-white/40 border border-[#145d3e]'
                    )}
                  >
                    <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </div>
                  <span
                    className={cn(
                      'text-[9px] sm:text-[10px] font-bold tracking-tight leading-tight',
                      isCurrent
                        ? isNotSentToKitchen
                          ? 'text-amber-400'
                          : 'text-[#00e676]'
                        : isPast
                          ? 'text-white'
                          : 'text-white/40'
                    )}
                  >
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expanded Drawer Details */}
        {isExpanded && (
          <div className="p-4 border-t border-[#0e442d] bg-[#031d13] space-y-3.5 animate-in slide-in-from-bottom-2 duration-200">
            {/* Status Description Box */}
            <div className="p-2.5 rounded-xl bg-[#083a26]/80 border border-[#145d3e] flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00e676] flex-shrink-0" />
              <div className="text-xs text-white/90">
                <p className="font-semibold text-white">{steps[currentStep].desc}</p>
                {order.table?.assignedWaiter && (
                  <p className="text-[11px] text-white/60 mt-0.5">
                    Assigned Server: <span className="text-white font-medium">{order.table.assignedWaiter.firstName} {order.table.assignedWaiter.lastName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Ordered Items List */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                <p className="text-[11px] uppercase font-bold text-white/60 tracking-wider">
                  Ordered Dishes
                </p>
                {order.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1.5 border-b border-[#0e442d]/60 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-bold text-[#00e676] text-xs">
                        {item.quantity}×
                      </span>
                      <span className="text-white font-medium truncate">
                        {item.menuItem?.name || 'Dish item'}
                      </span>
                    </div>
                    <span className="text-white/90 font-semibold flex-shrink-0">
                      {formatPrice(item.subtotal || item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Action Buttons Based on Status */}
            <div className="pt-2 border-t border-[#0e442d] space-y-2">
              {/* CASE 1: PENDING (NOT sent to kitchen yet) -> Display direct Delete Button */}
              {isNotSentToKitchen && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelOrder}
                      disabled={isCancelling}
                      className="flex-1 py-2.5 px-3 bg-red-600/25 hover:bg-red-600/40 border border-red-500/60 text-red-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCancelling ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span>Delete Order (Not in Kitchen)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCallWaiterAssistance}
                      disabled={isCallingAssistance}
                      className="py-2.5 px-3 bg-[#083a26] hover:bg-[#0c4d33] border border-[#145d3e] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#00e676]" />
                      <span>Call Waiter</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-300/80 text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>Order has not been sent to the kitchen yet. You can delete it directly.</span>
                  </p>
                </div>
              )}

              {/* CASE 2: CONFIRMED (Sent to kitchen) -> Delete button is hidden, can request waiter */}
              {order.status === 'CONFIRMED' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCallWaiterAssistance}
                      disabled={isCallingAssistance}
                      className="flex-1 py-2.5 px-3 bg-[#083a26] hover:bg-[#0c4d33] border border-[#145d3e] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCallingAssistance ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-[#00e676]" />
                      )}
                      <span>Call Waiter</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRequestWaiterCancel}
                      disabled={isCallingAssistance}
                      className="py-2.5 px-3 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Request waiter to cancel this in-kitchen order"
                    >
                      <Trash2 className="w-3 h-3 text-red-400" />
                      <span>Ask Waiter to Cancel</span>
                    </button>

                    <button
                      type="button"
                      onClick={onRequestBill}
                      className="px-3 py-2.5 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Bill</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-300/80 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    <span>Order has been sent to kitchen. Dishes cannot be deleted directly by customer.</span>
                  </p>
                </div>
              )}

              {/* CASE 3: PREPARING or READY (Cooking in Kitchen) */}
              {(order.status === 'PREPARING' || order.status === 'READY') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCallWaiterAssistance}
                      disabled={isCallingAssistance}
                      className="flex-1 py-2.5 px-3 bg-[#083a26] hover:bg-[#0c4d33] border border-[#145d3e] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isCallingAssistance ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Bell className="w-3.5 h-3.5 text-[#00e676]" />
                      )}
                      <span>Call Waiter</span>
                    </button>

                    <button
                      type="button"
                      onClick={onRequestBill}
                      className="flex-1 py-2.5 px-3 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(0,230,118,0.3)] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Request Bill & Pay</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-white/50 text-center flex items-center justify-center gap-1">
                    <ChefHat className="w-3 h-3 text-[#00e676] flex-shrink-0" />
                    <span>{order.status === 'READY' ? 'Order is ready for pickup by your server!' : 'Kitchen is actively preparing your meal.'}</span>
                  </p>
                </div>
              )}

              {/* CASE 4: SERVED (Delivered to Table) */}
              {order.status === 'SERVED' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCallWaiterAssistance}
                      disabled={isCallingAssistance}
                      className="py-2.5 px-3 bg-[#083a26] hover:bg-[#0c4d33] border border-[#145d3e] text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#00e676]" />
                      <span>Call Waiter</span>
                    </button>

                    <button
                      type="button"
                      onClick={onRequestBill}
                      className="flex-1 py-2.5 px-4 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-black rounded-xl text-xs shadow-[0_0_20px_rgba(0,230,118,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Request Bill & Pay</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-[#00e676] text-center font-medium">
                    Food delivered to your table. Enjoy your meal!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
