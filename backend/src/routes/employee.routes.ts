import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Employee routes
router.post('/', employeeController.createEmployee);
router.get('/', employeeController.getAllEmployees);
router.get('/stats', employeeController.getEmployeeStats);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

// Payroll routes
router.post('/payroll', employeeController.createPayroll);
router.get('/payroll/list', employeeController.getPayrolls);
router.put('/payroll/:id/status', employeeController.updatePayrollStatus);

// Attendance routes
router.get('/attendance/list', employeeController.getAttendance);
router.post('/attendance', employeeController.markAttendance);

export default router;
