import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { paymentsApi, PaymentMethod } from '../../api/payments';
import { customerSessionApi } from '../../api/customer-session';
import { CreditCard, Banknote, Smartphone, Building2, CheckCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '../../api/orders';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export default function PaymentDialog({ open, onOpenChange, order }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [reference, setReference] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: paymentsApi.createPayment,
    onSuccess: async (data) => {
      setPaymentId(data.id);
      setIsSuccess(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      // If it's a dine-in order, optionally end the session
      if (order?.tableId && order.type === 'DINE_IN') {
        try {
          const session = await customerSessionApi.getActiveSessionByTable(order.tableId);
          // Auto-end session after payment (optional - can be manual too)
          // await customerSessionApi.endSession(session.id);
          // queryClient.invalidateQueries({ queryKey: ['tables'] });
          toast.success('Payment processed successfully!');
        } catch (error) {
          // Session might not exist, that's okay
          toast.success('Payment processed successfully!');
        }
      } else {
        toast.success('Payment processed successfully!');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  const handleProcessPayment = () => {
    if (!order) return;

    processPaymentMutation.mutate({
      orderId: order.id,
      amount: order.total,
      method: paymentMethod,
      reference: reference || undefined,
    });
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      setPaymentId('');
      setReference('');
      setPaymentMethod(PaymentMethod.CASH);
    }
    onOpenChange(false);
  };

  const handlePrintReceipt = () => {
    // TODO: Implement receipt printing
    toast.success('Receipt sent to printer');
    handleClose();
  };

  if (!order) return null;

  // Success View
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">Order #{order.orderNumber}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Amount Paid</p>
              <p className="text-3xl font-bold text-green-600">{order.total.toFixed(2)} ብር</p>
              <p className="text-sm text-gray-600 mt-2">
                Payment Method: <strong>{paymentMethod}</strong>
              </p>
              {reference && (
                <p className="text-sm text-gray-600">
                  Reference: <strong>{reference}</strong>
                </p>
              )}
            </div>

            {order.table && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  <strong>Table {order.table.number}</strong> - You can now end the session and clear the table
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handlePrintReceipt}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Payment View
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Process Payment</DialogTitle>
          <DialogDescription>
            Process payment for Order #{order.orderNumber}
            {order.table && ` - Table ${order.table.number}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{order.subtotal.toFixed(2)} ብር</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{order.tax.toFixed(2)} ብር</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charge</span>
                  <span className="font-medium">{order.serviceCharge.toFixed(2)} ብር</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{order.discount.toFixed(2)} ብር</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                <span>Total Amount</span>
                <span className="text-green-600">{order.total.toFixed(2)} ብር</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <Label className="mb-3 block">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === PaymentMethod.CASH
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Banknote className="w-8 h-8" />
                <span className="text-sm font-medium">Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === PaymentMethod.CARD
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-8 h-8" />
                <span className="text-sm font-medium">Card</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.MOBILE)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === PaymentMethod.MOBILE
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-8 h-8" />
                <span className="text-sm font-medium">Mobile Money</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === PaymentMethod.BANK_TRANSFER
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Building2 className="w-8 h-8" />
                <span className="text-sm font-medium">Bank Transfer</span>
              </button>
            </div>
          </div>

          {/* Reference Number (Optional for Card/Mobile/Bank) */}
          {paymentMethod !== PaymentMethod.CASH && (
            <div>
              <Label htmlFor="reference">
                Reference/Transaction Number {paymentMethod === PaymentMethod.CARD && '(Optional)'}
              </Label>
              <Input
                id="reference"
                placeholder={
                  paymentMethod === PaymentMethod.MOBILE
                    ? 'Enter mobile money reference'
                    : paymentMethod === PaymentMethod.BANK_TRANSFER
                    ? 'Enter transaction reference'
                    : 'Enter card transaction reference'
                }
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={processPaymentMutation.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={processPaymentMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {processPaymentMutation.isPending ? 'Processing...' : `Pay ${order.total.toFixed(2)} ብር`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
