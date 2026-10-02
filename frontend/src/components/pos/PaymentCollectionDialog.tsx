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
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Banknote, Upload, CheckCircle, Loader2, Camera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import uploadApi from '../../api/upload';

interface PaymentCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billRequest: {
    id: string;
    selectedItems: {
      orderId: string;
      orderNumber: string;
      items: Array<{
        id: string;
        name: string;
        quantity: number;
        price: number;
        subtotal: number;
      }>;
      subtotal: number;
      tax: number;
      total: number;
    };
    table: {
      id: string;
      number: string;
    };
  };
  onPaymentComplete: () => void;
}

type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MOBILE' | 'TELEBIRR' | 'CBE_BIRR';

export default function PaymentCollectionDialog({
  open,
  onOpenChange,
  billRequest,
  onPaymentComplete,
}: PaymentCollectionDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amount, setAmount] = useState<string>(billRequest.selectedItems.total.toFixed(2));
  const [amountReceived, setAmountReceived] = useState<string>('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const change = paymentMethod === 'CASH' && amountReceived
    ? Math.max(0, parseFloat(amountReceived) - parseFloat(amount))
    : 0;

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProofImage(null);
    setProofImagePreview('');
  };

  // Collect payment mutation
  const collectPaymentMutation = useMutation({
    mutationFn: async () => {
      let proofImageUrl = '';

      // Upload image if provided (for transfer payments)
      if (proofImage) {
        setIsUploading(true);
        try {
          const uploadResult = await uploadApi.uploadImage(proofImage);
          proofImageUrl = uploadResult.url;
        } catch (error) {
          throw new Error('Failed to upload payment proof');
        } finally {
          setIsUploading(false);
        }
      }

      // Collect payment
      const paymentData: any = {
        orderId: billRequest.selectedItems.orderId,
        amount: parseFloat(amount),
        method: paymentMethod,
        notes,
      };

      if (paymentMethod === 'CASH' && amountReceived) {
        paymentData.amountReceived = parseFloat(amountReceived);
      }

      if (proofImageUrl) {
        paymentData.proofImageUrl = proofImageUrl;
      }

      if (transactionRef) {
        paymentData.transactionRef = transactionRef;
      }

      const response = await apiClient.post('/payments/collect', paymentData);

      // Complete bill request
      await apiClient.patch(`/bill-requests/${billRequest.id}/complete`, {
        notes: `Payment collected: ${paymentMethod}`,
      });

      return response.data;
    },
    onSuccess: (data) => {
      setIsSuccess(true);
      toast.success('Payment collected successfully!');
      onPaymentComplete();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to collect payment');
    },
  });

  const handleCollectPayment = () => {
    // Validation
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (paymentMethod === 'CASH') {
      if (!amountReceived || parseFloat(amountReceived) < parseFloat(amount)) {
        toast.error('Amount received must be greater than or equal to payment amount');
        return;
      }
    }

    if (['BANK_TRANSFER', 'MOBILE', 'TELEBIRR', 'CBE_BIRR'].includes(paymentMethod)) {
      if (!proofImage) {
        toast.error('Please upload payment proof for digital payments');
        return;
      }
    }

    collectPaymentMutation.mutate();
  };

  const handleClose = () => {
    if (!collectPaymentMutation.isPending && !isUploading) {
      setIsSuccess(false);
      setPaymentMethod('CASH');
      setAmount(billRequest.selectedItems.total.toFixed(2));
      setAmountReceived('');
      setProofImage(null);
      setProofImagePreview('');
      setTransactionRef('');
      setNotes('');
      onOpenChange(false);
    }
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
              Payment Collected!
            </h2>
            <p className="text-gray-600 mb-4">
              Order #{billRequest.selectedItems.orderNumber} - Table {billRequest.table.number}
            </p>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">Amount Collected</p>
              <p className="text-3xl font-bold text-green-600">{amount} ብር</p>
              <Badge className="mt-2 bg-green-100 text-green-700 border-green-300">
                {paymentMethod}
              </Badge>
            </div>

            {paymentMethod === 'CASH' && change > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-orange-800 font-medium">Change to Return</p>
                <p className="text-2xl font-bold text-orange-700">{change.toFixed(2)} ብር</p>
              </div>
            )}

            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Payment Collection View
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Collect Payment - Table {billRequest.table.number}</DialogTitle>
          <DialogDescription>
            Order #{billRequest.selectedItems.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Bill Amount</h3>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-green-600">{billRequest.selectedItems.total.toFixed(2)} ብር</span>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-2 block">
              Payment Method
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'CASH'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Banknote className="w-6 h-6" />
                <span className="text-sm font-medium">Cash</span>
              </button>
              <button
                onClick={() => setPaymentMethod('BANK_TRANSFER')}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'BANK_TRANSFER'
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Upload className="w-6 h-6" />
                <span className="text-sm font-medium">Transfer</span>
              </button>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <Label htmlFor="amount">Payment Amount (ብር)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          {/* Cash Payment Fields */}
          {paymentMethod === 'CASH' && (
            <>
              <div>
                <Label htmlFor="amountReceived">Amount Received (ብር)</Label>
                <Input
                  id="amountReceived"
                  type="number"
                  step="0.01"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              {amountReceived && parseFloat(amountReceived) >= parseFloat(amount) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium mb-1">Change</p>
                  <p className="text-2xl font-bold text-green-700">{change.toFixed(2)} ብር</p>
                </div>
              )}
            </>
          )}

          {/* Transfer Payment Fields */}
          {['BANK_TRANSFER', 'MOBILE', 'TELEBIRR', 'CBE_BIRR'].includes(paymentMethod) && (
            <>
              <div>
                <Label htmlFor="proofImage">Payment Proof (Required)</Label>
                <div className="mt-2">
                  {proofImagePreview ? (
                    <div className="relative">
                      <img
                        src={proofImagePreview}
                        alt="Payment proof"
                        className="w-full h-48 object-cover rounded-lg border"
                      />
                      <button
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                      <Camera className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Click to upload photo</span>
                      <input
                        id="proofImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="transactionRef">Transaction Reference (Optional)</Label>
                <Input
                  id="transactionRef"
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g., TXN123456789"
                />
              </div>
            </>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={collectPaymentMutation.isPending || isUploading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleCollectPayment}
              disabled={collectPaymentMutation.isPending || isUploading}
            >
              {collectPaymentMutation.isPending || isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isUploading ? 'Uploading...' : 'Processing...'}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Collect Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
