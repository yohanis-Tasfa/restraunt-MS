import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { billRequestsApi, type BillRequest } from '../../api/billRequests';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Printer, Download, CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';

interface BillGeneratorProps {
  billRequest: BillRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function BillGenerator({ billRequest, open, onOpenChange }: BillGeneratorProps) {
  const queryClient = useQueryClient();
  const billRef = useRef<HTMLDivElement>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const order = billRequest.order;
  const restaurant = order?.branch?.restaurant;

  // Complete bill request mutation
  const completeMutation = useMutation({
    mutationFn: (billId?: string) => billRequestsApi.complete(billRequest.id, billId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
      toast.success('Bill generated and request completed');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete bill request');
    },
  });

  // Print handler
  const handlePrint = useReactToPrint({
    contentRef: billRef,
    documentTitle: `Bill-${order?.orderNumber || 'UNKNOWN'}`,
    onBeforePrint: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      // After printing, mark as completed
      if (window.confirm('Bill printed successfully. Mark as completed?')) {
        completeMutation.mutate(`BILL-${Date.now()}`);
      }
    },
  });

  const handleDownloadPDF = () => {
    // For now, just trigger print which can save as PDF
    handlePrint();
  };

  const handleCompleteWithoutPrint = () => {
    if (window.confirm('Complete this bill request without printing?')) {
      completeMutation.mutate(undefined);
    }
  };

  if (!order) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Bill</DialogTitle>
          <DialogDescription>
            Review and print the bill for {billRequest.table?.number ? `Table ${billRequest.table.number}` : 'this order'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Bill Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div ref={billRef} className="bg-white p-8 max-w-2xl mx-auto">
              {/* Restaurant Header */}
              <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
                {restaurant?.logo && (
                  <img
                    src={restaurant.logo}
                    alt={restaurant.name}
                    className="w-20 h-20 mx-auto mb-2 rounded-full"
                  />
                )}
                <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name || 'Restaurant'}</h1>
                {restaurant?.address && (
                  <p className="text-sm text-gray-600">{restaurant.address}</p>
                )}
                {restaurant?.phone && (
                  <p className="text-sm text-gray-600">Tel: {restaurant.phone}</p>
                )}
              </div>

              {/* Bill Info */}
              <div className="mb-4 text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Bill Date:</span>
                  <span className="font-medium text-gray-900">{format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium text-gray-900">{order.orderNumber}</span>
                </div>
                {billRequest.table && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Table:</span>
                    <span className="font-medium text-gray-900">{billRequest.table.number}</span>
                  </div>
                )}
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Served By:</span>
                  <span className="font-medium text-gray-900">
                    {billRequest.requestedBy?.firstName} {billRequest.requestedBy?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cashier:</span>
                  <span className="font-medium text-gray-900">
                    {billRequest.processedBy?.firstName} {billRequest.processedBy?.lastName}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-4">
                <table className="w-full text-sm">
                  <thead className="border-b-2 border-gray-800">
                    <tr>
                      <th className="text-left py-2 text-gray-900">Item</th>
                      <th className="text-center py-2 text-gray-900">Qty</th>
                      <th className="text-right py-2 text-gray-900">Price</th>
                      <th className="text-right py-2 text-gray-900">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(order.items || []).map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2 text-gray-900">{item.menuItem?.name || 'Unknown'}</td>
                        <td className="text-center py-2 text-gray-900">{item.quantity}</td>
                        <td className="text-right py-2 text-gray-900">{item.price.toFixed(2)}</td>
                        <td className="text-right py-2 text-gray-900">{item.subtotal.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="border-t-2 border-gray-800 pt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{order.subtotal.toFixed(2)} {restaurant?.currency || 'ETB'}</span>
                </div>
                {order.tax > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax ({restaurant?.taxRate || 0}%):</span>
                    <span className="font-medium text-gray-900">{order.tax.toFixed(2)} {restaurant?.currency || 'ETB'}</span>
                  </div>
                )}
                {order.serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Service Charge:</span>
                    <span className="font-medium text-gray-900">{order.serviceCharge.toFixed(2)} {restaurant?.currency || 'ETB'}</span>
                  </div>
                )}
                {order.discount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{order.discount.toFixed(2)} {restaurant?.currency || 'ETB'}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-2 mt-2 text-gray-900">
                  <span>TOTAL:</span>
                  <span>{order.total.toFixed(2)} {restaurant?.currency || 'ETB'}</span>
                </div>
              </div>

              {/* Payment Status */}
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className={`font-medium ${
                    order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-300 text-center text-xs text-gray-600">
                <p>Thank you for dining with us!</p>
                <p className="mt-1">Please come again</p>
              </div>

              {/* Print Timestamp */}
              <div className="mt-4 text-center text-xs text-gray-400">
                Printed: {format(new Date(), 'MMM dd, yyyy HH:mm:ss')}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={handlePrint}
              disabled={isPrinting || completeMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Printing...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Print Bill
                </>
              )}
            </Button>

            <Button
              onClick={handleDownloadPDF}
              disabled={isPrinting || completeMutation.isPending}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Save as PDF
            </Button>

            <Button
              onClick={handleCompleteWithoutPrint}
              disabled={completeMutation.isPending}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete
            </Button>
          </div>

          {/* Note */}
          <p className="text-xs text-gray-500 text-center">
            After printing, you'll be prompted to mark this request as completed
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
