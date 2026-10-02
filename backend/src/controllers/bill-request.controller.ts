import { Request, Response } from 'express';
import billRequestService from '../services/bill-request.service';

/**
 * Customer creates a bill request
 * POST /api/bill-requests
 */
export const createBillRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, sessionId, tableId, waiterId } = req.body;

    if (!orderId || !sessionId || !tableId || !waiterId) {
      res.status(400).json({
        message: 'orderId, sessionId, tableId, and waiterId are required',
      });
      return;
    }

    const billRequest = await billRequestService.createBillRequest({
      orderId,
      sessionId,
      tableId,
      waiterId,
    });

    res.status(201).json(billRequest);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create bill request' });
  }
};

/**
 * Get pending bill requests for the authenticated waiter
 * GET /api/bill-requests/pending
 */
export const getPendingBillRequests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    const requests = await billRequestService.getPendingBillRequests(user.id);

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get bill requests' });
  }
};

/**
 * Get all pending bill requests (for managers)
 * GET /api/bill-requests/all
 */
export const getAllPendingBillRequests = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const branchId = req.query.branchId as string | undefined;

    const requests = await billRequestService.getAllPendingBillRequests(
      branchId || user.branchId
    );

    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get bill requests' });
  }
};

/**
 * Acknowledge a bill request (waiter is on the way)
 * PATCH /api/bill-requests/:id/acknowledge
 */
export const acknowledgeBillRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const billRequest = await billRequestService.acknowledgeBillRequest(id as string);

    res.json(billRequest);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to acknowledge bill request' });
  }
};

/**
 * Complete a bill request (after payment collected)
 * PATCH /api/bill-requests/:id/complete
 */
export const completeBillRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const billRequest = await billRequestService.completeBillRequest(id as string, notes);

    res.json(billRequest);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to complete bill request' });
  }
};

/**
 * Get bill request by ID
 * GET /api/bill-requests/:id
 */
export const getBillRequestById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const billRequest = await billRequestService.getBillRequestById(id as string);

    if (!billRequest) {
      res.status(404).json({ message: 'Bill request not found' });
      return;
    }

    res.json(billRequest);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to get bill request' });
  }
};
