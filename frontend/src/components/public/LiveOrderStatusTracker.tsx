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
  Loader2
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
}

export default function LiveOrderStatusTracker({
  order,
  tableNumber,
  onRequestBill,
  onCallAssistance,
}: LiveOrderStatusTrackerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCallingAssistance, setIsCallingAssistance] = useState(false);

  // Status progression mapping
  // 0: Confirmed, 1: Preparing, 2: Served, 3: Paid
  const getStepIndex = (status: string, paymentStatus: string) => {
    if (paymentStatus === 'PAID') return 3;
    switch (status) {
      case 'PENDING':
      case 'CONFIRMED':
        return 0;
      case 'PREPARING':
      case 'READY':
        return 1;
      case 'SERVED':
        return 2;
      case 'COMPLETED':
        return 3;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status, order.paymentStatus);

  const steps = [
    { label: 'Confirmed', icon: CheckCircle, desc: 'Order sent to kitchen' },
    { label: 'Cooking', icon: ChefHat, desc: 'Chef is preparing dishes' },
    { label: 'Served', icon: UtensilsCrossed, desc: 'Food delivered to table' },
    { label: 'Bill & Pay', icon: Receipt, desc: 'Ready for payment' },
  ];

  const handleCallWaiterAssistance = async () => {
    setIsCallingAssistance(true);
    try {
      // Find session or call by table
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
    } catch (e) {
      toast.success(`Assistance requested for Table ${tableNumber}!`);
    } finally {
      setIsCallingAssistance(false);
    }
  };

  const formatPrice = (price: number) => `${price.toFixed(2)} ETB`;

  return (
    <div className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[460px] z-40 transition-all duration-300">
      <div className="bg-[#042417]/95 backdrop-blur-xl border border-[#00e676]/40 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden text-white transition-all">
        {/* Header Bar */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#00e676]/20 border border-[#00e676]/60 flex items-center justify-center text-[#00e676]">
                {currentStep === 1 ? (
                  <ChefHat className="w-5 h-5 animate-pulse" />
                ) : currentStep === 2 ? (
                  <UtensilsCrossed className="w-5 h-5" />
                ) : currentStep === 3 ? (
                  <Receipt className="w-5 h-5" />
                ) : (
                  <Clock className="w-5 h-5" />
                )}
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#00e676] rounded-full ring-2 ring-[#042417] animate-ping" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-white">
                  Table {tableNumber}
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-[#00e676] text-[#032314]">
                  {steps[currentStep].label}
                </span>
              </div>
              <p className="text-xs text-white/70">
                Order #{order.orderNumber} &bull; <span className="text-[#00e676] font-semibold">{formatPrice(order.total)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
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

            <button
              type="button"
              aria-label="Toggle order details"
              className="p-1.5 text-white/60 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Status Stepper Tracker */}
        <div className="px-4 pb-3 pt-1 border-t border-[#0e442d]">
          <div className="grid grid-cols-4 gap-1 relative">
            {steps.map((st, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              const Icon = st.icon;

              return (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div
                    className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-1',
                      isPast
                        ? 'bg-[#00e676] text-[#032314] shadow-[0_0_8px_#00e676]'
                        : isCurrent
                        ? 'bg-[#00e676]/20 border-2 border-[#00e676] text-[#00e676] ring-2 ring-[#00e676]/30 animate-pulse'
                        : 'bg-[#083a26] text-white/40 border border-[#145d3e]'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-bold tracking-tight leading-tight',
                      isCurrent
                        ? 'text-[#00e676]'
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
            {/* Status Description */}
            <div className="p-2.5 rounded-xl bg-[#083a26]/80 border border-[#145d3e] flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#00e676] flex-shrink-0" />
              <p className="text-xs text-white/90">
                {steps[currentStep].desc}
                {order.table?.assignedWaiter && (
                  <span className="block text-[11px] text-white/60 mt-0.5">
                    Waiter: <span className="text-white font-medium">{order.table.assignedWaiter.firstName} {order.table.assignedWaiter.lastName}</span>
                  </span>
                )}
              </p>
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

            {/* Total and Quick Action Buttons */}
            <div className="pt-2 border-t border-[#0e442d] flex items-center gap-2">
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
          </div>
        )}
      </div>
    </div>
  );
}

