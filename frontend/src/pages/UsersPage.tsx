import { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Key,
  Lock,
  Unlock,
  Edit2,
  Trash2,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Check,
  X,
  RefreshCw,
  Building2,
  Phone,
  Mail,
  UserCheck,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { usersApi } from '../api/users';
import type { AppUser, Role, CreateUserData, Branch } from '../api/users';
import { employeesApi } from '../api/employees';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);

  // Forms
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    phone: '',
    roleId: '',
    branchId: '',
    enrollPayroll: false,
    employeeCode: '',
    salary: 10000,
    bankProvider: 'Telebirr',
    bankAccountNumber: '',
    sendEmail: true,
  });

  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    roleId: '',
    branchId: '',
    salary: 10000,
    employeeCode: '',
    bankProvider: 'Telebirr',
    bankAccountNumber: '',
  });

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendEmailOnReset, setSendEmailOnReset] = useState(true);
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  // Load data
  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, rolesData, branchesData] = await Promise.all([
        usersApi.getAll({ search, roleId: roleFilter, status: statusFilter }),
        usersApi.getAllRoles().catch(() => []),
        usersApi.getBranches().catch(() => []),
      ]);

      setUsers(usersData.users);
      setRoles(rolesData);
      setBranches(branchesData);
    } catch (err: any) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter, statusFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Generate secure password
  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.roleId) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setActionLoading(true);
      const finalBankAccount = formData.bankAccountNumber.trim()
        ? `${formData.bankProvider}: ${formData.bankAccountNumber.trim()}`
        : undefined;

      const cleanBranchId = formData.branchId && formData.branchId.trim() ? formData.branchId.trim() : undefined;

      const payload: CreateUserData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim() || formData.email.split('@')[0],
        password: formData.password.trim(),
        phone: formData.phone.trim() || undefined,
        roleId: formData.roleId,
        branchId: cleanBranchId,
        bankAccount: finalBankAccount,
        salary: formData.enrollPayroll ? Number(formData.salary) || 10000 : undefined,
        employeeCode: formData.enrollPayroll
          ? (formData.employeeCode?.trim() || `EMP-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`)
          : undefined,
        sendEmail: formData.sendEmail,
      };

      const res: any = await usersApi.create(payload);
      const isEmailSent = res?.data?.emailSent ?? res?.emailSent;

      if (formData.sendEmail) {
        if (isEmailSent) {
          toast.success(`User created & login credentials emailed to ${formData.email}!`);
        } else {
          toast(
            `User created! Note: Real email not sent because SMTP is unconfigured in backend/.env. Credentials were simulated in the server terminal console.`,
            { duration: 7000 }
          );
        }
      } else {
        toast.success(`User ${formData.firstName} created successfully!`);
      }
      setShowAddModal(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        username: '',
        password: '',
        phone: '',
        roleId: '',
        branchId: '',
        enrollPayroll: true,
        employeeCode: '',
        salary: 10000,
        bankProvider: 'Telebirr',
        bankAccountNumber: '',
        sendEmail: true,
      });
      loadData();
    } catch (err: any) {
      console.error('Error creating user:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        (typeof err.response?.data === 'string' ? err.response?.data : null) ||
        err.message ||
        'Failed to create user';
      toast.error(errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  // Edit User
  const handleOpenEdit = (user: AppUser) => {
    setSelectedUser(user);
    const rawBank = user.employee?.bankAccount || '';
    let provider = 'Telebirr';
    let accNum = rawBank;
    if (rawBank.includes(':')) {
      const parts = rawBank.split(':');
      provider = parts[0].trim();
      accNum = parts.slice(1).join(':').trim();
    } else if (rawBank.startsWith('1000')) {
      provider = 'Commercial Bank of Ethiopia (CBE)';
    }

    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      phone: user.phone || '',
      roleId: user.role?.id || '',
      branchId: user.branch?.id || '',
      salary: user.employee?.salary || 10000,
      employeeCode: user.employee?.employeeCode || '',
      bankProvider: provider,
      bankAccountNumber: accNum,
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const finalBankAccount = editFormData.bankAccountNumber.trim()
        ? `${editFormData.bankProvider}: ${editFormData.bankAccountNumber.trim()}`
        : '';

      await usersApi.update(selectedUser.id, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        email: editFormData.email,
        username: editFormData.username,
        phone: editFormData.phone,
        roleId: editFormData.roleId,
        branchId: editFormData.branchId,
        bankAccount: finalBankAccount,
        salary: Number(editFormData.salary) || undefined,
        employeeCode: editFormData.employeeCode || undefined,
      });

      toast.success('User updated successfully');
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Password
  const handleOpenReset = (user: AppUser) => {
    setSelectedUser(user);
    setNewPassword(generateRandomPassword());
    setCopiedSuccess(false);
    setSendEmailOnReset(true);
    setShowResetModal(true);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !newPassword) return;

    try {
      setActionLoading(true);
      await usersApi.resetPassword(selectedUser.id, newPassword.trim(), sendEmailOnReset);
      if (sendEmailOnReset) {
        toast.success(`Password reset & new credentials emailed to ${selectedUser.email}!`);
      } else {
        toast.success(`Password reset for ${selectedUser.firstName}!`);
      }
      setShowResetModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setActionLoading(false);
    }
  };

  // Resend Credentials Email Directly
  const handleResendCredentials = async (user: AppUser) => {
    if (
      !window.confirm(
        `Regenerate a temporary password and dispatch login credentials to ${user.firstName} ${user.lastName} (${user.email})?`
      )
    ) {
      return;
    }

    try {
      setSendingEmailId(user.id);
      const res = await usersApi.sendCredentials(user.id);
      if (res?.simulated) {
        toast(
          `Temporary password generated! Note: Real email not sent because SMTP is unconfigured in backend/.env. Preview logged to server terminal.`,
          { duration: 7000 }
        );
      } else {
        toast.success(res.message || `Credentials successfully dispatched to ${user.email}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to dispatch credentials email');
    } finally {
      setSendingEmailId(null);
    }
  };

  // Toggle Lock / Unlock
  const handleToggleLock = async (user: AppUser) => {
    try {
      const newStatus = user.isLocked ? 'UNLOCKED' : 'LOCKED';
      await usersApi.updateStatus(user.id, newStatus);
      toast.success(user.isLocked ? `Unlocked ${user.firstName}'s account` : `Locked ${user.firstName}'s account`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to change account lock status');
    }
  };

  // Toggle Active / Inactive
  const handleToggleActive = async (user: AppUser) => {
    try {
      const newStatus = user.isActive ? 'INACTIVE' : 'ACTIVE';
      await usersApi.updateStatus(user.id, newStatus);
      toast.success(user.isActive ? `Deactivated ${user.firstName}` : `Activated ${user.firstName}`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to change account status');
    }
  };

  // Delete User
  const handleDeleteUser = async (user: AppUser) => {
    if (!confirm(`Are you sure you want to delete user ${user.firstName} ${user.lastName}?`)) return;
    try {
      await usersApi.delete(user.id);
      toast.success('User deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const copyCredentials = () => {
    if (!selectedUser) return;
    const text = `Habesha RMS Credentials:\nEmail: ${selectedUser.email}\nUsername: ${selectedUser.username}\nPassword: ${newPassword}\nLogin at: ${window.location.origin}/admin/login`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  // Role Badge Helper
  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'Super Admin':
      case 'Owner':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Manager':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Cashier':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'Waiter':
        return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800';
      case 'Kitchen Staff':
        return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      default:
        return 'bg-gray-50 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#143225]';
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            User & Access Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage system logins, roles, credentials, and password resets for all staff members.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              username: '',
              password: generateRandomPassword(),
              phone: '',
              roleId: roles.find((r) => r.name === 'Waiter')?.id || roles[0]?.id || '',
              branchId: branches[0]?.id || '',
              enrollPayroll: true,
              employeeCode: `EMP-${Math.floor(100 + Math.random() * 900)}`,
              salary: 10000,
              bankProvider: 'Telebirr',
              bankAccountNumber: '',
              sendEmail: true,
            });
            setShowAddModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Main Table Container with Integrated Toolbar */}
      <div className="bg-white dark:bg-[#091a13] rounded-2xl border border-gray-200 dark:border-[#143225] shadow-sm overflow-hidden">
        {/* Integrated Header Toolbar */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-[#143225] bg-gray-50/60 dark:bg-[#071a12] flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">System Users ({users.length})</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Active accounts authorized to access Habesha RMS</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Compact Search Bar */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, role..."
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-[#091a13] border border-gray-300 dark:border-[#143225] rounded-lg text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs sm:text-sm bg-white dark:bg-[#091a13] border border-gray-300 dark:border-[#143225] rounded-lg text-gray-700 dark:text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="LOCKED">Locked</option>
            </select>

            <button
              onClick={loadData}
              title="Refresh"
              className="p-2 border border-gray-300 dark:border-[#143225] rounded-lg bg-white dark:bg-[#091a13] hover:bg-gray-50 dark:hover:bg-[#0c2219] text-gray-600 dark:text-gray-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#143225] bg-gray-50/40 dark:bg-[#071a12] text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">
                <th className="py-3 px-4 sm:px-6">User / Identity</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Bank / Payout Account</th>
                <th className="py-3 px-4">Branch</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#143225] text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600 dark:text-[#00e676]" />
                    Loading system users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400 dark:text-gray-500">
                    No users found matching your filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = currentUser?.id === u.id;
                  const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`.toUpperCase() || 'U';
                  const bankAcc = u.employee?.bankAccount;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-[#0c2f21]/30 transition group">
                      {/* Name / Username */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                              {u.firstName} {u.lastName}
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-medium border border-transparent dark:border-emerald-800">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                          {u.email}
                        </div>
                        {u.phone && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            {u.phone}
                          </div>
                        )}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getRoleBadge(
                            u.role?.name || ''
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          {u.role?.name || 'No Role'}
                        </span>
                      </td>

                      {/* Bank / Payout Account */}
                      <td className="py-3.5 px-4">
                        {bankAcc ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-emerald-50 dark:bg-[#072417] text-emerald-800 dark:text-[#00e676] border border-emerald-200 dark:border-emerald-800/60">
                            <span className="truncate max-w-[170px]" title={bankAcc}>
                              {bankAcc}
                            </span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-gray-400 dark:text-gray-500 hover:text-emerald-700 dark:hover:text-[#00e676] hover:bg-emerald-50 dark:hover:bg-[#072417] transition border border-dashed border-gray-300 dark:border-[#143225] cursor-pointer"
                            title="Click to add payout account"
                          >
                            + Add Account
                          </button>
                        )}
                      </td>

                      {/* Branch */}
                      <td className="py-3.5 px-4 text-xs text-gray-600 dark:text-gray-400">
                        {u.branch ? (
                          <span className="inline-flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                            {u.branch.name}
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">All Branches</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300 border border-transparent dark:border-red-800">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        ) : u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-300 border border-transparent dark:border-green-800">
                            <UserCheck className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-[#0c2219] text-gray-700 dark:text-gray-300 border border-transparent dark:border-[#143225]">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Last Login */}
                      <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400">
                        {u.lastLogin
                          ? new Date(u.lastLogin).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                          : 'Never'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1">
                          {/* Resend Credentials Email */}
                          <button
                            onClick={() => handleResendCredentials(u)}
                            disabled={sendingEmailId === u.id}
                            title="Resend Login Credentials via Email"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition disabled:opacity-50 cursor-pointer"
                          >
                            {sendingEmailId === u.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => handleOpenReset(u)}
                            title="Reset Password & Credentials"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition cursor-pointer"
                          >
                            <Key className="w-4 h-4" />
                          </button>

                          {/* Toggle Lock */}
                          <button
                            onClick={() => handleToggleLock(u)}
                            title={u.isLocked ? 'Unlock Account' : 'Lock Account'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${u.isLocked
                              ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                              : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                              }`}
                          >
                            {u.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </button>

                          {/* Edit User */}
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="Edit User"
                            className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-[#00e676] hover:bg-emerald-50 dark:hover:bg-[#0c2219] rounded-lg transition cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {/* Delete User */}
                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              title="Delete User"
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: ADD NEW USER ================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-[#143225]">
            <div className="p-5 border-b border-gray-200 dark:border-[#143225] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-emerald-600 dark:text-[#00e676]" />
                  Add New User / Staff Member
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Create login credentials and assign access permissions</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Malkitu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Tasfa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => {
                    const emailVal = e.target.value;
                    setFormData({
                      ...formData,
                      email: emailVal,
                      username: formData.username || emailVal.split('@')[0],
                    });
                  }}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="malkitu@gmail.com"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Username (Login ID)</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="malkitu"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="+251 911 000 000"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Initial Password *</label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: generateRandomPassword() })}
                    className="text-[11px] text-emerald-600 dark:text-[#00e676] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Generate Secure Password
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">System Role *</label>
                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-[#071a12] text-gray-900 dark:text-white"
                  >
                    <option value="">Select Role</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Assigned Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-[#071a12] text-gray-900 dark:text-white"
                  >
                    <option value="">All / Main Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payout & Bank Account for Payroll */}
              <div className="p-3.5 bg-gray-50 dark:bg-[#071a12] rounded-xl border border-gray-200 dark:border-[#143225] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <span>Payout & Bank Account (For Payroll Disbursal)</span>
                  </label>
                  {formData.phone && (
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          bankProvider: 'Telebirr',
                          bankAccountNumber: formData.phone,
                        })
                      }
                      className="text-[11px] text-emerald-700 dark:text-[#00e676] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      Use Phone for Telebirr
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      Bank / Wallet Provider
                    </label>
                    <select
                      value={formData.bankProvider}
                      onChange={(e) => setFormData({ ...formData, bankProvider: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Telebirr">Telebirr Mobile Money</option>
                      <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                      <option value="Awash Bank">Awash Bank</option>
                      <option value="Bank of Abyssinia">Bank of Abyssinia (BOA)</option>
                      <option value="Dashen Bank">Dashen Bank</option>
                      <option value="Cash in Hand">Cash in Hand</option>
                      <option value="Other">Other Wallet / Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      Account / Mobile Number
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="e.g. 0912345678 or 100012345678"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Autofills during monthly payroll disbursals and records on official transfer receipts.
                </p>
              </div>

              {/* Optional: Enroll in Payroll */}
              <div className="p-3.5 bg-emerald-50/60 dark:bg-[#072417] rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enrollPayroll}
                    onChange={(e) => setFormData({ ...formData, enrollPayroll: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                  />
                  <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300">
                    Also enroll as Salaried Employee in Payroll
                  </span>
                </label>

                {formData.enrollPayroll && (
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-0.5">Employee Code</label>
                      <input
                        type="text"
                        value={formData.employeeCode}
                        onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-emerald-200 dark:border-[#143225] rounded-lg outline-none font-mono"
                        placeholder="W1"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-emerald-800 dark:text-emerald-300 mb-0.5">Base Salary (ETB)</label>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) => setFormData({ ...formData, salary: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-emerald-200 dark:border-[#143225] rounded-lg outline-none"
                        placeholder="10000"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Email Credentials Delivery Toggle */}
              <div className="flex items-start gap-3 p-3.5 bg-blue-50/70 dark:bg-[#092233] border border-blue-200/80 dark:border-blue-900/50 rounded-xl">
                <input
                  type="checkbox"
                  id="sendEmailAdd"
                  checked={formData.sendEmail}
                  onChange={(e) => setFormData({ ...formData, sendEmail: e.target.checked })}
                  className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <label htmlFor="sendEmailAdd" className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5 cursor-pointer">
                    <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    Email login credentials to staff member
                  </label>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                    Sends a welcome email with their login ID, temporary password, role info, and direct link to the staff login portal.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-[#143225] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#0c2219] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Creating User...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PASSWORD ================= */}
      {showResetModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-md w-full shadow-2xl border border-gray-100 dark:border-[#143225] p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#143225] pb-3">
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
                <Key className="w-5 h-5" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reset Credentials</h3>
              </div>
              <button onClick={() => setShowResetModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Resetting password for{' '}
                <strong className="text-gray-800 dark:text-gray-200">
                  {selectedUser.firstName} {selectedUser.lastName}
                </strong>{' '}
                ({selectedUser.email}).
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">New Password</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(generateRandomPassword())}
                    className="text-[11px] text-emerald-600 dark:text-[#00e676] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" /> Generate New
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3 pr-10 py-2.5 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Ready-to-share Credentials Card */}
              <div className="p-3.5 bg-gray-50 dark:bg-[#071a12] rounded-xl border border-gray-200 dark:border-[#143225] text-xs space-y-1 font-mono">
                <div className="text-gray-500 dark:text-gray-400 text-[10px] uppercase font-sans font-bold">Shareable Credentials:</div>
                <div className="text-gray-800 dark:text-gray-200 font-semibold">User: {selectedUser.email}</div>
                <div className="text-gray-800 dark:text-gray-200 font-semibold">Username: {selectedUser.username}</div>
                <div className="text-emerald-700 dark:text-[#00e676] font-bold">Password: {newPassword}</div>
              </div>

              {/* Email Notification Option */}
              <label className="flex items-start gap-2.5 p-3 bg-blue-50/70 dark:bg-[#092233] border border-blue-200/80 dark:border-blue-900/50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmailOnReset}
                  onChange={(e) => setSendEmailOnReset(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-xs font-bold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Email new credentials to {selectedUser.email}</span>
                  </div>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5 leading-relaxed">
                    Sends an automated security alert containing the new temporary password to the staff member.
                  </p>
                </div>
              </label>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c2219] rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  {copiedSuccess ? <Check className="w-4 h-4 text-emerald-600 dark:text-[#00e676]" /> : <Copy className="w-4 h-4" />}
                  {copiedSuccess ? 'Copied!' : 'Copy Credentials'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="px-3.5 py-2 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 dark:hover:bg-[#0c2219] rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Saving...' : 'Apply Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#091a13] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-[#143225] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#143225] pb-3">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600 dark:text-[#00e676]" />
                Edit User Details
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.firstName}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.lastName}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={editFormData.username}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#071a12] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Role *</label>
                  <select
                    required
                    value={editFormData.roleId}
                    onChange={(e) => setEditFormData({ ...editFormData, roleId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-[#071a12] text-gray-900 dark:text-white"
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Branch</label>
                  <select
                    value={editFormData.branchId}
                    onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-[#143225] rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white dark:bg-[#071a12] text-gray-900 dark:text-white"
                  >
                    <option value="">All / Main Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Payout & Bank Account for Payroll */}
              <div className="p-3.5 bg-gray-50 dark:bg-[#071a12] rounded-xl border border-gray-200 dark:border-[#143225] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <span>Payout & Bank Account (For Payroll Disbursal)</span>
                  </label>
                  {editFormData.phone && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditFormData({
                          ...editFormData,
                          bankProvider: 'Telebirr',
                          bankAccountNumber: editFormData.phone,
                        })
                      }
                      className="text-[11px] text-emerald-700 dark:text-[#00e676] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      Use Phone for Telebirr
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      Bank / Wallet Provider
                    </label>
                    <select
                      value={editFormData.bankProvider}
                      onChange={(e) => setEditFormData({ ...editFormData, bankProvider: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Telebirr">Telebirr Mobile Money</option>
                      <option value="Commercial Bank of Ethiopia (CBE)">Commercial Bank of Ethiopia (CBE)</option>
                      <option value="Awash Bank">Awash Bank</option>
                      <option value="Bank of Abyssinia">Bank of Abyssinia (BOA)</option>
                      <option value="Dashen Bank">Dashen Bank</option>
                      <option value="Cash">Cash in Hand</option>
                      <option value="Other">Other Wallet / Bank</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">
                      Account / Mobile Number
                    </label>
                    <input
                      type="text"
                      value={editFormData.bankAccountNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, bankAccountNumber: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                      placeholder="e.g. 0912345678 or 100012345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1 border-t border-gray-200 dark:border-[#143225]">
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">Staff Code</label>
                    <input
                      type="text"
                      value={editFormData.employeeCode}
                      onChange={(e) => setEditFormData({ ...editFormData, employeeCode: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-white border border-gray-300 dark:border-[#143225] rounded-lg outline-none font-mono"
                      placeholder="EMP-101"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">Base Monthly Salary (ETB)</label>
                    <input
                      type="number"
                      value={editFormData.salary}
                      onChange={(e) => setEditFormData({ ...editFormData, salary: Number(e.target.value) })}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-[#091a13] text-gray-900 dark:text-[#00e676] border border-gray-300 dark:border-[#143225] rounded-lg outline-none font-semibold"
                      placeholder="10000"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 dark:border-[#143225] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-[#0c2219] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
