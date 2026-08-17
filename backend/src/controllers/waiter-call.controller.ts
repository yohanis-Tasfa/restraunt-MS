import { Request, Response, NextFunction } from 'express';
import { waiterCallService } from '../services/waiter-call.service';

export const waiterCallController = {
  // Create a new waiter call (customer calls waiter)
  async createCall(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId, requestType, selectedItems } = req.body;

      if (!sessionId) {
        return res.status(400).json({ message: 'Session ID is required' });
      }

      const call = await waiterCallService.createCall({
        sessionId,
        requestType: requestType || 'ASSISTANCE',
        selectedItems,
      });

      res.status(201).json(call);
    } catch (error) {
      next(error);
    }
  },

  // Get call by ID
  async getCall(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const call = await waiterCallService.getCallById(id);

      if (!call) {
        return res.status(404).json({ message: 'Waiter call not found' });
      }

      res.json(call);
    } catch (error) {
      next(error);
    }
  },

  // Get calls for a waiter
  async getCallsForWaiter(req: Request, res: Response, next: NextFunction) {
    try {
      const { waiterId } = req.params;
      const { status } = req.query;

      const calls = await waiterCallService.getCallsForWaiter(
        waiterId,
        status as 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED' | 'CANCELLED'
      );

      res.json(calls);
    } catch (error) {
      next(error);
    }
  },

  // Get calls for a session
  async getCallsForSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { sessionId } = req.params;
      const calls = await waiterCallService.getCallsForSession(sessionId);

      res.json(calls);
    } catch (error) {
      next(error);
    }
  },

  // Update call status (waiter acknowledges or completes)
  async updateCallStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const waiterId = req.user?.id;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      const call = await waiterCallService.updateCallStatus(id, status, waiterId, notes);

      res.json(call);
    } catch (error) {
      next(error);
    }
  },

  // Cancel call
  async cancelCall(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const call = await waiterCallService.cancelCall(id, reason);

      res.json(call);
    } catch (error) {
      next(error);
    }
  },

  // Get pending calls for a branch
  async getPendingCallsByBranch(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId } = req.params;
      const calls = await waiterCallService.getPendingCallsByBranch(branchId);

      res.json(calls);
    } catch (error) {
      next(error);
    }
  },

  // Get call statistics
  async getCallStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { waiterId, branchId, startDate, endDate } = req.query;

      const stats = await waiterCallService.getCallStats({
        waiterId: waiterId as string,
        branchId: branchId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.json(stats);
    } catch (error) {
      next(error);
    }
  },

  // Get all calls with filters
  async getAllCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, requestType, tableId, waiterId, startDate, endDate, limit, offset } = req.query;
      const branchId = req.user?.branchId;

      const result = await waiterCallService.getAllCalls({
        status: status as any,
        requestType: requestType as any,
        tableId: tableId as string,
        waiterId: waiterId as string,
        branchId: branchId as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get active calls (PENDING or ACKNOWLEDGED)
  async getActiveCalls(req: Request, res: Response, next: NextFunction) {
    try {
      const branchId = req.user?.branchId;
      const calls = await waiterCallService.getActiveCalls(branchId);

      res.json(calls);
    } catch (error) {
      next(error);
    }
  },

  // Get calls for a table
  async getCallsForTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.params;
      const calls = await waiterCallService.getCallsForTable(tableId);

      res.json(calls);
    } catch (error) {
      next(error);
    }
  },

  // Acknowledge call
  async acknowledgeCall(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const waiterId = req.user?.id;

      const call = await waiterCallService.updateCallStatus(id, 'ACKNOWLEDGED', waiterId, notes);

      res.json(call);
    } catch (error) {
      next(error);
    }
  },

  // Complete call
  async completeCall(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const waiterId = req.user?.id;

      const call = await waiterCallService.updateCallStatus(id, 'COMPLETED', waiterId, notes);

      res.json(call);
    } catch (error) {
      next(error);
    }
  },

  // Update call notes
  async updateNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const call = await waiterCallService.updateNotes(id, notes);

      res.json(call);
    } catch (error) {
      next(error);
    }
  },
};
