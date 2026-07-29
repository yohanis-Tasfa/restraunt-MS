export interface CreatePaymentData {
  orderId: string;
  amount: number;
  method: 'CASH' | 'CARD' | 'MOBILE' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER';
  reference?: string;
}

export interface RefundPaymentData {
  reason: string;
  amount?: number;
}

export interface PaymentQueryParams {
  page?: number;
  limit?: number;
  orderId?: string;
  method?: string;
  startDate?: string;
  endDate?: string;
}
