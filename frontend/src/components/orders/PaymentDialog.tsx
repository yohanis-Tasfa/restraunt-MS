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
import { uploadApi } from '../../api/upload';
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

  // Upload image to backend (which uploads to Cloudinary)
  const uploadImageToCloudinary = async (file: File): Promise<string> => {
    try {
      const result = await uploadApi.uploadPaymentProof(file);
      return result.url;
    } catch (error: any) {
      console.error('Upload error:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload image');
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
        <DialogContent className="sm:max-w-md bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-[#0c2219] flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600 dark:text-[#00e676]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Payment Successful!</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Order #{order.orderNumber}</p>
            
            <div className="bg-gray-50 dark:bg-[#071a12] border border-gray-200 dark:border-[#143225] rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
              <p className="text-3xl font-extrabold text-green-600 dark:text-[#00e676]">{parseFloat(amount).toFixed(2)} ETB</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                Payment Method: <strong className="text-gray-900 dark:text-white">{paymentMethod}</strong>
              </p>
              {transactionRef && (
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Reference: <strong className="text-gray-900 dark:text-white">{transactionRef}</strong>
                </p>
              )}
              {proofImagePreview && (
                <p className="text-sm text-green-600 dark:text-[#00e676] mt-2">
                  Payment proof uploaded
                </p>
              )}
            </div>

            {order.table && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Table {order.table.number}</strong> - You can now end the session and clear the table
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
                onClick={handlePrintReceipt}
              >
                <Printer className="w-4 h-4 mr-2" />
                Print Receipt
              </Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold" onClick={handleClose}>
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-white">Process Payment</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Process payment for Order #{order.orderNumber}
            {order.table && ` - Table ${order.table.number}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-[#071a12] border border-gray-200 dark:border-[#143225] rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                <span className="font-medium text-gray-900 dark:text-white">{order.subtotal.toFixed(2)} ETB</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tax</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.tax.toFixed(2)} ETB</span>
                </div>
              )}
              {order.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Service Charge</span>
                  <span className="font-medium text-gray-900 dark:text-white">{order.serviceCharge.toFixed(2)} ETB</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-[#00e676]">
                  <span>Discount</span>
                  <span className="font-medium">-{order.discount.toFixed(2)} ETB</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-[#143225] pt-2 mt-2">
                <span className="text-gray-900 dark:text-white">Total Amount</span>
                <span className="text-green-600 dark:text-[#00e676]">{order.total.toFixed(2)} ETB</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <Label className="mb-3 block text-gray-900 dark:text-gray-200">Select Payment Method</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod(PaymentMethod.CASH)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  paymentMethod === PaymentMethod.CASH
                    ? 'border-green-600 dark:border-[#00e676] bg-green-50 dark:bg-[#123627]'
                    : 'border-gray-200 dark:border-[#143225] bg-white dark:bg-[#0c2219] hover:border-gray-300 dark:hover:border-[#1b4b35]'
                }`}
              >
                <Banknote className={`w-8 h-8 ${paymentMethod === PaymentMethod.CASH ? 'text-green-600 dark:text-[#00e676]' : 'text-gray-700 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === PaymentMethod.CASH ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>Cash</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.TELEBIRR)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  paymentMethod === PaymentMethod.TELEBIRR
                    ? 'border-green-600 dark:border-[#00e676] bg-green-50 dark:bg-[#123627]'
                    : 'border-gray-200 dark:border-[#143225] bg-white dark:bg-[#0c2219] hover:border-gray-300 dark:hover:border-[#1b4b35]'
                }`}
              >
                <Smartphone className={`w-8 h-8 ${paymentMethod === PaymentMethod.TELEBIRR ? 'text-green-600 dark:text-[#00e676]' : 'text-gray-700 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === PaymentMethod.TELEBIRR ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>Telebirr</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.CBE_BIRR)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  paymentMethod === PaymentMethod.CBE_BIRR
                    ? 'border-green-600 dark:border-[#00e676] bg-green-50 dark:bg-[#123627]'
                    : 'border-gray-200 dark:border-[#143225] bg-white dark:bg-[#0c2219] hover:border-gray-300 dark:hover:border-[#1b4b35]'
                }`}
              >
                <Smartphone className={`w-8 h-8 ${paymentMethod === PaymentMethod.CBE_BIRR ? 'text-green-600 dark:text-[#00e676]' : 'text-gray-700 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === PaymentMethod.CBE_BIRR ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>CBE Birr</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.CARD)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  paymentMethod === PaymentMethod.CARD
                    ? 'border-green-600 dark:border-[#00e676] bg-green-50 dark:bg-[#123627]'
                    : 'border-gray-200 dark:border-[#143225] bg-white dark:bg-[#0c2219] hover:border-gray-300 dark:hover:border-[#1b4b35]'
                }`}
              >
                <CreditCard className={`w-8 h-8 ${paymentMethod === PaymentMethod.CARD ? 'text-green-600 dark:text-[#00e676]' : 'text-gray-700 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === PaymentMethod.CARD ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>Card</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.BANK_TRANSFER)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  paymentMethod === PaymentMethod.BANK_TRANSFER
                    ? 'border-green-600 dark:border-[#00e676] bg-green-50 dark:bg-[#123627]'
                    : 'border-gray-200 dark:border-[#143225] bg-white dark:bg-[#0c2219] hover:border-gray-300 dark:hover:border-[#1b4b35]'
                }`}
              >
                <Building2 className={`w-8 h-8 ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'text-green-600 dark:text-[#00e676]' : 'text-gray-700 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === PaymentMethod.BANK_TRANSFER ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>Bank Transfer</span>
              </button>

              <button
                onClick={() => setPaymentMethod(PaymentMethod.MOBILE)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors cursor-pointer ${
                  paymentMethod === PaymentMethod.MOBILE
                    ? 'border-green-600 dark:border-[#00e676] bg-green-50 dark:bg-[#123627]'
                    : 'border-gray-200 dark:border-[#143225] bg-white dark:bg-[#0c2219] hover:border-gray-300 dark:hover:border-[#1b4b35]'
                }`}
              >
                <Smartphone className={`w-8 h-8 ${paymentMethod === PaymentMethod.MOBILE ? 'text-green-600 dark:text-[#00e676]' : 'text-gray-700 dark:text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === PaymentMethod.MOBILE ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>Mobile Money</span>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="amount" className="text-gray-900 dark:text-gray-200">Payment Amount (ETB) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Order total: {order.total.toFixed(2)} ETB
            </p>
          </div>

          {/* Payment Proof Upload for Digital Payments */}
          {requiresProof() && (
            <div className="border-2 border-dashed border-amber-300 dark:border-amber-600/50 rounded-xl p-4 bg-amber-50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3 mb-3">
                <Camera className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div>
                  <Label className="text-amber-900 dark:text-amber-300 font-semibold">
                    Upload Payment Proof * (Required)
                  </Label>
                  <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-1">
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
                    <div className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-[#143225] rounded-xl p-6 text-center hover:border-green-500 dark:hover:border-[#00e676] bg-white/50 dark:bg-[#071a12]/50 transition-colors">
                      <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                        Click to upload screenshot
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    Proof uploaded
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transaction Reference (for digital payments) */}
          {requiresProof() && (
            <div>
              <Label htmlFor="transactionRef" className="text-gray-900 dark:text-gray-200">Transaction Reference Number</Label>
              <Input
                id="transactionRef"
                placeholder="Enter transaction ref from screenshot"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                className="mt-1 bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Optional: Copy the transaction ID from the payment screenshot
              </p>
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <Label htmlFor="notes" className="text-gray-900 dark:text-gray-200">Additional Notes (Optional)</Label>
            <Input
              id="notes"
              placeholder="Any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={processPaymentMutation.isPending || isUploadingImage}
            className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleProcessPayment}
            disabled={processPaymentMutation.isPending || isUploadingImage}
            className="bg-green-600 hover:bg-green-700 text-white font-bold"
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
