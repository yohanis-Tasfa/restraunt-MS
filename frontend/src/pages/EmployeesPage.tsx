import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Eye,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Building2,
  Briefcase,
  X,
  Shield,
  Banknote,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  AlertCircle,
  Plus,
  Upload,
  Image as ImageIcon,
  Camera,
  Download,
  ExternalLink,
} from 'lucide-react';
import {
  employeesApi,
  type Employee,
  type Payroll,
  type CreateEmployeeData,
  type UpdateEmployeeData,
} from '../api/employees';
import {
  getStoredPayrolls,
  saveStoredPayrolls,
  recordExpenseFromPaidPayroll,
  generateSampleTransferProof,
} from '../utils/mockPersistence';
import { useAuthStore } from '../store/authStore';

interface Role {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  name: string;
}

interface EmployeesPageProps {
  defaultTab?: 'employees' | 'payroll';
}

export default function EmployeesPage({ defaultTab }: EmployeesPageProps) {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const { user } = useAuthStore();

  // Tab State: staff directory vs payroll & salaries
  const initialTab =
    defaultTab ||
    (location.pathname.includes('payroll') || searchParams.get('tab') === 'payroll'
      ? 'payroll'
      : 'employees');
  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>(initialTab);

  // Staff Directory state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  // Payroll state
  const [payrolls, setPayrolls] = useState<Payroll[]>(() => getStoredPayrolls());
  const [payrollSearch, setPayrollSearch] = useState('');
  const [payrollStatusFilter, setPayrollStatusFilter] = useState('');
  const [payrollPeriodFilter, setPayrollPeriodFilter] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Disbursal & Transfer Screenshot Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingPayroll, setPayingPayroll] = useState<Payroll | null>(null);
  const [paymentChannel, setPaymentChannel] = useState('Telebirr Mobile Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [receiptImage, setReceiptImage] = useState<string>('');

  // Transfer Proof Viewer Modal State
  const [showProofViewerModal, setShowProofViewerModal] = useState(false);
  const [viewingProof, setViewingProof] = useState<{
    image: string;
    empName: string;
    amount: number;
    ref: string;
    channel: string;
  } | null>(null);

  // Process Payroll Form State
  const [processForm, setProcessForm] = useState({
    employeeId: '',
    period: new Date().toISOString().slice(0, 7), // "YYYY-MM"
    basicSalary: 0,
    allowances: 0,
    overtime: 0,
    deductions: 0,
    notes: '',
  });

  // Form state for add/edit employee
  const [formData, setFormData] = useState<Partial<CreateEmployeeData>>({
    employmentType: 'FULL_TIME',
    salary: 0,
  });

  const departments = [
    'Kitchen',
    'Service',
    'Management',
    'Finance',
    'HR',
    'Maintenance',
    'Security',
  ];

  const employmentTypes = [
    { value: 'FULL_TIME', label: 'Full Time' },
    { value: 'PART_TIME', label: 'Part Time' },
    { value: 'CONTRACT', label: 'Contract' },
    { value: 'INTERN', label: 'Intern' },
  ];

  const statuses = [
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'ON_LEAVE', label: 'On Leave', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'SUSPENDED', label: 'Suspended', color: 'bg-red-100 text-red-800' },
    { value: 'TERMINATED', label: 'Terminated', color: 'bg-gray-100 text-gray-800' },
  ];

  useEffect(() => {
    loadEmployees();
    loadRoles();
    loadBranches();
  }, [searchTerm, departmentFilter, statusFilter]);

  // Sync tab if URL changes
  useEffect(() => {
    if (location.pathname.includes('payroll') || searchParams.get('tab') === 'payroll') {
      setActiveTab('payroll');
    }
  }, [location.pathname, location.search]);

  // Load and listen to payroll updates
  useEffect(() => {
    loadPayrolls();

    const handleStorageChange = () => {
      setPayrolls(getStoredPayrolls());
    };

    window.addEventListener('rms_storage_change', handleStorageChange);
    return () => window.removeEventListener('rms_storage_change', handleStorageChange);
  }, []);

  const loadPayrolls = async () => {
    try {
      const res = await employeesApi.getPayrolls();
      if (res && res.payrolls && res.payrolls.length > 0) {
        setPayrolls(res.payrolls);
        saveStoredPayrolls(res.payrolls);
      } else {
        setPayrolls(getStoredPayrolls());
      }
    } catch (err) {
      console.warn('Backend getPayrolls offline/empty, using stored payrolls:', err);
      setPayrolls(getStoredPayrolls());
    }
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeesApi.getEmployees({
        search: searchTerm || undefined,
        department: departmentFilter || undefined,
        status: statusFilter || undefined,
      });
      if (data && data.employees) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/users/roles/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setRoles(result.data || result);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setRoles([]);
    }
  };

  const loadBranches = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/branches', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        if (result.data && result.data.data && Array.isArray(result.data.data)) {
          setBranches(result.data.data);
        } else {
          setBranches([]);
        }
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error('Error loading branches:', error);
      setBranches([]);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.hireDate) {
        alert('Hire Date is required');
        return;
      }
      const cleanedData = {
        ...formData,
        branchId: formData.branchId || undefined,
        restaurantId: formData.restaurantId || undefined,
      };

      await employeesApi.createEmployee(cleanedData as CreateEmployeeData);
      setShowAddModal(false);
      setFormData({ employmentType: 'FULL_TIME', salary: 0 });
      loadEmployees();
    } catch (error: any) {
      console.error('Error creating employee:', error);
      alert(`Failed to create employee: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      await employeesApi.updateEmployee(selectedEmployee.id, formData as UpdateEmployeeData);
      setShowEditModal(false);
      setSelectedEmployee(null);
      setFormData({ employmentType: 'FULL_TIME', salary: 0 });
      loadEmployees();
    } catch (error) {
      console.error('Error updating employee:', error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await employeesApi.deleteEmployee(id);
      loadEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const openEditModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.user.firstName,
      lastName: employee.user.lastName,
      email: employee.user.email,
      phone: employee.user.phone || '',
      department: employee.department,
      position: employee.position,
      employmentType: employee.employmentType,
      salary: employee.salary,
      status: employee.status,
      emergencyContact: employee.emergencyContact || '',
      emergencyPhone: employee.emergencyPhone || '',
      bankAccount: employee.bankAccount || '',
      taxNumber: employee.taxNumber || '',
    });
    setShowEditModal(true);
  };

  const formatCurrency = (amount: number) => {
    return `Br ${(amount || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = statuses.find((s) => s.value === status);
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig?.color}`}>
        {statusConfig?.label}
      </span>
    );
  };

  // --- DISBURSAL & TRANSFER SCREENSHOT ACTIONS ---

  const openPaymentModal = (payroll: Payroll) => {
    const defaultTxn = `TXN-${Date.now().toString().slice(-6)}`;
    setPayingPayroll(payroll);
    setPaymentChannel('Telebirr Mobile Transfer');
    setTransactionRef(defaultTxn);
    setPaymentNotes('Monthly salary payout disbursed');
    setReceiptImage('');
    setShowPaymentModal(true);
  };

  const handleScreenshotFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateSampleScreenshot = () => {
    if (!payingPayroll) return;
    const empName = payingPayroll.employee?.user
      ? `${payingPayroll.employee.user.firstName} ${payingPayroll.employee.user.lastName}`
      : 'Staff Member';
    const sampleImage = generateSampleTransferProof(
      empName,
      payingPayroll.netSalary,
      paymentChannel,
      transactionRef || `TXN-${Date.now().toString().slice(-6)}`
    );
    setReceiptImage(sampleImage);
  };

  const handleConfirmDisbursal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingPayroll) return;

    try {
      const nowIso = new Date().toISOString();
      const empName = payingPayroll.employee?.user
        ? `${payingPayroll.employee.user.firstName} ${payingPayroll.employee.user.lastName}`
        : 'Employee';

      const finalProofImage =
        receiptImage ||
        generateSampleTransferProof(
          empName,
          payingPayroll.netSalary,
          paymentChannel,
          transactionRef || `PAY-${payingPayroll.id.slice(-5).toUpperCase()}`
        );

      const updatedPayroll: Payroll = {
        ...payingPayroll,
        status: 'PAID',
        paidAt: nowIso,
        paymentMethod: paymentChannel,
        transactionRef: transactionRef || `TXN-${payingPayroll.id.slice(-5).toUpperCase()}`,
        receiptImage: finalProofImage,
        transferProofUrl: finalProofImage,
        notes: paymentNotes || payingPayroll.notes,
      };

      const updatedList = payrolls.map((p) => (p.id === payingPayroll.id ? updatedPayroll : p));
      setPayrolls(updatedList);
      saveStoredPayrolls(updatedList);

      // Auto-record to Financial Expense Ledger with the attached transfer screenshot
      recordExpenseFromPaidPayroll(updatedPayroll, user);

      // Backend sync
      try {
        await employeesApi.updatePayrollStatus(payingPayroll.id, 'PAID');
      } catch (err) {
        console.warn('Backend updatePayrollStatus offline/mock fallback');
      }

      setShowPaymentModal(false);
      setPayingPayroll(null);
      setToastMessage(
        `Payroll for ${empName} marked as PAID! ${formatCurrency(payingPayroll.netSalary)} & transfer screenshot recorded in Expenses.`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      console.error('Error confirming disbursal:', error);
    }
  };

  const openProcessModalForEmployee = (employee?: Employee) => {
    const targetEmp = employee || employees[0];
    const initialBase = targetEmp ? targetEmp.salary : 10000;
    setProcessForm({
      employeeId: targetEmp ? targetEmp.id : 'emp-1',
      period: new Date().toISOString().slice(0, 7),
      basicSalary: initialBase,
      allowances: 0,
      overtime: 0,
      deductions: 0,
      notes: 'Monthly standard salary payout',
    });
    setShowProcessModal(true);
  };

  const handleProcessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let empObj = employees.find((e) => e.id === processForm.employeeId);
      if (!empObj && processForm.employeeId === 'emp-1') {
        empObj = {
          id: 'emp-1',
          employeeCode: 'W1',
          department: 'Service',
          position: 'Waiter',
          employmentType: 'FULL_TIME',
          salary: processForm.basicSalary,
          hireDate: new Date().toISOString(),
          status: 'ACTIVE',
          userId: 'usr-w1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          user: {
            id: 'usr-w1',
            email: 'malkitutasfa@gmail.com',
            username: 'malkitu',
            firstName: 'Malkitu',
            lastName: 'Tasfa',
            isActive: true,
            role: { id: 'r1', name: 'Waiter' },
          },
        };
      }

      const netSalary =
        Number(processForm.basicSalary) +
        Number(processForm.allowances || 0) +
        Number(processForm.overtime || 0) -
        Number(processForm.deductions || 0);

      const newSlip: Payroll = {
        id: `pay-${Date.now().toString().slice(-5)}`,
        employeeId: processForm.employeeId,
        period: new Date(`${processForm.period}-01T00:00:00.000Z`).toISOString(),
        basicSalary: Number(processForm.basicSalary),
        allowances: Number(processForm.allowances || 0),
        overtime: Number(processForm.overtime || 0),
        deductions: Number(processForm.deductions || 0),
        netSalary,
        status: 'PENDING',
        notes: processForm.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        employee: {
          id: empObj?.id || processForm.employeeId,
          employeeCode: empObj?.employeeCode || 'EMP',
          user: {
            firstName: empObj?.user?.firstName || 'Staff',
            lastName: empObj?.user?.lastName || 'Member',
            email: empObj?.user?.email || 'staff@rms.com',
          },
        },
      };

      const updated = [newSlip, ...payrolls];
      setPayrolls(updated);
      saveStoredPayrolls(updated);

      try {
        await employeesApi.createPayroll({
          employeeId: newSlip.employeeId,
          period: newSlip.period,
          basicSalary: newSlip.basicSalary,
          allowances: newSlip.allowances,
          deductions: newSlip.deductions,
          overtime: newSlip.overtime,
          notes: newSlip.notes,
        });
      } catch (err) {
        console.warn('Backend createPayroll offline fallback');
      }

      setShowProcessModal(false);
      setToastMessage(
        `Payroll slip created for ${newSlip.employee?.user.firstName} ${newSlip.employee?.user.lastName} (${formatCurrency(netSalary)})`
      );
      setTimeout(() => setToastMessage(null), 4000);
    } catch (error) {
      console.error('Error creating payroll slip:', error);
    }
  };

  // Payroll Metrics & Filtering
  const filteredPayrolls = payrolls.filter((p) => {
    const q = payrollSearch.toLowerCase().trim();
    const empName = `${p.employee?.user?.firstName || ''} ${p.employee?.user?.lastName || ''}`.toLowerCase();
    const empCode = (p.employee?.employeeCode || '').toLowerCase();
    const slipId = p.id.toLowerCase();
    const notes = (p.notes || '').toLowerCase();

    const matchesSearch =
      !q || empName.includes(q) || empCode.includes(q) || slipId.includes(q) || notes.includes(q);
    const matchesStatus = !payrollStatusFilter || p.status === payrollStatusFilter;
    const matchesPeriod = !payrollPeriodFilter || (p.period && p.period.startsWith(payrollPeriodFilter));

    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const totalPayrollAmount = payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const pendingPayrolls = payrolls.filter((p) => p.status === 'PENDING' || p.status === 'APPROVED');
  const pendingDisbursalAmount = pendingPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const paidPayrolls = payrolls.filter((p) => p.status === 'PAID');
  const paidOutAmount = paidPayrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 bg-emerald-700 text-white px-5 py-3 rounded-lg shadow-xl text-sm font-medium animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-3 hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === 'employees' ? 'Employee Management' : 'Payroll & Salary Management'}
            </h1>
            <p className="text-gray-600 text-sm mt-0.5">
              {activeTab === 'employees'
                ? 'Manage your staff, employee records, roles, and compensation'
                : 'Track monthly employee payroll, attach transfer screenshots, and sync with Expenses'}
            </p>
          </div>

          {activeTab === 'employees' ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Employee
            </button>
          ) : (
            <button
              onClick={() => openProcessModalForEmployee()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Process Monthly Payroll
            </button>
          )}
        </div>

        {/* Tab Switcher (Only shown if not purely payroll) */}
        {defaultTab !== 'payroll' && (
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'employees'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4" />
              Staff Directory
              <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-semibold">
                {employees.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('payroll')}
              className={`flex items-center gap-2 pb-3 px-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payroll'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Banknote className="w-4 h-4" />
              Payroll & Salaries
              {pendingPayrolls.length > 0 && (
                <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 font-semibold">
                  {pendingPayrolls.length} Pending
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: STAFF DIRECTORY */}
      {/* ========================================================================= */}
      {activeTab === 'employees' && defaultTab !== 'payroll' && (
        <>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-600 mb-4 text-sm">Get started by adding your first employee to the system</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Add Employee
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Integrated Toolbar inside the table card */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-gray-900">Staff Records</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                    {employees.length} employees
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Reduced size search */}
                  <div className="relative w-56 sm:w-64">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search staff by name, code..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                    />
                  </div>

                  <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Statuses</option>
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  {(searchTerm || departmentFilter || statusFilter) && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setDepartmentFilter('');
                        setStatusFilter('');
                      }}
                      className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Position
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Monthly Salary
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {employees.map((employee) => (
                      <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-sm">
                              {employee.user.firstName?.[0] || 'E'}
                              {employee.user.lastName?.[0] || ''}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {employee.user.firstName} {employee.user.lastName}
                              </div>
                              <div className="text-xs text-gray-500">{employee.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-mono text-gray-800 font-semibold">
                          {employee.employeeCode}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                          {employee.user.role.name}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                          {employee.position}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-xs font-medium text-gray-600">
                          <span className="px-2.5 py-1 bg-gray-100 rounded-md">
                            {employee.employmentType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-sm font-semibold text-gray-900">
                          {formatCurrency(employee.salary)}
                          <span className="text-xs text-gray-400 font-normal ml-1">/mo</span>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{getStatusBadge(employee.status)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setActiveTab('payroll');
                                setPayrollSearch(employee.employeeCode || employee.user.lastName);
                              }}
                              title="View & Manage Payroll for this Employee"
                              className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Banknote className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setShowViewModal(true);
                              }}
                              title="View Profile Details"
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openEditModal(employee)}
                              title="Edit Employee"
                              className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEmployee(employee.id)}
                              title="Delete Employee"
                              className="p-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PAYROLL & SALARIES */}
      {/* ========================================================================= */}
      {activeTab === 'payroll' && (
        <>
          {/* Payroll KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Total Monthly Payroll
                </span>
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatCurrency(totalPayrollAmount)}</p>
              <p className="text-xs text-gray-500 mt-1">{payrolls.length} payslips recorded</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Pending Disbursal
                </span>
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-2">
                {formatCurrency(pendingDisbursalAmount)}
              </p>
              <p className="text-xs text-amber-700 mt-1">
                {pendingPayrolls.length} slip{pendingPayrolls.length === 1 ? '' : 's'} waiting for payout
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Paid Out (Recorded)
                </span>
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-2">{formatCurrency(paidOutAmount)}</p>
              <p className="text-xs text-emerald-700 mt-1">Logged with transfer screenshots</p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Staff Enrolled
                </span>
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-2">{employees.length || 4}</p>
              <p className="text-xs text-gray-500 mt-1">Active full-time & contracted staff</p>
            </div>
          </div>

          {/* Payroll Slips Table with Integrated Toolbar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Integrated Toolbar inside the table card */}
            <div className="px-4 py-3 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">Payroll Records</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
                  {filteredPayrolls.length} slips
                </span>
              </div>

              {/* Reduced size search & filter controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-56 sm:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search staff, code, slip #..."
                    value={payrollSearch}
                    onChange={(e) => setPayrollSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 placeholder-gray-400"
                  />
                </div>

                <select
                  value={payrollStatusFilter}
                  onChange={(e) => setPayrollStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending Disbursal</option>
                  <option value="PAID">Disbursed (Paid)</option>
                </select>

                <select
                  value={payrollPeriodFilter}
                  onChange={(e) => setPayrollPeriodFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Periods</option>
                  <option value="2026-10">October 2026</option>
                  <option value="2026-09">September 2026</option>
                  <option value="2026-08">August 2026</option>
                </select>

                {(payrollSearch || payrollStatusFilter || payrollPeriodFilter) && (
                  <button
                    onClick={() => {
                      setPayrollSearch('');
                      setPayrollStatusFilter('');
                      setPayrollPeriodFilter('');
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {filteredPayrolls.length === 0 ? (
              <div className="p-12 text-center">
                <Banknote className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No payroll records found</h3>
                <p className="text-gray-600 mb-4 text-sm">
                  Generate monthly payslips to disburse staff salaries and track payroll expenses.
                </p>
                <button
                  onClick={() => openProcessModalForEmployee()}
                  className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm font-medium"
                >
                  + Process Monthly Payroll
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Slip / Period
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Basic Salary
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Allowances & OT
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Net Payout
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status & Channel
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayrolls.map((payroll) => {
                      const periodDate = payroll.period ? new Date(payroll.period) : new Date();
                      const periodLabel = periodDate.toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      });
                      const empName = payroll.employee?.user
                        ? `${payroll.employee.user.firstName} ${payroll.employee.user.lastName}`
                        : 'Staff Member';
                      const empEmail = payroll.employee?.user?.email || 'staff@rms.com';
                      const empCode = payroll.employee?.employeeCode || 'EMP';
                      const allowancesOt = (payroll.allowances || 0) + (payroll.overtime || 0);

                      return (
                        <tr key={payroll.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-mono text-xs font-bold text-gray-900">
                              PAY-{payroll.id.slice(-5).toUpperCase()}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{periodLabel}</div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xs">
                                {payroll.employee?.user?.firstName?.[0] || 'E'}
                                {payroll.employee?.user?.lastName?.[0] || ''}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                  {empName}
                                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 font-mono text-gray-600 font-semibold">
                                    {empCode}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">{empEmail}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-800 font-medium">
                            {formatCurrency(payroll.basicSalary)}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-emerald-700 font-medium">
                            +{formatCurrency(allowancesOt)}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-sm text-red-600 font-medium">
                            -{formatCurrency(payroll.deductions || 0)}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="text-base font-bold text-gray-900">
                              {formatCurrency(payroll.netSalary)}
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {payroll.status === 'PAID' ? (
                              <div>
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Disbursed
                                </span>
                                {payroll.paymentMethod && (
                                  <div className="text-xs text-gray-500 mt-0.5 font-medium">
                                    {payroll.paymentMethod}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {payroll.status !== 'PAID' ? (
                                <button
                                  onClick={() => openPaymentModal(payroll)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
                                >
                                  <Camera className="w-4 h-4" />
                                  Pay &amp; Attach Proof
                                </button>
                              ) : (
                                <>
                                  {payroll.receiptImage && (
                                    <button
                                      onClick={() => {
                                        setViewingProof({
                                          image: payroll.receiptImage!,
                                          empName,
                                          amount: payroll.netSalary,
                                          ref: payroll.transactionRef || `PAY-${payroll.id.slice(-5).toUpperCase()}`,
                                          channel: payroll.paymentMethod || 'Mobile/Bank Transfer',
                                        });
                                        setShowProofViewerModal(true);
                                      }}
                                      title="View Uploaded Transfer Screenshot"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                    >
                                      <ImageIcon className="w-3.5 h-3.5" />
                                      Screenshot
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setSelectedPayroll(payroll);
                                      setShowSlipModal(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-gray-500" />
                                    View Slip
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedPayroll(payroll);
                                  setShowSlipModal(true);
                                }}
                                title="Full Details"
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: DISBURSE PAYROLL & ATTACH TRANSFER SCREENSHOT */}
      {/* ========================================================================= */}
      {showPaymentModal && payingPayroll && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Disburse Payroll &amp; Attach Transfer Proof
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPayingPayroll(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmDisbursal} className="p-6 space-y-4">
              {/* Recipient & Amount Summary Banner */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs uppercase font-semibold text-emerald-100 tracking-wider">
                      Staff Recipient
                    </span>
                    <h3 className="text-lg font-bold">
                      {payingPayroll.employee?.user?.firstName} {payingPayroll.employee?.user?.lastName}
                    </h3>
                    <p className="text-xs text-emerald-100 font-mono">
                      Code: {payingPayroll.employee?.employeeCode || 'EMP'} &bull; Period:{' '}
                      {payingPayroll.period
                        ? new Date(payingPayroll.period).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Current Month'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase font-semibold text-emerald-100 tracking-wider">
                      Net Payout
                    </span>
                    <p className="text-2xl font-bold font-mono">
                      {formatCurrency(payingPayroll.netSalary)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Channel Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Payment Method / Channel *
                  </label>
                  <select
                    required
                    value={paymentChannel}
                    onChange={(e) => setPaymentChannel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="Telebirr Mobile Transfer">Telebirr Mobile Transfer</option>
                    <option value="CBE Birr Mobile Transfer">CBE Birr Mobile Transfer</option>
                    <option value="Commercial Bank of Ethiopia (CBE) Direct">
                      Commercial Bank of Ethiopia (CBE) Direct
                    </option>
                    <option value="Awash Bank (Awash Pay)">Awash Bank (Awash Pay)</option>
                    <option value="Bank of Abyssinia (BOA)">Bank of Abyssinia (BOA)</option>
                    <option value="Cash in Hand">Cash in Hand</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Transaction / Transfer Ref *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. TB-892182 or CBE-10938"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Screenshot / Transfer Proof Upload Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-gray-700 uppercase">
                    Transfer Screenshot / Proof *
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSampleScreenshot}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold underline"
                  >
                    ⚡ Use Verified Transfer Voucher
                  </button>
                </div>

                {receiptImage ? (
                  <div className="border border-emerald-300 bg-emerald-50/40 rounded-xl p-3 flex flex-col items-center">
                    <div className="relative max-h-56 overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
                      <img
                        src={receiptImage}
                        alt="Transfer Screenshot Preview"
                        className="max-h-52 object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-2.5">
                      <span className="text-xs text-emerald-800 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Transfer Screenshot Attached
                      </span>
                      <button
                        type="button"
                        onClick={() => setReceiptImage('')}
                        className="text-xs text-red-600 hover:text-red-800 font-medium underline"
                      >
                        Remove / Re-upload
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 bg-gray-50 hover:bg-emerald-50/20 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm font-semibold text-gray-700">Click to upload transfer screenshot</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      PNG, JPG, or screenshot from Telebirr / CBE mobile app
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Disbursal Notes
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. October 2026 salary paid via Telebirr"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPayingPayroll(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Payout &amp; Record in Expenses
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TRANSFER PROOF / SCREENSHOT FULL VIEWER */}
      {/* ========================================================================= */}
      {showProofViewerModal && viewingProof && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div>
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-700">
                  OFFICIAL TRANSFER PROOF
                </span>
                <h3 className="text-base font-bold text-gray-900">
                  {viewingProof.empName} &bull; {formatCurrency(viewingProof.amount)}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowProofViewerModal(false);
                  setViewingProof(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center">
              <div className="max-h-[70vh] overflow-auto border border-gray-200 rounded-xl shadow-inner bg-gray-100 flex items-center justify-center p-2">
                <img
                  src={viewingProof.image}
                  alt="Transfer Screenshot"
                  className="max-h-[60vh] object-contain rounded-lg"
                />
              </div>

              <div className="w-full mt-4 bg-gray-50 p-3 rounded-lg border border-gray-200 flex justify-between items-center text-xs text-gray-600">
                <div>
                  <span className="font-semibold text-gray-800">Channel:</span> {viewingProof.channel}
                </div>
                <div>
                  <span className="font-semibold text-gray-800">Ref:</span>{' '}
                  <span className="font-mono">{viewingProof.ref}</span>
                </div>
              </div>

              <div className="w-full flex justify-end gap-2 mt-4 pt-3 border-t border-gray-200">
                <a
                  href={viewingProof.image}
                  download={`Transfer-Proof-${viewingProof.ref}.png`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  <Download className="w-4 h-4" />
                  Download Screenshot
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setShowProofViewerModal(false);
                    setViewingProof(null);
                  }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PROCESS MONTHLY PAYROLL */}
      {/* ========================================================================= */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-xl w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
                <Banknote className="w-5 h-5 text-emerald-600" />
                Process Staff Payroll Slip
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Select Employee *
                </label>
                <select
                  required
                  value={processForm.employeeId}
                  onChange={(e) => {
                    const empId = e.target.value;
                    const selected = employees.find((emp) => emp.id === empId);
                    setProcessForm({
                      ...processForm,
                      employeeId: empId,
                      basicSalary: selected ? selected.salary : processForm.basicSalary,
                    });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                >
                  {employees.length > 0 ? (
                    employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.user.firstName} {emp.user.lastName} ({emp.employeeCode} - {emp.position}) - Base:{' '}
                        {formatCurrency(emp.salary)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="emp-1">Malkitu Tasfa (W1 - Waiter) - Base: Br 10,000.00</option>
                      <option value="emp-2">Sara Wolde (W2 - Head Waiter) - Base: Br 12,000.00</option>
                      <option value="emp-3">Yonas Kebede (K1 - Lead Cook) - Base: Br 13,500.00</option>
                      <option value="emp-4">Betelhem Desta (K2 - Prep Cook) - Base: Br 9,000.00</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Pay Period (Month) *
                  </label>
                  <input
                    type="month"
                    required
                    value={processForm.period}
                    onChange={(e) => setProcessForm({ ...processForm, period: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Basic Salary (ETB) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={processForm.basicSalary}
                    onChange={(e) =>
                      setProcessForm({ ...processForm, basicSalary: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Allowances (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={processForm.allowances}
                    onChange={(e) =>
                      setProcessForm({ ...processForm, allowances: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Transport, meals..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Overtime (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={processForm.overtime}
                    onChange={(e) =>
                      setProcessForm({ ...processForm, overtime: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                    placeholder="Extra hours..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                    Deductions (ETB)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={processForm.deductions}
                    onChange={(e) =>
                      setProcessForm({ ...processForm, deductions: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 text-red-600"
                    placeholder="Tax, advances..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                  Notes / Reference
                </label>
                <input
                  type="text"
                  value={processForm.notes}
                  onChange={(e) => setProcessForm({ ...processForm, notes: e.target.value })}
                  placeholder="e.g. Standard monthly salary payout"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Calculation Preview */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5">
                <div className="flex justify-between items-center text-xs text-emerald-800 mb-1">
                  <span>Gross Pay (Basic + Allowances + OT):</span>
                  <span className="font-semibold">
                    {formatCurrency(
                      Number(processForm.basicSalary) +
                        Number(processForm.allowances || 0) +
                        Number(processForm.overtime || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-red-700 mb-2">
                  <span>Total Deductions:</span>
                  <span className="font-semibold">
                    -{formatCurrency(Number(processForm.deductions || 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-emerald-200">
                  <span className="text-sm font-bold text-gray-900">Estimated Net Payout:</span>
                  <span className="text-lg font-bold text-emerald-800">
                    {formatCurrency(
                      Number(processForm.basicSalary) +
                        Number(processForm.allowances || 0) +
                        Number(processForm.overtime || 0) -
                        Number(processForm.deductions || 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors"
                >
                  Generate Payroll Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PAYSLIP PREVIEW & RECEIPT */}
      {/* ========================================================================= */}
      {showSlipModal && selectedPayroll && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 sticky top-0">
              <div>
                <span className="text-xs uppercase font-mono font-bold tracking-wider text-emerald-700">
                  PAYROLL SLIP
                </span>
                <h3 className="text-lg font-bold text-gray-900">
                  PAY-{selectedPayroll.id.slice(-5).toUpperCase()}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowSlipModal(false);
                  setSelectedPayroll(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Restaurant & Employee Meta */}
              <div className="bg-gray-50 rounded-lg p-3.5 border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">
                      {selectedPayroll.employee?.user?.firstName}{' '}
                      {selectedPayroll.employee?.user?.lastName}
                    </h4>
                    <p className="text-xs text-gray-500">{selectedPayroll.employee?.user?.email}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-xs font-semibold">
                    {selectedPayroll.employee?.employeeCode || 'EMP'}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <span className="font-medium">Period:</span>{' '}
                  {selectedPayroll.period
                    ? new Date(selectedPayroll.period).toLocaleDateString('en-US', {
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Current Month'}
                </div>
              </div>

              {/* Earnings & Deductions Breakdown */}
              <div className="space-y-2 text-sm border-t border-b border-gray-200 py-3">
                <div className="flex justify-between text-gray-700">
                  <span>Basic Base Salary:</span>
                  <span className="font-mono font-medium">
                    {formatCurrency(selectedPayroll.basicSalary)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Allowances:</span>
                  <span className="font-mono font-medium text-emerald-700">
                    +{formatCurrency(selectedPayroll.allowances || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Overtime Pay:</span>
                  <span className="font-mono font-medium text-emerald-700">
                    +{formatCurrency(selectedPayroll.overtime || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Statutory &amp; Advance Deductions:</span>
                  <span className="font-mono font-medium text-red-600">
                    -{formatCurrency(selectedPayroll.deductions || 0)}
                  </span>
                </div>
              </div>

              {/* Total Net Payout */}
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                <span className="text-base font-bold text-gray-900">Net Take-Home Pay:</span>
                <span className="text-xl font-bold text-emerald-700 font-mono">
                  {formatCurrency(selectedPayroll.netSalary)}
                </span>
              </div>

              {/* Status Notice */}
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Payment Status:</span>
                {selectedPayroll.status === 'PAID' ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Paid &amp; Disbursed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                    <Clock className="w-4 h-4" /> Pending Disbursal
                  </span>
                )}
              </div>

              {selectedPayroll.paymentMethod && (
                <div className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded border border-gray-200 flex justify-between">
                  <span>
                    Channel: <strong>{selectedPayroll.paymentMethod}</strong>
                  </span>
                  {selectedPayroll.transactionRef && (
                    <span>
                      Ref: <strong className="font-mono">{selectedPayroll.transactionRef}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Attached Screenshot / Voucher Preview inside Payslip */}
              {selectedPayroll.receiptImage && (
                <div className="border border-emerald-200 bg-emerald-50/30 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      Verified Transfer Proof
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setViewingProof({
                          image: selectedPayroll.receiptImage!,
                          empName: `${selectedPayroll.employee?.user?.firstName || ''} ${selectedPayroll.employee?.user?.lastName || ''}`,
                          amount: selectedPayroll.netSalary,
                          ref: selectedPayroll.transactionRef || `PAY-${selectedPayroll.id.slice(-5).toUpperCase()}`,
                          channel: selectedPayroll.paymentMethod || 'Transfer',
                        });
                        setShowProofViewerModal(true);
                      }}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Full View
                    </button>
                  </div>
                  <div className="max-h-48 overflow-hidden rounded-lg border border-gray-200 bg-white flex justify-center">
                    <img
                      src={selectedPayroll.receiptImage}
                      alt="Transfer Receipt"
                      className="max-h-44 object-contain"
                    />
                  </div>
                </div>
              )}

              {selectedPayroll.notes && (
                <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                  Note: "{selectedPayroll.notes}"
                </p>
              )}

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Printer className="w-4 h-4" />
                  Print Payslip
                </button>
                {selectedPayroll.status !== 'PAID' && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSlipModal(false);
                      openPaymentModal(selectedPayroll);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    <Banknote className="w-4 h-4" />
                    Pay &amp; Attach Proof
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowSlipModal(false);
                    setSelectedPayroll(null);
                  }}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ADD EMPLOYEE (ORIGINAL PRESERVED) */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add New Employee</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ employmentType: 'FULL_TIME', salary: 0 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="col-span-2">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Information</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Account Information</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    value={formData.username || ''}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    required
                    value={formData.roleId || ''}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                  <select
                    value={formData.branchId || ''}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Employment Details</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.employeeCode || ''}
                    onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    required
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                  <input
                    type="text"
                    required
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type *</label>
                  <select
                    required
                    value={formData.employmentType}
                    onChange={(e) =>
                      setFormData({ ...formData, employmentType: e.target.value as any })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {employmentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary (ETB) *</label>
                  <input
                    type="number"
                    required
                    value={formData.salary}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.hireDate || ''}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Banking &amp; Emergency</h3>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account Number</label>
                  <input
                    type="text"
                    value={formData.bankAccount || ''}
                    onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 100012345678"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergencyContact || ''}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ employmentType: 'FULL_TIME', salary: 0 });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: EDIT EMPLOYEE (ORIGINAL PRESERVED) */}
      {/* ========================================================================= */}
      {showEditModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Edit Employee</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedEmployee(null);
                  setFormData({ employmentType: 'FULL_TIME', salary: 0 });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleUpdateEmployee} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <input
                    type="text"
                    value={formData.position || ''}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Salary (ETB)</label>
                  <input
                    type="number"
                    value={formData.salary || 0}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || ''}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {statuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedEmployee(null);
                    setFormData({ employmentType: 'FULL_TIME', salary: 0 });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: VIEW EMPLOYEE (ORIGINAL PRESERVED) */}
      {/* ========================================================================= */}
      {showViewModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Employee Details</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedEmployee(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                  {selectedEmployee.user.firstName[0]}
                  {selectedEmployee.user.lastName[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedEmployee.user.firstName} {selectedEmployee.user.lastName}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {selectedEmployee.position} &bull; {selectedEmployee.department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Role &amp; Access</h4>
                  <p className="text-sm font-medium text-gray-900">{selectedEmployee.user.role.name}</p>
                  <p className="text-xs text-gray-500 mt-1">{selectedEmployee.user.email}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Compensation</h4>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(selectedEmployee.salary)}</p>
                  <p className="text-xs text-gray-500 mt-1">Monthly Basic</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedEmployee(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(selectedEmployee);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit Employee
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
