import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesApi, TableStatus, type Table } from '../api/tables';
import { employeesApi, type Employee } from '../api/employees';
import { customerSessionApi } from '../api/customer-session';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Plus,
  Edit,
  Trash2,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreVertical,
  QrCode,
  Download,
  RefreshCw,
  UserCheck,
  ShoppingCart,
  Sparkles,
  ShieldCheck,
  Utensils,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';

type TableFilter = 'all' | 'my' | 'available' | 'occupied' | 'unassigned';

export default function TablesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Role permissions
  const userRole = user?.role?.name || '';
  const isManager = userRole === 'Manager' || userRole === 'Owner' || userRole === 'Super Admin' || userRole === 'Admin';
  const isWaiter = userRole === 'Waiter';

  const [activeFilter, setActiveFilter] = useState<TableFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isWaiterModalOpen, setIsWaiterModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [formData, setFormData] = useState({
    number: '',
    capacity: '',
  });

  // Fetch tables
  const { data: tablesData, isLoading, refetch } = useQuery({
    queryKey: ['tables', user?.branch?.id],
    queryFn: () => tablesApi.getTables(user?.branch?.id),
    enabled: !!user?.branch?.id,
  });

  const tables = tablesData?.data || [];

  // Table accessibility:
  // - Managers / Admins see ALL tables
  // - Waiters see ONLY:
  //   1) Their own assigned tables (table.assignedWaiterId === user.id)
  //   2) Unassigned tables (open to all waiters)
  //   * Tables assigned to other waiters are NOT displayed.
  const accessibleTables = useMemo(() => {
    if (!isWaiter) return tables;
    return tables.filter(
      (table: Table) => !table.assignedWaiterId || table.assignedWaiterId === user?.id
    );
  }, [tables, isWaiter, user?.id]);

  // Fetch waiters (employees with waiter role) - only managers have access to manage employees
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'ACTIVE'],
    queryFn: () => employeesApi.getEmployees({ status: 'ACTIVE' }),
    enabled: isManager,
  });

  // Filter waiters from employees for assignment modal
  const waiters = (employeesData?.employees || []).filter(
    (emp: Employee) => {
      const roleName = emp.user?.role?.name?.toLowerCase() || '';
      const position = emp.position?.toLowerCase() || '';
      return (
        roleName.includes('waiter') ||
        roleName.includes('server') ||
        position.includes('waiter') ||
        position.includes('server')
      );
    }
  );

  // Statistics (based on accessible tables)
  const stats = useMemo(() => {
    return {
      total: accessibleTables.length,
      available: accessibleTables.filter((t: Table) => t.status === TableStatus.AVAILABLE).length,
      occupied: accessibleTables.filter((t: Table) => t.status === TableStatus.OCCUPIED).length,
      reserved: accessibleTables.filter((t: Table) => t.status === TableStatus.RESERVED).length,
      myTables: accessibleTables.filter((t: Table) => t.assignedWaiterId === user?.id).length,
      unassigned: accessibleTables.filter((t: Table) => !t.assignedWaiterId).length,
    };
  }, [accessibleTables, user?.id]);

  // Filtered tables based on selected tab
  const filteredTables = useMemo(() => {
    return accessibleTables.filter((table: Table) => {
      if (activeFilter === 'my') return table.assignedWaiterId === user?.id;
      if (activeFilter === 'available') return table.status === TableStatus.AVAILABLE;
      if (activeFilter === 'occupied') return table.status === TableStatus.OCCUPIED;
      if (activeFilter === 'unassigned') return !table.assignedWaiterId;
      return true;
    });
  }, [accessibleTables, activeFilter, user?.id]);

  // Create table mutation (Manager only)
  const createTableMutation = useMutation({
    mutationFn: tablesApi.createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table created successfully');
      setIsCreateModalOpen(false);
      setFormData({ number: '', capacity: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create table');
    },
  });

  // Update table mutation (Manager only)
  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Table> }) =>
      tablesApi.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table updated successfully');
      setIsEditModalOpen(false);
      setSelectedTable(null);
      setFormData({ number: '', capacity: '' });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update table');
    },
  });

  // Delete table mutation (Manager only)
  const deleteTableMutation = useMutation({
    mutationFn: tablesApi.deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete table');
    },
  });

  // Update table status mutation (Waiter & Manager)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TableStatus }) =>
      tablesApi.updateTableStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Table status updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Generate QR code mutation (Manager only)
  const generateQRMutation = useMutation({
    mutationFn: tablesApi.generateQRCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('QR code generated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate QR code');
    },
  });

  // Regenerate QR code mutation (Manager only)
  const regenerateQRMutation = useMutation({
    mutationFn: tablesApi.regenerateQRCode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('QR code regenerated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to regenerate QR code');
    },
  });

  // Assign waiter mutation (Manager only)
  const assignWaiterMutation = useMutation({
    mutationFn: ({ tableId, waiterId }: { tableId: string; waiterId: string }) =>
      tablesApi.assignWaiter(tableId, waiterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Waiter assigned successfully');
      setIsWaiterModalOpen(false);
      setSelectedTable(null);
      setSelectedWaiterId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to assign waiter');
    },
  });

  // Unassign waiter mutation (Manager only)
  const unassignWaiterMutation = useMutation({
    mutationFn: tablesApi.unassignWaiter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Waiter unassigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to unassign waiter');
    },
  });

  // Clear table & end session mutation (Waiter & Manager)
  const clearTableMutation = useMutation({
    mutationFn: async (table: Table) => {
      // 1. Try to end active session if one exists
      try {
        const session = await customerSessionApi.getActiveSessionByTable(table.id);
        if (session?.id) {
          await customerSessionApi.endSession(session.id);
        }
      } catch (err) {
        // No active digital session was found (e.g. table was occupied manually or via POS)
        // This is normal and expected; we still proceed to set the table available directly.
      }

      // 2. Always set the table status to AVAILABLE
      return await tablesApi.updateTableStatus(table.id, TableStatus.AVAILABLE);
    },
    onSuccess: (_, table) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success(`Table ${table.number} cleared and is now Available`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear table');
    },
  });

  const handleCreateTable = () => {
    if (!isManager) {
      toast.error('Only managers can create tables');
      return;
    }
    if (!formData.number || !formData.capacity) {
      toast.error('Please fill all required fields');
      return;
    }

    createTableMutation.mutate({
      number: formData.number,
      capacity: parseInt(formData.capacity),
      branchId: user?.branch?.id || '',
    });
  };

  const handleEditTable = () => {
    if (!isManager) {
      toast.error('Only managers can edit table layouts');
      return;
    }
    if (!selectedTable || !formData.number || !formData.capacity) {
      toast.error('Please fill all required fields');
      return;
    }

    updateTableMutation.mutate({
      id: selectedTable.id,
      data: {
        number: formData.number,
        capacity: parseInt(formData.capacity),
      },
    });
  };

  const handleDeleteTable = (tableId: string) => {
    if (!isManager) {
      toast.error('Only managers can delete tables');
      return;
    }
    if (window.confirm('Are you sure you want to delete this table?')) {
      deleteTableMutation.mutate(tableId);
    }
  };

  const openEditModal = (table: Table) => {
    if (!isManager) return;
    setSelectedTable(table);
    setFormData({
      number: table.number,
      capacity: table.capacity.toString(),
    });
    setIsEditModalOpen(true);
  };

  const openQRModal = (table: Table) => {
    setSelectedTable(table);
    setIsQRModalOpen(true);
  };

  const openWaiterModal = (table: Table) => {
    if (!isManager) {
      toast.error('Only managers can assign waiters to tables');
      return;
    }
    setSelectedTable(table);
    setSelectedWaiterId(table.assignedWaiterId || '');
    setIsWaiterModalOpen(true);
  };

  const handleDownloadQR = async (tableId: string, tableNumber: string) => {
    try {
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const downloadUrl = `${baseUrl}/tables/${tableId}/qr-code/download`;

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download QR code');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('QR code downloaded');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  const handleAssignWaiter = () => {
    if (!isManager) {
      toast.error('Only managers can assign waiters');
      return;
    }
    if (!selectedTable || !selectedWaiterId) {
      toast.error('Please select a waiter');
      return;
    }
    assignWaiterMutation.mutate({
      tableId: selectedTable.id,
      waiterId: selectedWaiterId,
    });
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return 'bg-green-50/60 dark:bg-[#091a13] border-green-200 dark:border-[#143225] text-green-700 dark:text-[#00e676]';
      case TableStatus.OCCUPIED:
        return 'bg-red-50/60 dark:bg-[#091a13] border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400';
      case TableStatus.RESERVED:
        return 'bg-blue-50/60 dark:bg-[#091a13] border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-400';
      case TableStatus.CLEANING:
        return 'bg-amber-50/60 dark:bg-[#091a13] border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400';
      default:
        return 'bg-gray-50 dark:bg-[#091a13] border-gray-200 dark:border-[#143225] text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case TableStatus.OCCUPIED:
        return <XCircle className="w-4 h-4 text-red-600" />;
      case TableStatus.RESERVED:
        return <Clock className="w-4 h-4 text-blue-600" />;
      case TableStatus.CLEANING:
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    return status.replace('_', ' ');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-56 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-gray-900 dark:text-gray-100">
      {/* ========================================================================= */}
      {/* HEADER SECTION WITH ROLE AWARENESS                                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-[#091a13] p-5 rounded-2xl border border-gray-200/80 dark:border-[#143225] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isWaiter ? 'Table Service & Floor' : 'Table Management'}
            </h1>
            {isManager && (
              <Badge className="bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800/40 text-xs font-semibold gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                Manager Controls
              </Badge>
            )}
            {isWaiter && (
              <Badge className="bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800/40 text-xs font-semibold gap-1">
                <Utensils className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                Waiter Service View
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isWaiter
              ? 'Viewing your assigned tables and open unassigned tables. Other servers\' tables are private.'
              : 'Manage dining room tables, seating capacities, floor layout, and waiter assignments'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="text-xs border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#0c2219] gap-1.5 cursor-pointer"
            title="Refresh tables"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>

          {/* Waiter quick action: Go to POS */}
          {isWaiter && (
            <Button
              size="sm"
              onClick={() => navigate('/admin/pos')}
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] font-medium text-xs gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              Open POS
            </Button>
          )}

          {/* Manager only: Add Table Button */}
          {isManager && (
            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Table
            </Button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STATISTICS CARDS                                                          */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-200 dark:border-[#143225] shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Tables</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{stats.total}</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-200 dark:border-[#143225] shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Available</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-[#00e676] mt-0.5 sm:mt-1">{stats.available}</p>
          </div>
        </Card>

        <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-200 dark:border-[#143225] shadow-xs">
          <div>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Occupied</p>
            <p className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5 sm:mt-1">{stats.occupied}</p>
          </div>
        </Card>

        {isWaiter ? (
          <Card className="p-3 sm:p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 shadow-xs">
            <div>
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 uppercase tracking-wide">My Assigned</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-800 dark:text-blue-200 mt-0.5 sm:mt-1">{stats.myTables}</p>
            </div>
          </Card>
        ) : (
          <Card className="p-3 sm:p-4 bg-white dark:bg-[#091a13] border border-gray-200 dark:border-[#143225] shadow-xs">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Unassigned</p>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 mt-0.5 sm:mt-1">{stats.unassigned}</p>
            </div>
          </Card>
        )}
      </div>

      {/* ========================================================================= */}
      {/* FILTER TABS                                                               */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-white dark:bg-[#091a13] px-4 py-3 rounded-xl border border-gray-200/80 dark:border-[#143225] shadow-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-gray-900 dark:bg-[#123627] text-white dark:text-[#00e676] shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219]'
            }`}
          >
            All Tables ({stats.total})
          </button>

          {/* Waiter specific filter: My Tables */}
          {isWaiter && (
            <button
              onClick={() => setActiveFilter('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                activeFilter === 'my'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800/40'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              My Tables ({stats.myTables})
            </button>
          )}

          <button
            onClick={() => setActiveFilter('available')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeFilter === 'available'
                ? 'bg-green-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219]'
            }`}
          >
            Available ({stats.available})
          </button>

          <button
            onClick={() => setActiveFilter('occupied')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeFilter === 'occupied'
                ? 'bg-red-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#0c2219]'
            }`}
          >
            Occupied ({stats.occupied})
          </button>

          {/* Unassigned / Open Tables filter */}
          <button
            onClick={() => setActiveFilter('unassigned')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
              activeFilter === 'unassigned'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800/40'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Unassigned ({stats.unassigned})
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Showing {filteredTables.length} of {accessibleTables.length} tables
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TABLES GRID                                                               */}
      {/* ========================================================================= */}
      {filteredTables.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-[#091a13] border border-gray-200 dark:border-[#143225] rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#0c2219] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No tables found</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {activeFilter === 'my'
              ? 'You do not have any tables assigned yet. Ask a manager to assign tables to you.'
              : activeFilter === 'unassigned'
              ? 'All tables currently have an assigned waiter!'
              : 'No tables match the current filter.'}
          </p>
          {isManager && tables.length === 0 && (
            <Button onClick={() => setIsCreateModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer">
              <Plus className="w-4 h-4 mr-2" />
              Add First Table
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4">
          {filteredTables.map((table: Table) => {
            const isAssignedToMe = isWaiter && table.assignedWaiterId === user?.id;
            const hasActiveSession = Boolean(table.customerSessions && table.customerSessions.length > 0);

            return (
              <Card
                key={table.id}
                className={`p-3 sm:p-4 border-2 transition-all hover:shadow-md flex flex-col justify-between ${getStatusColor(
                  table.status
                )} ${isAssignedToMe ? 'ring-2 ring-emerald-500/50 shadow-sm' : ''}`}
              >
                <div>
                  {/* Table Card Header */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getStatusIcon(table.status)}
                      <span className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                        Table {table.number}
                      </span>
                    </div>

                    {/* Top Right Action Area */}
                    <div className="flex items-center gap-1">
                      {/* For Waiter: Direct QR view button (no menu needed) */}
                      {isWaiter ? (
                        <button
                          onClick={() => openQRModal(table)}
                          title="View QR Code"
                          className="p-1.5 hover:bg-black/5 dark:hover:bg-white/10 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors cursor-pointer"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                      ) : (
                        /* For Manager: 3-dot management dropdown */
                        <div className="relative group">
                          <button className="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors text-gray-600 dark:text-gray-400 cursor-pointer">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <div className="absolute right-0 top-8 bg-white dark:bg-[#0c2219] border border-gray-200 dark:border-[#143225] rounded-xl shadow-lg py-1 hidden group-hover:block z-20 min-w-[170px]">
                            <button
                              onClick={() => openEditModal(table)}
                              className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#123627] flex items-center gap-2 text-gray-700 dark:text-gray-200 cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                              Edit Table
                            </button>
                            <button
                              onClick={() => openQRModal(table)}
                              className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#123627] flex items-center gap-2 text-gray-700 dark:text-gray-200 cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              QR Code
                            </button>
                            <button
                              onClick={() => openWaiterModal(table)}
                              className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-gray-50 dark:hover:bg-[#123627] flex items-center gap-2 text-gray-700 dark:text-gray-200 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
                              Assign Waiter
                            </button>
                            <div className="my-1 border-t border-gray-100 dark:border-[#143225]" />
                            <button
                              onClick={() => handleDeleteTable(table.id)}
                              className="w-full px-4 py-2 text-left text-xs font-medium hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 text-red-600 dark:text-red-400 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Table
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* My Table Highlight Badge */}
                  {isAssignedToMe && (
                    <div className="mb-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                        Assigned to You
                      </span>
                    </div>
                  )}

                  {/* Capacity */}
                  <div className="flex items-center gap-2 mb-3 text-xs text-gray-600 dark:text-gray-400">
                    <Users className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span>Capacity: {table.capacity} seats</span>
                  </div>

                  {/* ========================================================= */}
                  {/* ROLE-BASED WAITER ASSIGNMENT DISPLAY                     */}
                  {/* ========================================================= */}
                  {isManager ? (
                    // MANAGER VIEW: Can see and trigger assignment
                    table.assignedWaiter ? (
                      <div className="flex items-center justify-between mb-3 bg-white/80 dark:bg-[#071a12] p-2 rounded-lg border border-gray-200 dark:border-[#143225] text-xs shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676] shrink-0" />
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                            {table.assignedWaiter.firstName} {table.assignedWaiter.lastName}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-1.5 text-[11px] font-semibold text-emerald-600 dark:text-[#00e676] hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer"
                          onClick={() => openWaiterModal(table)}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-xs border-dashed border-orange-300 dark:border-amber-700/50 text-orange-700 dark:text-amber-400 hover:bg-orange-50 dark:hover:bg-amber-950/30 font-medium gap-1 cursor-pointer"
                          onClick={() => openWaiterModal(table)}
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Assign Waiter
                        </Button>
                      </div>
                    )
                  ) : (
                    // WAITER VIEW: Shows only their assigned tables and open unassigned tables
                    table.assignedWaiter ? (
                      <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 text-emerald-900 dark:text-[#00e676]">
                        <UserCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-[#00e676]" />
                        <span>Assigned to You</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-dashed border-amber-200 dark:border-amber-800/40 text-xs font-medium text-amber-800 dark:text-amber-300">
                        <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Unassigned • Open Table</span>
                      </div>
                    )
                  )}

                  {/* QR Active status badge */}
                  {table.qrCodeUrl && (
                    <div
                      onClick={() => openQRModal(table)}
                      className="flex items-center gap-1.5 mb-3 text-xs text-emerald-700 dark:text-[#00e676] font-medium cursor-pointer hover:underline"
                    >
                      <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00e676]" />
                      <span>QR Active</span>
                    </div>
                  )}

                  {/* Active Digital Session Badge if present */}
                  {hasActiveSession && (
                    <div className="flex items-center gap-1.5 mb-2.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-[11px] font-semibold text-blue-800 dark:text-blue-300">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                      </span>
                      <span>Active QR Session</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <Badge
                    variant="outline"
                    className={`w-full justify-center text-xs font-semibold py-1 mb-3 ${getStatusColor(
                      table.status
                    )}`}
                  >
                    {getStatusLabel(table.status)}
                  </Badge>
                </div>

                {/* ========================================================= */}
                {/* QUICK ACTION BUTTONS                                      */}
                {/* ========================================================= */}
                <div className="space-y-1.5 pt-2 border-t border-gray-200/50 dark:border-[#143225]">
                  {/* Table AVAILABLE Actions */}
                  {table.status === TableStatus.AVAILABLE && (
                    <div className="flex flex-col gap-1.5 w-full">
                      <Button
                        size="sm"
                        className="w-full h-8 px-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                        onClick={() =>
                          navigate('/admin/pos', {
                            state: { tableNumber: table.number },
                          })
                        }
                      >
                        <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Take Order</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full h-8 px-2 text-xs font-medium border-gray-300 dark:border-[#143225] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#0c2219] gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: table.id,
                            status: TableStatus.OCCUPIED,
                          })
                        }
                      >
                        <Users className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 shrink-0" />
                        <span className="truncate">Seat Guests</span>
                      </Button>
                    </div>
                  )}

                  {/* Table OCCUPIED Actions */}
                  {table.status === TableStatus.OCCUPIED && (
                    <div className="flex flex-col gap-1.5 w-full">
                      <Button
                        size="sm"
                        className="w-full h-8 px-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 dark:bg-[#00e676] dark:hover:bg-[#00c853] text-white dark:text-[#032314] gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                        onClick={() =>
                          navigate('/admin/pos', {
                            state: { tableNumber: table.number },
                          })
                        }
                      >
                        <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">Take Order (POS)</span>
                      </Button>
                      <Button
                        size="sm"
                        className="w-full h-8 px-2 text-xs font-medium bg-orange-600 hover:bg-orange-700 text-white gap-1.5 cursor-pointer shadow-xs transition-all active:scale-[0.98]"
                        onClick={() => clearTableMutation.mutate(table)}
                        disabled={clearTableMutation.isPending}
                      >
                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {clearTableMutation.isPending
                            ? 'Clearing Table...'
                            : hasActiveSession
                            ? 'End Session & Clear Table'
                            : 'Clear Table (Set Available)'}
                        </span>
                      </Button>
                    </div>
                  )}

                  {/* Cleaning or Reserved Table Action */}
                  {table.status !== TableStatus.AVAILABLE && table.status !== TableStatus.OCCUPIED && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-8 px-2 text-xs font-medium border-emerald-600/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 dark:border-emerald-800/40 cursor-pointer gap-1.5 transition-all active:scale-[0.98]"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: table.id,
                          status: TableStatus.AVAILABLE,
                        })
                      }
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Mark as Available</span>
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS (ROLE GUARDED)                                                     */}
      {/* ========================================================================= */}

      {/* 1. Create Table Modal (Manager Only) */}
      {isManager && (
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Add New Table</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">Create a new table for your restaurant branch</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="number" className="text-gray-900 dark:text-gray-200">Table Number *</Label>
                <Input
                  id="number"
                  placeholder="e.g., 1, A1, T-101"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="capacity" className="text-gray-900 dark:text-gray-200">Capacity (Seats) *</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  placeholder="Number of seats"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]">
                Cancel
              </Button>
              <Button onClick={handleCreateTable} disabled={createTableMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 2. Edit Table Modal (Manager Only) */}
      {isManager && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Edit Table</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">Update table number and seating capacity</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-number" className="text-gray-900 dark:text-gray-200">Table Number *</Label>
                <Input
                  id="edit-number"
                  placeholder="e.g., 1, A1, T-101"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white"
                />
              </div>
              <div>
                <Label htmlFor="edit-capacity" className="text-gray-900 dark:text-gray-200">Capacity *</Label>
                <Input
                  id="edit-capacity"
                  type="number"
                  min="1"
                  placeholder="Number of seats"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  className="bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)} className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]">
                Cancel
              </Button>
              <Button onClick={handleEditTable} disabled={updateTableMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                {updateTableMutation.isPending ? 'Updating...' : 'Update Table'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 3. QR Code Modal (View/Download for All, Regenerate for Manager Only) */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">QR Code - Table {selectedTable?.number}</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              {isManager
                ? 'Generate, download, or regenerate table digital QR code'
                : 'Customer ordering QR code for quick scanning and ordering'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTable?.qrCodeUrl ? (
              <>
                <div className="flex justify-center p-6 bg-gray-50 dark:bg-white rounded-xl border border-gray-200 dark:border-[#143225]">
                  <img
                    src={selectedTable.qrCodeUrl}
                    alt={`QR Code for Table ${selectedTable.number}`}
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  {/* Regenerate is restricted to Managers only to prevent invalidating physical prints */}
                  {isManager && (
                    <Button
                      variant="outline"
                      className="flex-1 text-xs dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
                      onClick={() => regenerateQRMutation.mutate(selectedTable.id)}
                      disabled={regenerateQRMutation.isPending}
                    >
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      {regenerateQRMutation.isPending ? 'Regenerating...' : 'Regenerate'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="flex-1 text-xs dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]"
                    onClick={() => handleDownloadQR(selectedTable.id, selectedTable.number)}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download PNG
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-[#0c2219] flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">No QR code generated yet for this table</p>
                {isManager ? (
                  <Button
                    onClick={() => generateQRMutation.mutate(selectedTable?.id || '')}
                    disabled={generateQRMutation.isPending}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    {generateQRMutation.isPending ? 'Generating...' : 'Generate QR Code'}
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400">Please request a manager to generate this QR code</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQRModalOpen(false)} className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 4. Waiter Assignment Modal (Manager Only) */}
      {isManager && (
        <Dialog open={isWaiterModalOpen} onOpenChange={setIsWaiterModalOpen}>
          <DialogContent className="bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Assign Waiter - Table {selectedTable?.number}</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                Assign or change the primary server assigned to this table
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedTable?.assignedWaiter && (
                <div className="p-4 bg-emerald-50 dark:bg-[#071a12] border border-emerald-200 dark:border-[#143225] rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-800 dark:text-[#00e676] font-semibold uppercase tracking-wider">
                        Currently Assigned Server
                      </p>
                      <p className="text-sm font-bold text-emerald-950 dark:text-white mt-0.5">
                        {selectedTable.assignedWaiter.firstName} {selectedTable.assignedWaiter.lastName}
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">{selectedTable.assignedWaiter.email}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs"
                      onClick={() => unassignWaiterMutation.mutate(selectedTable.id)}
                      disabled={unassignWaiterMutation.isPending}
                    >
                      {unassignWaiterMutation.isPending ? 'Removing...' : 'Remove'}
                    </Button>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="waiter-select" className="text-gray-900 dark:text-gray-200">Select Waiter</Label>
                <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
                  <SelectTrigger id="waiter-select" className="mt-1 bg-white dark:bg-[#071a12] border-gray-200 dark:border-[#143225] dark:text-white">
                    <SelectValue placeholder="Choose a waiter" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-[#091a13] border-gray-200 dark:border-[#143225]">
                    {waiters.length === 0 ? (
                      <div className="p-2 text-sm text-gray-500 dark:text-gray-400">No active waiters found</div>
                    ) : (
                      waiters.map((waiter: Employee) => (
                        <SelectItem key={waiter.userId} value={waiter.userId} className="dark:text-gray-200 dark:focus:bg-[#123627]">
                          {waiter.user.firstName} {waiter.user.lastName} ({waiter.position || 'Waiter'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWaiterModalOpen(false)} className="dark:border-[#143225] dark:text-gray-300 dark:hover:bg-[#0c2219]">
                Cancel
              </Button>
              <Button
                onClick={handleAssignWaiter}
                disabled={assignWaiterMutation.isPending || !selectedWaiterId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                {assignWaiterMutation.isPending ? 'Assigning...' : 'Assign Waiter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
