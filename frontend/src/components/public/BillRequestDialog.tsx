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
import { Receipt, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';

interface BillRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    orderNumber: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    subtotal: number;
    tax: number;
    total: number;
  };
  sessionId: string;
  tableNumber: string;
  tableId: string;
  waiterId: string;
}

export default function BillRequestDialog({
  open,
  onOpenChange,
  order,
  sessionId,
  tableNumber,
  tableId,
  waiterId,
}: BillRequestDialogProps) {
  const [isSuccess, setIsSuccess] = useState(false);

  // Request bill mutation
  const requestBillMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/bill-requests', {
        orderId: order.id,
        sessionId,
        tableId,
        waiterId,
      });
      return response.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Bill requested! Your waiter will be with you shortly.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request bill');
    },
  });

  const handleRequestBill = () => {
    requestBillMutation.mutate();
  };

  const handleClose = () => {
    setIsSuccess(false);
    onOpenChange(false);
  };

  // Success View
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Bill Requested!
            </h2>
            <p className="text-gray-600 mb-4">
              Your waiter has been notified and will bring your bill shortly.
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-gray-900">{order.total.toFixed(2)} ብር</p>
            </div>

            <Button className="w-full" onClick={handleClose}>
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5" />
            Your Bill - Table {tableNumber}
          </DialogTitle>
          <DialogDescription>
            Order #{order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Items */}
          <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <span className="text-gray-700">{item.name}</span>
                    <span className="text-gray-500 ml-2">×{item.quantity}</span>
                  </div>
                  <span className="font-medium text-gray-900">
                    {item.subtotal.toFixed(2)} ብር
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Bill Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{order.subtotal.toFixed(2)} ብር</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (15%)</span>
              <span className="font-medium">{order.tax.toFixed(2)} ብር</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
              <span>Total Amount</span>
              <span className="text-green-600">{order.total.toFixed(2)} ብር</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleRequestBill}
              disabled={requestBillMutation.isPending}
            >
              {requestBillMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4 mr-2" />
                  Request Bill
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
