import { useState, useRef } from 'react';
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
import { 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  Printer, 
  Upload, 
  X, 
  Camera,
  ImageIcon 
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order } from '../../api/orders';
import axios from 'axios';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

export default function PaymentDialog({ open, onOpenChange, order }: PaymentDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');
  
  // Image upload states
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofImagePreview, setProofImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Set amount when order changes
  useState(() => {
    if (order) {
      setAmount(order.total.toFixed(2));
    }
  });

  // Upload image to Cloudinary
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'rms_payment_proofs'); // You'll need to create this preset in Cloudinary
    formData.append('folder', 'rms/payment-proofs');

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image');
    }
  };

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setProofImage(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = () => {
    setProofImage(null);
    setProofImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Check if payment method requires proof
  const requiresProof = () => {
    return [
      PaymentMethod.MOBILE,
      PaymentMethod.TELEBIRR,
      PaymentMethod.CBE_BIRR,
      PaymentMethod.BANK_TRANSFER,
      PaymentMethod.CARD
    ].includes(paymentMethod);
  };

  // Process payment mutation
  const processPaymentMutation = useMutation({
    mutationFn: async (data: {
      orderId: string;
      amount: number;
      method: PaymentMethod;
      reference?: string;
      proofImageUrl?: string;
      transactionRef?: string;
      notes?: string;
    }) => {
      return paymentsApi.createPayment(data);
    },
    onSuccess: async (data) => {
      setPaymentId(data.id);
      setIsSuccess(true);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      
      toast.success('Payment processed successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  const handleProcessPayment = async () => {
    if (!order) return;

    // Validate amount
    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    // Validate proof for digital payments
    if (requiresProof() && !proofImage) {
      toast.error(`Please upload payment proof screenshot for ${paymentMethod}`);
      return;
    }

    try {
      let proofImageUrl: string | undefined;

      // Upload image if present
      if (proofImage && requiresProof()) {
        setIsUploadingImage(true);
        toast.loading('Uploading payment proof...');
        proofImageUrl = await uploadImageToCloudinary(proofImage);
        toast.dismiss();
        toast.success('Payment proof uploaded!');
        setIsUploadingImage(false);
      }

      // Process payment
      processPaymentMutation.mutate({
        orderId: order.id,
        amount: paymentAmount,
        method: paymentMethod,
        reference: reference || undefined,
        proofImageUrl,
        transactionRef: transactionRef || undefined,
        notes: notes || undefined,
      });
    } catch (error) {
      setIsUploadingImage(false);
      toast.dismiss();
      toast.error('Failed to upload payment proof');
    }
  };

  const handleClose = () => {
    if (isSuccess) {
      setIsSuccess(false);
      setPaymentId('');
      setReference('');
      setTransactionRef('');
      setNotes('');
      setProofImage(null);
      setProofImagePreview(null);
      setPaymentMethod(PaymentMethod.CASH);
      if (order) {
        setAmount(order.total.toFixed(2));
      }
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
              <p className="text-3xl font-bold text-green-600">{parseFloat(amount).toFixed(2)} ETB</p>
              <p className="text-sm text-gray-600 mt-2">
                Payment Method: <strong>{paymentMethod}</strong>
              </p>
              {transactionRef && (
                <p className="text-sm text-gray-600">
                  Reference: <strong>{transactionRef}</strong>
                </p>
              )}
              {proofImagePreview && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Payment proof uploaded
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
                <span className="font-medium">{order.subtotal.toFixed(2)} ETB</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{order.tax.toFixed(2)} ETB</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Charge</span>
                  <span className="font-medium">{order.serviceCharge.toFixed(2)} ETB</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-{order.discount.toFixed(2)} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2 mt-2">
                <span>Total Amount</span>
                <span className="text-green-600">{order.total.toFixed(2)} ETB</span>
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
                onClick={() => setPaymentMethod(PaymentMethod.TELEBIRR)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === PaymentMethod.TELEBIRR
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-8 h-8" />
                <span className="text-sm font-medium">Telebirr</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.CBE_BIRR)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors ${
                  paymentMethod === PaymentMethod.CBE_BIRR
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <Smartphone className="w-8 h-8" />
                <span className="text-sm font-medium">CBE Birr</span>
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
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount">Payment Amount (ETB) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Order total: {order.total.toFixed(2)} ETB
            </p>
          </div>

          {/* Payment Proof Upload for Digital Payments */}
          {requiresProof() && (
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-4 bg-orange-50">
              <div className="flex items-start gap-3 mb-3">
                <Camera className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <Label className="text-orange-900 font-semibold">
                    Upload Payment Proof * (Required)
                  </Label>
                  <p className="text-xs text-orange-700 mt-1">
                    Take a photo of customer's payment confirmation screen showing amount, time, and transaction reference
                  </p>
                </div>
              </div>

              {!proofImagePreview ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    id="proof-upload"
                  />
                  <label htmlFor="proof-upload">
                    <div className="cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 font-medium">
                        Click to upload screenshot
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={proofImagePreview}
                    alt="Payment proof"
                    className="w-full rounded-lg border-2 border-green-500"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    ✓ Proof uploaded
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transaction Reference (for digital payments) */}
          {requiresProof() && (
            <div>
              <Label htmlFor="transactionRef">Transaction Reference Number</Label>
              <Input
                id="transactionRef"
                placeholder="Enter transaction ref from screenshot"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Copy the transaction ID from the payment screenshot
              </p>
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={processPaymentMutation.isPending || isUploadingImage}
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={processPaymentMutation.isPending || isUploadingImage}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUploadingImage 
              ? 'Uploading Proof...' 
              : processPaymentMutation.isPending 
              ? 'Processing...' 
              : `Pay ${amount || '0.00'} ETB`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
