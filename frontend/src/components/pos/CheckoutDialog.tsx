import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useCartStore } from '../../store/cartStore';
import { useAuthStore } from '../../store/authStore';
import { ordersApi, OrderType, type CreateOrderData } from '../../api/orders';
import { tablesApi } from '../../api/tables';
import { CreditCard, Banknote, Smartphone, Printer, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE';

export default function CheckoutDialog({ open, onOpenChange }: CheckoutDialogProps) {
  const { user } = useAuthStore();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  
  const [orderType, setOrderType] = useState<OrderType>(OrderType.DINE_IN);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');

  // Fetch available tables
  const { data: tablesData } = useQuery({
    queryKey: ['tables', user?.branch?.id],
    queryFn: () => tablesApi.getAvailableTables(user?.branch?.id),
    enabled: open && !!user?.branch?.id && orderType === OrderType.DINE_IN,
  });

  const tables = tablesData || [];

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: (data) => {
      setOrderNumber(data.orderNumber);
      setIsSuccess(true);
      clearCart();
      toast.success('Order placed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create order');
    },
  });

  const handlePlaceOrder = () => {
    if (orderType === OrderType.DINE_IN && !selectedTable) {
      toast.error('Please select a table');
      return;
    }

    const orderData: CreateOrderData = {
      type: orderType,
      branchId: user?.branch?.id || '',
      tableId: orderType === OrderType.DINE_IN ? selectedTable : undefined,
      items: items.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.unitPrice,
        notes: item.specialInstructions,
      })),
    };

    createOrderMutation.mutate(orderData);
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      setOrderNumber('');
      setSelectedTable('');
      setOrderType(OrderType.DINE_IN);
      setPaymentMethod('CASH');
    }
    onOpenChange(false);
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();

  // Success View
  if (isSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
            <p className="text-gray-600 mb-4">Order #{orderNumber}</p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-green-600">{total.toFixed(2)} ብር</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                <Printer className="w-4 h-4" />
                Print Receipt
              </Button>
              <Button className="flex-1" onClick={handleClose}>
                New Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Checkout View
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Complete order details and payment</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Type */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Order Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[OrderType.DINE_IN, OrderType.TAKEAWAY, OrderType.DELIVERY].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    orderType === type
                      ? 'border-green-600 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Table Selection */}
          {orderType === OrderType.DINE_IN && (
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Table</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a table" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table: any) => (
                    <SelectItem key={table.id} value={table.id}>
                      Table {table.number} (Capacity: {table.capacity})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'CASH'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-xs font-medium">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'CARD'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                <span className="text-xs font-medium">Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('MOBILE')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'MOBILE'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-6 h-6" />
                <span className="text-xs font-medium">Mobile</span>
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{subtotal.toFixed(2)} ብር</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (15%)</span>
              <span className="font-medium">{tax.toFixed(2)} ብር</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span className="text-green-600">{total.toFixed(2)} ብር</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handlePlaceOrder}
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
