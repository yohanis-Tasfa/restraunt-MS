import { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { waiterCallsApi } from '../../api/waiter-calls';
import { CreditCard, Banknote, Smartphone, Printer, CheckCircle, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillData?: {
    tableNumber?: string;
    orderType?: OrderType;
    callId?: string; // Add callId to track which call this order is for
  };
  onSuccess?: () => void; // Callback when order is successfully created
}

type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE';

export default function CheckoutDialog({ open, onOpenChange, prefillData, onSuccess }: CheckoutDialogProps) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { items, getSubtotal, getTax, getTotal, clearCart } = useCartStore();
  
  // Log prefillData when dialog opens
  useEffect(() => {
    if (open && prefillData) {
      console.log('🎯 CheckoutDialog opened with prefillData:', prefillData);
    }
  }, [open, prefillData]);
  
  const [orderType, setOrderType] = useState<OrderType>(prefillData?.orderType || OrderType.DINE_IN);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string>('');
  const [createdOrderType, setCreatedOrderType] = useState<OrderType>(OrderType.DINE_IN);

  // Fetch all tables (not just available ones, because customer might already be at the table)
  const { data: tablesResponse } = useQuery({
    queryKey: ['tables', user?.branch?.id],
    queryFn: () => tablesApi.getTables(user?.branch?.id),
    enabled: open && !!user?.branch?.id && orderType === OrderType.DINE_IN,
  });

  const tables = tablesResponse?.data || [];

  const userRole = user?.role?.name || '';
  const isWaiter = userRole === 'Waiter';

  // For waiters: show only unassigned tables and tables assigned to this waiter. Hide other waiters' tables.
  const visibleTables = useMemo(() => {
    if (!isWaiter) return tables;
    return tables.filter(
      (t: any) => !t.assignedWaiterId || t.assignedWaiterId === user?.id
    );
  }, [tables, isWaiter, user?.id]);

  // Auto-select table when tables are loaded and we have prefill data
  useEffect(() => {
    if (prefillData?.tableNumber && visibleTables.length > 0 && !selectedTable) {
      console.log('🔍 Looking for table:', prefillData.tableNumber);
      console.log('📋 Available tables:', visibleTables.map((t: any) => ({ id: t.id, number: t.number, status: t.status })));
      const targetNum = String(prefillData.tableNumber).trim().toLowerCase().replace(/^t/i, '');
      const matchingTable = visibleTables.find((t: any) => {
        const tableNum = String(t.number || '').trim().toLowerCase().replace(/^t/i, '');
        return tableNum === targetNum || String(t.number) === String(prefillData.tableNumber);
      });
      console.log('✅ Found matching table:', matchingTable);
      if (matchingTable) {
        setSelectedTable(matchingTable.id);
        console.log('🎯 Auto-selected table:', matchingTable.number);
      } else {
        console.log('❌ No matching table found for:', prefillData.tableNumber);
      }
    }
  }, [prefillData?.tableNumber, visibleTables, selectedTable]);

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: ordersApi.createOrder,
    onSuccess: async (data) => {
      console.log('📦 Order created successfully:', data);
      console.log('🔍 Checking for callId in prefillData:', prefillData);
      
      setOrderNumber(data.orderNumber);
      setCreatedOrderType(orderType);
      setIsSuccess(true);
      clearCart();
      
      // If this order was created from a waiter call, complete the call
      if (prefillData?.callId) {
        console.log('✅ Found callId, attempting to complete waiter call:', prefillData.callId);
        try {
          const result = await waiterCallsApi.completeCall(prefillData.callId, 'Order processed at POS');
          console.log('✅ Waiter call completed successfully:', result);
          queryClient.invalidateQueries({ queryKey: ['waiter-calls-active'] });
          queryClient.invalidateQueries({ queryKey: ['waiter-calls'] });
          toast.success('Order sent to kitchen and call completed!');
        } catch (error) {
          console.error('❌ Failed to complete waiter call:', error);
          // Don't show error to user, order was successful
        }
      } else {
        console.log('⚠️ No callId found in prefillData');
      }
      
      // Call onSuccess callback to clear prefill data
      if (onSuccess) {
        onSuccess();
      }
      
      toast.success(
        orderType === OrderType.DINE_IN 
          ? 'Order sent to kitchen!' 
          : 'Order placed successfully!'
      );
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
      // For dine-in, create order WITHOUT payment (traditional restaurant)
      // For takeaway/delivery, payment can be optional or required
      paymentMethod: orderType === OrderType.DINE_IN ? undefined : paymentMethod,
      paymentStatus: orderType === OrderType.DINE_IN ? 'UNPAID' : undefined,
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
    const isDineIn = createdOrderType === OrderType.DINE_IN;
    
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isDineIn ? 'Order Sent to Kitchen!' : 'Order Placed!'}
            </h2>
            <p className="text-gray-600 mb-4">Order #{orderNumber}</p>
            
            {isDineIn ? (
              // Dine-in: Show unpaid status
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium mb-2">Payment Status</p>
                <Badge className="bg-orange-100 text-orange-700 border-orange-300">
                  UNPAID - Collect After Service
                </Badge>
                <p className="text-sm text-blue-700 mt-3">
                  Order Total: <strong>{total.toFixed(2)} ብር</strong>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Payment will be collected when customer requests bill
                </p>
              </div>
            ) : (
              // Takeaway/Delivery: Show paid status
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-green-600">{total.toFixed(2)} ብር</p>
                <Badge className="bg-green-100 text-green-700 border-green-300 mt-2">
                  PAID - {paymentMethod}
                </Badge>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                <Printer className="w-4 h-4 mr-2" />
                Print {isDineIn ? 'Kitchen Ticket' : 'Receipt'}
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
      <DialogContent className="sm:max-w-lg max-h-[92vh] overflow-y-auto" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Checkout</DialogTitle>
          <DialogDescription>Complete order details and send to kitchen</DialogDescription>
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
                  {visibleTables.map((table: any) => {
                    const isMine = table.assignedWaiterId === user?.id;
                    return (
                      <SelectItem key={table.id} value={table.id}>
                        Table {table.number} ({table.capacity} seats) {isMine ? '• [My Table]' : '• [Unassigned]'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Payment Method - Only for TAKEAWAY and DELIVERY */}
          {orderType !== OrderType.DINE_IN && (
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
                  <Banknote className={`w-6 h-6 ${paymentMethod === 'CASH' ? 'text-green-600' : 'text-gray-700'}`} />
                  <span className={`text-xs font-medium ${paymentMethod === 'CASH' ? 'text-gray-900' : 'text-gray-700'}`}>Cash</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'CARD'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <CreditCard className={`w-6 h-6 ${paymentMethod === 'CARD' ? 'text-green-600' : 'text-gray-700'}`} />
                  <span className={`text-xs font-medium ${paymentMethod === 'CARD' ? 'text-gray-900' : 'text-gray-700'}`}>Card</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('MOBILE')}
                  className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    paymentMethod === 'MOBILE'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <Smartphone className={`w-6 h-6 ${paymentMethod === 'MOBILE' ? 'text-green-600' : 'text-gray-700'}`} />
                  <span className={`text-xs font-medium ${paymentMethod === 'MOBILE' ? 'text-gray-900' : 'text-gray-700'}`}>Mobile</span>
                </button>
              </div>
            </div>
          )}

          {/* Dine-in Notice */}
          {orderType === OrderType.DINE_IN && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Order will be sent to kitchen. Payment will be collected after service.
              </p>
            </div>
          )}

          {/* Order Summary with Meals List */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-2">
              <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Utensils className="w-4 h-4 text-emerald-600" />
                Ordered Meals ({items.reduce((sum, item) => sum + item.quantity, 0)})
              </h3>
              <span className="text-xs text-gray-500 font-medium">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>

            {/* List of meals being ordered */}
            <div className="max-h-44 overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                  <div className="flex-1 pr-2">
                    <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {item.quantity}x
                      </span>
                      <span>{item.menuItem?.name || 'Dish'}</span>
                      {item.variant?.name && (
                        <span className="text-[10px] text-gray-500 font-normal">({item.variant.name})</span>
                      )}
                    </div>
                    {item.specialInstructions && (
                      <p className="text-[11px] text-gray-500 italic pl-6.5 mt-0.5">
                        Note: {item.specialInstructions}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-bold text-gray-900">
                      {(item.unitPrice * item.quantity).toFixed(2)} ብር
                    </span>
                    <p className="text-[10px] text-gray-400">
                      {item.unitPrice.toFixed(2)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pricing breakdown */}
            <div className="border-t border-gray-200/80 pt-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium text-gray-900">{subtotal.toFixed(2)} ብር</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (15%)</span>
                <span className="font-medium text-gray-900">{tax.toFixed(2)} ብር</span>
              </div>
              <div className="flex justify-between text-base font-extrabold border-t border-gray-200/90 pt-2 text-gray-900">
                <span>Total Payable</span>
                <span className="text-emerald-700">{total.toFixed(2)} ብር</span>
              </div>
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
              {createOrderMutation.isPending 
                ? 'Processing...' 
                : orderType === OrderType.DINE_IN 
                  ? 'Send to Kitchen' 
                  : 'Place Order & Pay'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
