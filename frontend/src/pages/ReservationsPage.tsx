import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reservationsApi,
  ReservationStatus,
  type Reservation,
  type CreateReservationData,
} from '../api/reservations';
import { customersApi, type CreateCustomerData } from '../api/customers';
import { tablesApi, type Table } from '../api/tables';
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
  Search,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ReservationsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [formData, setFormData] = useState({
    customerFirstName: '',
    customerLastName: '',
    customerPhone: '',
    customerEmail: '',
    reservationDateTime: '',
    guests: '',
    tableIds: [] as string[], // Changed to array for multi-select
    notes: '',
  });

  // Fetch reservations
  const { data, isLoading } = useQuery({
    queryKey: ['reservations', user?.branch?.id],
    queryFn: () =>
      reservationsApi.getReservations({
        branchId: user?.branch?.id,
        limit: 100,
      }),
    enabled: !!user?.branch?.id,
  });

  const reservations = data?.data || [];

  // Fetch available tables
  const { data: tablesData } = useQuery({
    queryKey: ['tables', user?.branch?.id],
    queryFn: () => tablesApi.getAvailableTables(user?.branch?.id),
    enabled: !!user?.branch?.id,
  });

  const availableTables = Array.isArray(tablesData) ? tablesData : [];

  // Smart table suggestions based on guest count
  const suggestedTables = useMemo(() => {
    if (!formData.guests || !availableTables.length) return [];
    
    const guestCount = parseInt(formData.guests);
    if (isNaN(guestCount) || guestCount <= 0) return [];

    // Sort tables by capacity
    const sortedTables = [...availableTables].sort((a, b) => a.capacity - b.capacity);

    // Find best table combinations
    const suggestions: { tables: Table[]; totalCapacity: number; waste: number }[] = [];

    // Single table solutions
    sortedTables.forEach(table => {
      if (table.capacity >= guestCount) {
        suggestions.push({
          tables: [table],
          totalCapacity: table.capacity,
          waste: table.capacity - guestCount,
        });
      }
    });

    // Two table combinations
    for (let i = 0; i < sortedTables.length; i++) {
      for (let j = i + 1; j < sortedTables.length; j++) {
        const totalCapacity = sortedTables[i].capacity + sortedTables[j].capacity;
        if (totalCapacity >= guestCount) {
          suggestions.push({
            tables: [sortedTables[i], sortedTables[j]],
            totalCapacity,
            waste: totalCapacity - guestCount,
          });
        }
      }
    }

    // Sort by least waste, then by fewest tables
    suggestions.sort((a, b) => {
      if (a.waste !== b.waste) return a.waste - b.waste;
      return a.tables.length - b.tables.length;
    });

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }, [formData.guests, availableTables]);

  // Calculate total capacity of selected tables
  const selectedTablesCapacity = useMemo(() => {
    return formData.tableIds.reduce((total, tableId) => {
      const table = availableTables.find(t => t.id === tableId);
      return total + (table?.capacity || 0);
    }, 0);
  }, [formData.tableIds, availableTables]);

  // Filter reservations
  const filteredReservations = reservations.filter(
    (res: Reservation) =>
      res.customer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.customer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.table?.number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: reservationsApi.createReservation,
    onSuccess: async () => {
      // Force refetch the reservations
      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
      await queryClient.refetchQueries({ queryKey: ['reservations', user?.branch?.id] });
      toast.success('Reservation created successfully');
      setIsCreateModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create reservation');
    },
  });

  // Update reservation status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      reservationsApi.updateReservationStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
      await queryClient.refetchQueries({ queryKey: ['reservations', user?.branch?.id] });
      toast.success('Reservation status updated');
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  // Cancel reservation mutation
  const cancelReservationMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.cancelReservation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
      await queryClient.refetchQueries({ queryKey: ['reservations', user?.branch?.id] });
      toast.success('Reservation cancelled');
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel reservation');
    },
  });

  // Delete reservation mutation
  const deleteReservationMutation = useMutation({
    mutationFn: (id: string) => reservationsApi.deleteReservation(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['reservations'] });
      await queryClient.refetchQueries({ queryKey: ['reservations', user?.branch?.id] });
      toast.success('Reservation deleted');
      setIsDetailsModalOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete reservation');
    },
  });

  const handleCreateReservation = async () => {
    // Validate required fields only (table is optional)
    if (
      !formData.customerFirstName.trim() ||
      !formData.customerLastName.trim() ||
      !formData.customerPhone.trim() ||
      !formData.reservationDateTime ||
      !formData.guests
    ) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // Step 1: Check if customer already exists by phone
      let customer;
      try {
        const existingCustomers = await customersApi.getCustomers(user?.restaurant?.id);
        customer = existingCustomers.data.find(
          (c) => c.phone === formData.customerPhone && c.restaurantId === user?.restaurant?.id
        );
      } catch (error) {
        console.log('Error searching for customer:', error);
      }

      // Step 2: Create customer if not found
      if (!customer) {
        const customerData: CreateCustomerData = {
          firstName: formData.customerFirstName,
          lastName: formData.customerLastName,
          phone: formData.customerPhone,
          email: formData.customerEmail.trim() || undefined,
          restaurantId: user?.restaurant?.id || '',
        };

        customer = await customersApi.createCustomer(customerData);
      }

      // Step 3: Create reservation with customer ID
      const reservationData: CreateReservationData = {
        customerId: customer.id,
        branchId: user?.branch?.id || '',
        tableIds: formData.tableIds.length > 0 ? formData.tableIds : undefined,
        reservationDate: formData.reservationDateTime,
        guests: parseInt(formData.guests),
        notes: formData.notes,
      };

      createReservationMutation.mutate(reservationData);
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create reservation';
      toast.error(errorMessage);
    }
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatus = (status: ReservationStatus) => {
    if (selectedReservation) {
      updateStatusMutation.mutate({ id: selectedReservation.id, status });
    }
  };

  const handleCancelReservation = () => {
    if (selectedReservation && window.confirm('Are you sure you want to cancel this reservation?')) {
      cancelReservationMutation.mutate(selectedReservation.id);
    }
  };

  const handleDeleteReservation = () => {
    if (selectedReservation && window.confirm('Are you sure you want to permanently delete this reservation? This action cannot be undone.')) {
      deleteReservationMutation.mutate(selectedReservation.id);
    }
  };

  const resetForm = () => {
    setFormData({
      customerFirstName: '',
      customerLastName: '',
      customerPhone: '',
      customerEmail: '',
      reservationDateTime: '',
      guests: '',
      tableIds: [],
      notes: '',
    });
  };

  const getStatusColor = (status: ReservationStatus) => {
    switch (status) {
      case ReservationStatus.PENDING:
        return 'bg-yellow-100 text-yellow-700';
      case ReservationStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-700';
      case ReservationStatus.SEATED:
        return 'bg-purple-100 text-purple-700';
      case ReservationStatus.COMPLETED:
        return 'bg-green-100 text-green-700';
      case ReservationStatus.CANCELLED:
        return 'bg-red-100 text-red-700';
      case ReservationStatus.NO_SHOW:
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  // Statistics
  const stats = {
    total: reservations.length,
    today: reservations.filter((r: Reservation) => {
      const today = new Date().toDateString();
      return new Date(r.reservationDate).toDateString() === today;
    }).length,
    upcoming: reservations.filter(
      (r: Reservation) =>
        r.status === ReservationStatus.PENDING || r.status === ReservationStatus.CONFIRMED
    ).length,
    completed: reservations.filter((r: Reservation) => r.status === ReservationStatus.COMPLETED)
      .length,
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
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded" />
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
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-sm text-gray-500 mt-1">Manage table reservations</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Reservation
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Today</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{stats.today}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search by customer name, phone, or table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11"
          />
        </div>
      </div>

      {/* Reservations Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[60px_150px_120px_150px_100px_120px_140px_120px_50px] gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
          <div>#</div>
          <div>Customer</div>
          <div>Phone</div>
          <div>Date & Time</div>
          <div>Guests</div>
          <div>Table</div>
          <div>Status</div>
          <div>Created</div>
          <div></div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No reservations found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Create your first reservation'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Reservation
                </Button>
              )}
            </div>
          ) : (
            filteredReservations.map((reservation: Reservation, index: number) => (
              <div
                key={reservation.id}
                className="grid grid-cols-[60px_150px_120px_150px_100px_120px_140px_120px_50px] gap-4 px-4 py-4 hover:bg-gray-50 transition-colors items-center text-sm"
              >
                {/* Number */}
                <div className="font-medium text-gray-900">{index + 1}</div>

                {/* Customer */}
                <div className="text-gray-900 font-medium">
                  {reservation.customer.firstName} {reservation.customer.lastName}
                </div>

                {/* Phone */}
                <div className="text-gray-700">{reservation.customer.phone || '-'}</div>

                {/* Date & Time */}
                <div className="text-gray-700">
                  {format(new Date(reservation.reservationDate), 'MMM dd, yyyy HH:mm')}
                </div>

                {/* Guests */}
                <div className="text-gray-700 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {reservation.guests}
                </div>

                {/* Table */}
                <div className="text-gray-700">
                  {reservation.reservationTables && reservation.reservationTables.length > 0
                    ? reservation.reservationTables
                        .map(rt => `Table ${rt.table.number}`)
                        .join(', ')
                    : reservation.table
                    ? `Table ${reservation.table.number}`
                    : 'Not assigned'}
                </div>

                {/* Status */}
                <div>
                  <Badge className={`${getStatusColor(reservation.status)} font-normal text-xs`}>
                    {reservation.status}
                  </Badge>
                </div>

                {/* Created */}
                <div className="text-gray-500 text-xs">{getTimeAgo(reservation.createdAt)}</div>

                {/* Actions */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleViewDetails(reservation)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Eye className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Reservation Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Reservation</DialogTitle>
            <DialogDescription>Create a new table reservation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Customer Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.customerFirstName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerFirstName: e.target.value })
                  }
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.customerLastName}
                  onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="+251 912 345 678"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Reservation Details */}
            <div>
              <Label htmlFor="datetime">Date & Time *</Label>
              <Input
                id="datetime"
                type="datetime-local"
                value={formData.reservationDateTime}
                onChange={(e) => setFormData({ ...formData, reservationDateTime: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="guests">Number of Guests *</Label>
                <Input
                  id="guests"
                  type="number"
                  min="1"
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  placeholder="4"
                />
              </div>
              <div>
                <Label>Selected Tables Capacity</Label>
                <div className="flex items-center gap-2 h-10 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">
                    {selectedTablesCapacity > 0 ? selectedTablesCapacity : '—'}
                  </span>
                  {formData.guests && selectedTablesCapacity > 0 && (
                    <span
                      className={`ml-auto text-xs ${
                        selectedTablesCapacity >= parseInt(formData.guests)
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {selectedTablesCapacity >= parseInt(formData.guests) ? '✓ Sufficient' : '✗ Insufficient'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Table Selection */}
            <div>
              <Label>Table Assignment (Optional)</Label>
              <p className="text-xs text-gray-500 mb-2">
                Select one or more tables for this reservation
              </p>
              
              {/* Smart Suggestions */}
              {suggestedTables.length > 0 && formData.guests && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs font-medium text-blue-900 mb-2">
                    💡 Suggested table combinations for {formData.guests} guests:
                  </p>
                  <div className="space-y-1">
                    {suggestedTables.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            tableIds: suggestion.tables.map(t => t.id),
                          });
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs bg-white hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                      >
                        <span className="font-medium">
                          {suggestion.tables.map(t => `Table ${t.number}`).join(' + ')}
                        </span>
                        <span className="text-gray-600 ml-2">
                          ({suggestion.tables.map(t => t.capacity).join(' + ')} = {suggestion.totalCapacity} seats)
                        </span>
                        {suggestion.waste === 0 && (
                          <span className="ml-2 text-green-600">Perfect fit!</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Tables List */}
              <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
                {availableTables.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No available tables at the moment
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {availableTables.map((table) => {
                      const isSelected = formData.tableIds.includes(table.id);
                      return (
                        <label
                          key={table.id}
                          className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 transition-colors ${
                            isSelected ? 'bg-green-50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  tableIds: [...formData.tableIds, table.id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  tableIds: formData.tableIds.filter(id => id !== table.id),
                                });
                              }
                            }}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-gray-900">Table {table.number}</span>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{table.capacity} seats</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Selected Tables Summary */}
              {formData.tableIds.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.tableIds.map(tableId => {
                    const table = availableTables.find(t => t.id === tableId);
                    if (!table) return null;
                    return (
                      <div
                        key={tableId}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        <span>Table {table.number} ({table.capacity})</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              tableIds: formData.tableIds.filter(id => id !== tableId),
                            });
                          }}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="notes">Special Notes</Label>
              <textarea
                id="notes"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special requests or dietary restrictions..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateReservation}
              disabled={createReservationMutation.isPending}
            >
              {createReservationMutation.isPending ? 'Creating...' : 'Create Reservation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reservation Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Reservation Details</DialogTitle>
          </DialogHeader>

          {selectedReservation && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Customer</p>
                  <p className="font-medium">
                    {selectedReservation.customer.firstName}{' '}
                    {selectedReservation.customer.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium">{selectedReservation.customer.phone || '-'}</p>
                </div>
              </div>

              {/* Reservation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-medium">
                    {format(new Date(selectedReservation.reservationDate), 'PPP p')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Guests</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedReservation.guests}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Table</p>
                  <p className="font-medium">
                    {selectedReservation.reservationTables &&
                    selectedReservation.reservationTables.length > 0
                      ? selectedReservation.reservationTables
                          .map(rt => `Table ${rt.table.number}`)
                          .join(', ')
                      : selectedReservation.table
                      ? `Table ${selectedReservation.table.number}`
                      : 'Not assigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge className={getStatusColor(selectedReservation.status)}>
                    {selectedReservation.status}
                  </Badge>
                </div>
              </div>

              {/* Notes */}
              {selectedReservation.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Notes</p>
                  <p className="text-sm bg-gray-50 p-3 rounded">{selectedReservation.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                {selectedReservation.status === ReservationStatus.PENDING && (
                  <Button
                    onClick={() => handleUpdateStatus(ReservationStatus.CONFIRMED)}
                    className="flex-1"
                  >
                    Confirm
                  </Button>
                )}
                {selectedReservation.status === ReservationStatus.CONFIRMED && (
                  <Button
                    onClick={() => handleUpdateStatus(ReservationStatus.SEATED)}
                    className="flex-1"
                  >
                    Mark as Seated
                  </Button>
                )}
                {selectedReservation.status === ReservationStatus.SEATED && (
                  <Button
                    onClick={() => handleUpdateStatus(ReservationStatus.COMPLETED)}
                    className="flex-1"
                  >
                    Complete
                  </Button>
                )}
                {selectedReservation.status !== ReservationStatus.COMPLETED &&
                  selectedReservation.status !== ReservationStatus.CANCELLED && (
                    <Button variant="destructive" onClick={handleCancelReservation}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                {/* Delete button - always available */}
                <Button 
                  variant="outline" 
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={handleDeleteReservation}
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
