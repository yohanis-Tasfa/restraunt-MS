export enum TipStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
}

export interface Tip {
  id: string;
  orderId: string;
  paymentId: string;
  waiterId: string;
  amount: number;
  method: string;
  status: TipStatus;
  paidAt?: Date;
  paidById?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  order?: any;
  payment?: any;
  waiter?: any;
  paidBy?: any;
}

export interface TipQueryParams {
  page?: number;
  limit?: number;
  waiterId?: string;
  status?: TipStatus;
  method?: string;
  startDate?: string;
  endDate?: string;
}

export interface MarkTipPaidData {
  notes?: string;
}
