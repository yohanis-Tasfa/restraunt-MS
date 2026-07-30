import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  changePassword,
  resetPassword,
  updateUserStatus,
  getUserStats,
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ============ USER ROUTES ============

// GET /api/users/stats - Get user statistics
router.get('/stats', authorize(['Super Admin', 'Admin']), getUserStats);

// GET /api/users - Get all users
router.get('/', authorize(['Super Admin', 'Admin', 'Manager']), getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', authorize(['Super Admin', 'Admin', 'Manager']), getUserById);

// POST /api/users - Create new user
router.post('/', authorize(['Super Admin', 'Admin']), createUser);

// PUT /api/users/:id - Update user
router.put('/:id', authorize(['Super Admin', 'Admin']), updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', authorize(['Super Admin', 'Admin']), deleteUser);

// POST /api/users/:id/change-password - Change own password
router.post('/:id/change-password', changePassword);

// POST /api/users/:id/reset-password - Reset user password (Admin only)
router.post('/:id/reset-password', authorize(['Super Admin', 'Admin']), resetPassword);

// PATCH /api/users/:id/status - Update user status
router.patch('/:id/status', authorize(['Super Admin', 'Admin']), updateUserStatus);

// ============ ROLE ROUTES ============

// GET /api/users/roles/all - Get all roles
router.get('/roles/all', authorize(['Super Admin', 'Admin', 'Manager']), getAllRoles);

// GET /api/users/roles/:id - Get role by ID
router.get('/roles/:id', authorize(['Super Admin', 'Admin']), getRoleById);

// POST /api/users/roles - Create new role
router.post('/roles', authorize(['Super Admin']), createRole);

// PUT /api/users/roles/:id - Update role
router.put('/roles/:id', authorize(['Super Admin']), updateRole);

// DELETE /api/users/roles/:id - Delete role
router.delete('/roles/:id', authorize(['Super Admin']), deleteRole);

export default router;
