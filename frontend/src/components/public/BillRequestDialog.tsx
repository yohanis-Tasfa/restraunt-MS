import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Receipt, CheckCircle, Loader2, Banknote, Smartphone, CreditCard, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

interface BillRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    orderNumber: string;
    items?: Array<{
      name?: string;
      quantity?: number;
      price?: number;
      subtotal?: number;
      menuItem?: {
        name?: string;
        price?: number;
      };
    }>;
    subtotal?: number;
    tax?: number;
    total: number;
  };
  sessionId?: string;
  tableNumber: string;
  tableId?: string;
  waiterId?: string;
}

type PaymentMethodType = 'CASH' | 'TELEBIRR' | 'CBE_BIRR' | 'CARD';

export default function BillRequestDialog({
  open,
  onOpenChange,
  order,
  sessionId,
  tableNumber,
  tableId,
  waiterId,
}: BillRequestDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('CASH');
  const [isSuccess, setIsSuccess] = useState(false);

  // Request bill mutation using public waiter call
  const requestBillMutation = useMutation({
    mutationFn: async () => {
      // If we don't have a sessionId, fetch or create one for this table
      let validSessionId = sessionId;
      if (!validSessionId) {
        try {
          const sRes = await fetch('/api/customer-sessions/by-table', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tableNumber, guestCount: 1 }),
          });
          if (sRes.ok) {
            const sData = await sRes.json();
            validSessionId = sData.id;
          }
        } catch (e) {
          console.error('Session lookup error:', e);
        }
      }

      const methodNames: Record<PaymentMethodType, string> = {
        CASH: 'Cash',
        TELEBIRR: 'Telebirr',
        CBE_BIRR: 'CBE Birr',
        CARD: 'Card / POS',
      };

      const response = await fetch('/api/waiter-calls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: validSessionId || `session-table-${tableNumber}`,
          requestType: 'BILL_REQUEST',
          selectedItems: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            paymentMethod: selectedMethod,
            notes: `Customer requested bill via ${methodNames[selectedMethod]} at Table ${tableNumber}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to notify staff for bill request');
      }

      return await response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Bill requested! Staff has been notified.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to request bill. Please call your waiter.');
    },
  });

  const handleRequestBill = () => {
    requestBillMutation.mutate();
  };

  const handleClose = () => {
    setIsSuccess(false);
    onOpenChange(false);
  };

  const formatPrice = (price?: number) => `${Number(price || 0).toFixed(2)} ETB`;

  const paymentOptions: Array<{ id: PaymentMethodType; label: string; icon: any; desc: string }> = [
    { id: 'CASH', label: 'Cash', icon: Banknote, desc: 'Pay cash to your waiter' },
    { id: 'TELEBIRR', label: 'Telebirr', icon: Smartphone, desc: 'Mobile wallet payment' },
    { id: 'CBE_BIRR', label: 'CBE Birr', icon: Smartphone, desc: 'Commercial Bank of Ethiopia' },
    { id: 'CARD', label: 'Card / POS', icon: CreditCard, desc: 'Debit / Credit card terminal' },
  ];

  // Success View
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md bg-[#042417] text-white border border-[#145d3e]">
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#00e676]/20 border border-[#00e676]/50 flex items-center justify-center mx-auto text-[#00e676] shadow-[0_0_20px_rgba(0,230,118,0.4)]">
              <CheckCircle className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-serif text-white">
                Bill Requested!
              </h2>
              <p className="text-sm text-white/80 mt-1 max-w-xs mx-auto">
                Your waiter and cashier have been notified. They will bring your bill to <span className="text-[#00e676] font-bold">Table {tableNumber}</span> shortly.
              </p>
            </div>
            
            <div className="bg-[#083a26] border border-[#145d3e] rounded-2xl p-4 max-w-xs mx-auto">
              <p className="text-xs uppercase tracking-wider text-white/60 mb-0.5">Total to Pay</p>
              <p className="text-3xl font-extrabold text-[#00e676] drop-shadow-[0_0_12px_rgba(0,230,118,0.4)]">
                {formatPrice(order.total)}
              </p>
              <p className="text-xs text-white/70 mt-1">
                Method: <span className="text-white font-semibold">{paymentOptions.find(p => p.id === selectedMethod)?.label}</span>
              </p>
            </div>

            <Button
              className="w-full bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl py-3 shadow-[0_0_15px_rgba(0,230,118,0.3)] cursor-pointer"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Bill View
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-[#042417] text-white border border-[#145d3e]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
            <Receipt className="w-5 h-5 text-[#00e676]" />
            <span>Bill & Payment • Table {tableNumber}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-white/70">
            Order #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Order Items Summary */}
          {order.items && order.items.length > 0 && (
            <div className="border border-[#145d3e] bg-[#083a26]/70 rounded-xl p-3.5 max-h-48 overflow-y-auto space-y-2">
              <h3 className="text-xs uppercase font-bold text-white/70 tracking-wider">
                Order Summary ({order.items.length} items)
              </h3>
              <div className="divide-y divide-[#145d3e]/50">
                {order.items.map((item, index) => {
                  const name = item.name || item.menuItem?.name || 'Dish';
                  const qty = item.quantity || 1;
                  const price = item.subtotal || (item.price || item.menuItem?.price || 0) * qty;
                  return (
                    <div key={index} className="flex justify-between items-center py-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{name}</span>
                        <span className="text-white/60">×{qty}</span>
                      </div>
                      <span className="font-bold text-[#00e676]">
                        {formatPrice(price)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs uppercase tracking-wider font-bold text-white/80 block mb-2">
              Select Preferred Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedMethod === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedMethod(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#00e676]/15 border-[#00e676] text-white shadow-[0_0_12px_rgba(0,230,118,0.25)]'
                        : 'bg-[#083a26] border-[#145d3e] text-white/80 hover:border-white/30'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-[#00e676] text-[#032314]' : 'bg-black/30 text-white/80'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold leading-none">{opt.label}</p>
                      <p className="text-[10px] text-white/60 truncate mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bill Breakdown */}
          <div className="bg-[#083a26] border border-[#145d3e] rounded-xl p-3.5 space-y-1.5">
            <div className="flex justify-between text-xs text-white/70">
              <span>Subtotal</span>
              <span className="font-medium text-white">{formatPrice(order.subtotal || order.total)}</span>
            </div>
            {order.tax !== undefined && order.tax > 0 && (
              <div className="flex justify-between text-xs text-white/70">
                <span>Tax & VAT</span>
                <span className="font-medium text-white">{formatPrice(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold border-t border-[#145d3e] pt-2 mt-1">
              <span className="text-white">Total Amount</span>
              <span className="text-[#00e676] drop-shadow-[0_0_10px_rgba(0,230,118,0.35)]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-1">
            <Button
              variant="outline"
              className="flex-1 border-[#145d3e] bg-transparent hover:bg-white/10 text-white rounded-xl py-2.5 text-xs font-semibold cursor-pointer"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#00e676] hover:bg-[#00c853] text-[#032314] font-bold rounded-xl py-2.5 text-xs shadow-[0_0_15px_rgba(0,230,118,0.3)] cursor-pointer"
              onClick={handleRequestBill}
              disabled={requestBillMutation.isPending}
            >
              {requestBillMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Requesting...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-3.5 h-3.5 mr-1.5" />
                  <span>Confirm Bill Request</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
