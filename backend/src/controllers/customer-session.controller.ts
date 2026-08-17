import { Request, Response, NextFunction } from 'express';
import { customerSessionService } from '../services/customer-session.service';

export const customerSessionController = {
  // Create a new customer session (when customer scans QR code)
  async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrCodeData, customerName, customerPhone, guestCount } = req.body;

      if (!qrCodeData) {
        return res.status(400).json({ message: 'QR code data is required' });
      }

      const session = await customerSessionService.createSession({
        qrCodeData,
        customerName,
        customerPhone,
        guestCount: guestCount || 1,
      });

      res.status(201).json(session);
    } catch (error) {
      next(error);
    }
  },

  // Get session by ID
  async getSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const session = await customerSessionService.getSessionById(id);

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  },

  // Get session by QR code
  async getSessionByQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { qrCode } = req.params;
      const session = await customerSessionService.getSessionByQRCode(qrCode);

      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  },

  // Get active session for a table
  async getActiveSessionByTable(req: Request, res: Response, next: NextFunction) {
    try {
      const { tableId } = req.params;
      const session = await customerSessionService.getActiveSessionByTable(tableId);

      if (!session) {
        return res.status(404).json({ message: 'No active session found for this table' });
      }

      res.json(session);
    } catch (error) {
      next(error);
    }
  },

  // Update session (add items, update guest count, etc.)
  async updateSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const session = await customerSessionService.updateSession(id, updateData);

      res.json(session);
    } catch (error) {
      next(error);
    }
  },

  // End session (when order is completed or customer leaves)
  async endSession(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const session = await customerSessionService.endSession(id);

      res.json(session);
    } catch (error) {
      next(error);
    }
  },

  // Get all sessions with filters
  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const {
        tableId,
        status,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = req.query;

      const result = await customerSessionService.getSessions({
        tableId: tableId as string,
        status: status as 'ACTIVE' | 'COMPLETED' | 'ABANDONED',
        startDate: startDate as string,
        endDate: endDate as string,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      });

      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  // Get session statistics
  async getSessionStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { branchId, startDate, endDate } = req.query;

      const stats = await customerSessionService.getSessionStats({
        branchId: branchId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      res.json(stats);
    } catch (error) {
      next(error);
    }
  },
};
