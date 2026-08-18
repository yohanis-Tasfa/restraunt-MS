import { useState } from 'react';
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
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TablesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
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
  const { data: tablesData, isLoading } = useQuery({
    queryKey: ['tables', user?.branch?.id],
    queryFn: () => tablesApi.getTables(user?.branch?.id),
    enabled: !!user?.branch?.id,
  });

  const tables = tablesData?.data || [];

  // Fetch waiters (employees with waiter role)
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'ACTIVE'],
    queryFn: () => employeesApi.getEmployees({ status: 'ACTIVE' }),
  });

  console.log('Employees API full response:', employeesData);

  // Filter waiters from employees - handle the nested data structure
  const waiters = (employeesData?.employees || []).filter(
    (emp: Employee) => {
      const roleName = emp.user?.role?.name?.toLowerCase() || '';
      const position = emp.position?.toLowerCase() || '';
      return roleName.includes('waiter') || 
             roleName.includes('server') ||
             position.includes('waiter') || 
             position.includes('server');
    }
  );

  console.log('All employees:', employeesData?.employees);
  console.log('Filtered waiters:', waiters);

  // Create table mutation
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

  // Update table mutation
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

  // Delete table mutation
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

  // Update table status mutation
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

  // Generate QR code mutation
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

  // Regenerate QR code mutation
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

  // Assign waiter mutation
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

  // Unassign waiter mutation
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

  // End customer session mutation
  const endSessionMutation = useMutation({
    mutationFn: async (tableId: string) => {
      // First get the active session for this table
      const session = await customerSessionApi.getActiveSessionByTable(tableId);
      // Then end it
      return await customerSessionApi.endSession(session.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      toast.success('Session ended. Table is now available.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to end session');
    },
  });

  const handleCreateTable = () => {
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
    if (window.confirm('Are you sure you want to delete this table?')) {
      deleteTableMutation.mutate(tableId);
    }
  };

  const openEditModal = (table: Table) => {
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
    setSelectedTable(table);
    setSelectedWaiterId(table.assignedWaiterId || '');
    setIsWaiterModalOpen(true);
  };

  const handleDownloadQR = async (tableId: string, tableNumber: string) => {
    try {
      // Create download URL with token
      const token = localStorage.getItem('token');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const downloadUrl = `${baseUrl}/tables/${tableId}/qr-code/download`;
      
      // Fetch with proper headers
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download QR code');
      }

      // Get blob from response
      const blob = await response.blob();
      
      // Create download link
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
        return 'bg-green-100 text-green-700 border-green-200';
      case TableStatus.OCCUPIED:
        return 'bg-red-100 text-red-700 border-red-200';
      case TableStatus.RESERVED:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case TableStatus.CLEANING:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: TableStatus) => {
    switch (status) {
      case TableStatus.AVAILABLE:
        return <CheckCircle className="w-4 h-4" />;
      case TableStatus.OCCUPIED:
        return <XCircle className="w-4 h-4" />;
      case TableStatus.RESERVED:
        return <Clock className="w-4 h-4" />;
      case TableStatus.CLEANING:
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    return status.replace('_', ' ');
  };

  // Statistics
  const stats = {
    total: tables.length,
    available: tables.filter((t: Table) => t.status === TableStatus.AVAILABLE).length,
    occupied: tables.filter((t: Table) => t.status === TableStatus.OCCUPIED).length,
    reserved: tables.filter((t: Table) => t.status === TableStatus.RESERVED).length,
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Table Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage restaurant tables and floor layout
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-gray-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.available}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.occupied}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Reserved</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.reserved}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tables yet</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first table</p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {tables.map((table: Table) => (
            <Card
              key={table.id}
              className={`p-4 border-2 transition-all hover:shadow-lg ${getStatusColor(
                table.status
              )}`}
            >
              {/* Table Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getStatusIcon(table.status)}
                  <span className="font-bold text-lg">Table {table.number}</span>
                </div>
                <div className="relative group">
                  <button className="p-1 hover:bg-black/5 rounded transition-colors">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 hidden group-hover:block z-10 min-w-[160px]">
                    <button
                      onClick={() => openEditModal(table)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Table
                    </button>
                    <button
                      onClick={() => openQRModal(table)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      QR Code
                    </button>
                    <button
                      onClick={() => openWaiterModal(table)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Assign Waiter
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Capacity */}
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4" />
                <span className="text-sm">Capacity: {table.capacity}</span>
              </div>

              {/* Assigned Waiter */}
              {table.assignedWaiter ? (
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <UserCheck className="w-4 h-4 text-green-600" />
                  <span className="truncate text-green-700">
                    {table.assignedWaiter.firstName} {table.assignedWaiter.lastName}
                  </span>
                </div>
              ) : (
                <div className="mb-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-orange-300 text-orange-700 hover:bg-orange-50"
                    onClick={() => openWaiterModal(table)}
                  >
                    <UserCheck className="w-3 h-3 mr-1" />
                    Assign Waiter
                  </Button>
                </div>
              )}

              {/* QR Code Status */}
              {table.qrCodeUrl && (
                <div className="flex items-center gap-2 mb-3 text-sm text-green-600">
                  <QrCode className="w-4 h-4" />
                  <span>QR Active</span>
                </div>
              )}

              {/* Status Badge */}
              <Badge className={`w-full justify-center ${getStatusColor(table.status)}`}>
                {getStatusLabel(table.status)}
              </Badge>

              {/* Quick Actions */}
              {table.status !== TableStatus.OCCUPIED && (
                <div className="mt-3 space-y-1">
                  {table.status === TableStatus.AVAILABLE && (
                    <Button
                      size="sm"
                      className="w-full"
                      variant="outline"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: table.id,
                          status: TableStatus.OCCUPIED,
                        })
                      }
                    >
                      Mark as Occupied
                    </Button>
                  )}
                  {table.status !== TableStatus.AVAILABLE && (
                    <Button
                      size="sm"
                      className="w-full"
                      variant="outline"
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: table.id,
                          status: TableStatus.AVAILABLE,
                        })
                      }
                    >
                      Mark as Available
                    </Button>
                  )}
                </div>
              )}

              {/* End Session Button for OCCUPIED tables */}
              {table.status === TableStatus.OCCUPIED && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    onClick={() => endSessionMutation.mutate(table.id)}
                    disabled={endSessionMutation.isPending}
                  >
                    {endSessionMutation.isPending ? 'Ending...' : 'End Session & Clear Table'}
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Table Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Table</DialogTitle>
            <DialogDescription>Create a new table for your restaurant</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="number">Table Number *</Label>
              <Input
                id="number"
                placeholder="e.g., 1, A1, T-101"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity *</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="Number of seats"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateTable}
              disabled={createTableMutation.isPending}
            >
              {createTableMutation.isPending ? 'Creating...' : 'Create Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Table Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Table</DialogTitle>
            <DialogDescription>Update table information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-number">Table Number *</Label>
              <Input
                id="edit-number"
                placeholder="e.g., 1, A1, T-101"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-capacity">Capacity *</Label>
              <Input
                id="edit-capacity"
                type="number"
                min="1"
                placeholder="Number of seats"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditTable}
              disabled={updateTableMutation.isPending}
            >
              {updateTableMutation.isPending ? 'Updating...' : 'Update Table'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={isQRModalOpen} onOpenChange={setIsQRModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code Management</DialogTitle>
            <DialogDescription>
              Generate and manage QR code for Table {selectedTable?.number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTable?.qrCodeUrl ? (
              <>
                <div className="flex justify-center p-6 bg-gray-50 rounded-lg">
                  <img
                    src={selectedTable.qrCodeUrl}
                    alt={`QR Code for Table ${selectedTable.number}`}
                    className="w-64 h-64 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => regenerateQRMutation.mutate(selectedTable.id)}
                    disabled={regenerateQRMutation.isPending}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {regenerateQRMutation.isPending ? 'Regenerating...' : 'Regenerate'}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleDownloadQR(selectedTable.id, selectedTable.number)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-4">No QR code generated yet</p>
                <Button
                  onClick={() => generateQRMutation.mutate(selectedTable?.id || '')}
                  disabled={generateQRMutation.isPending}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  {generateQRMutation.isPending ? 'Generating...' : 'Generate QR Code'}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQRModalOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waiter Assignment Modal */}
      <Dialog open={isWaiterModalOpen} onOpenChange={setIsWaiterModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Waiter</DialogTitle>
            <DialogDescription>
              Assign a waiter to Table {selectedTable?.number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTable?.assignedWaiter && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-800 font-medium">Currently Assigned</p>
                    <p className="text-green-900">
                      {selectedTable.assignedWaiter.firstName} {selectedTable.assignedWaiter.lastName}
                    </p>
                    <p className="text-sm text-green-700">{selectedTable.assignedWaiter.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unassignWaiterMutation.mutate(selectedTable.id)}
                    disabled={unassignWaiterMutation.isPending}
                  >
                    {unassignWaiterMutation.isPending ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="waiter-select">Select Waiter</Label>
              <Select value={selectedWaiterId} onValueChange={setSelectedWaiterId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a waiter" />
                </SelectTrigger>
                <SelectContent>
                  {waiters.length === 0 ? (
                    <div className="p-2 text-sm text-gray-500">No waiters available</div>
                  ) : (
                    waiters.map((waiter: Employee) => (
                      <SelectItem key={waiter.userId} value={waiter.userId}>
                        {waiter.user.firstName} {waiter.user.lastName} - {waiter.position}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWaiterModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignWaiter}
              disabled={assignWaiterMutation.isPending || !selectedWaiterId}
            >
              {assignWaiterMutation.isPending ? 'Assigning...' : 'Assign Waiter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
