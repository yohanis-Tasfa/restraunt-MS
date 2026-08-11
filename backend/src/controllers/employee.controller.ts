import { Request, Response } from 'express';
import { employeeService } from '../services/employee.service';

export const employeeController = {
  // Create employee
  async createEmployee(req: Request, res: Response) {
    try {
      const employee = await employeeService.createEmployee(req.body);
      res.status(201).json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Get all employees
  async getAllEmployees(req: Request, res: Response) {
    try {
      const { department, status, employmentType, search, page, limit } = req.query;

      const result = await employeeService.getAllEmployees({
        department: department as string,
        status: status as any,
        employmentType: employmentType as any,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get employee by ID
  async getEmployeeById(req: Request, res: Response) {
    try {
      const employee = await employeeService.getEmployeeById(req.params.id);
      res.json(employee);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  // Update employee
  async updateEmployee(req: Request, res: Response) {
    try {
      const employee = await employeeService.updateEmployee(req.params.id, req.body);
      res.json(employee);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Delete employee
  async deleteEmployee(req: Request, res: Response) {
    try {
      const result = await employeeService.deleteEmployee(req.params.id);
      res.json(result);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  // Get employee statistics
  async getEmployeeStats(req: Request, res: Response) {
    try {
      const stats = await employeeService.getEmployeeStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  // Payroll endpoints
  async createPayroll(req: Request, res: Response) {
    try {
      const payroll = await employeeService.createPayroll(req.body);
      res.status(201).json(payroll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async getPayrolls(req: Request, res: Response) {
    try {
      const { employeeId, period, status, page, limit } = req.query;

      const result = await employeeService.getPayrolls({
        employeeId: employeeId as string,
        period: period ? new Date(period as string) : undefined,
        status: status as any,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updatePayrollStatus(req: Request, res: Response) {
    try {
      const { status } = req.body;
      const payroll = await employeeService.updatePayrollStatus(req.params.id, status);
      res.json(payroll);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  // Attendance endpoints
  async getAttendance(req: Request, res: Response) {
    try {
      const { userId, startDate, endDate, page, limit } = req.query;

      const result = await employeeService.getAttendance({
        userId: userId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async markAttendance(req: Request, res: Response) {
    try {
      const attendance = await employeeService.markAttendance(req.body);
      res.status(201).json(attendance);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};
