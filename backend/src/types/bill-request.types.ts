export enum BillRequestStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface CreateBillRequestData {
  orderId: string;
  tableId?: string;
  notes?: string;
}

export interface UpdateBillRequestData {
  status?: BillRequestStatus;
  notes?: string;
  billId?: string;
}

export interface BillRequestQueryParams {
  page?: number;
  limit?: number;
  status?: BillRequestStatus;
  requestedById?: string;
  processedById?: string;
  branchId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ProcessBillRequestData {
  notes?: string;
}
