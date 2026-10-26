import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// Type definition for bill request data in notifications
interface BillRequest {
  id: string;
  orderId: string;
  tableId?: string;
  requestedById: string;
  status: string;
  priority: number;
  notes?: string;
  requestedAt: string;
  processedById?: string;
  processedAt?: string;
  billId?: string;
  createdAt: string;
  updatedAt: string;
  order?: any;
  table?: any;
  requestedBy?: any;
  processedBy?: any;
}

interface BillRequestNotificationData {
  billRequest: BillRequest;
  message: string;
  type: 'created' | 'processed' | 'completed' | 'cancelled';
}

export function useBillRequestNotifications() {
  const { socket, isConnected } = useWebSocket();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    console.log('Setting up bill request WebSocket listeners');

    // Listen for new bill requests (for Cashiers)
    socket.on('billRequest:created', (data: BillRequestNotificationData) => {
      console.log('New bill request received:', data);

      // Only notify Cashiers and Managers
      if (user.role?.name === 'Cashier' || user.role?.name === 'Manager' || user.role?.name === 'Owner') {
        toast.success(`New bill request from Table ${data.billRequest.table?.number || 'N/A'}`, {
          duration: 5000,
          icon: '📄',
        });

        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => console.log('Could not play notification sound'));
      }

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
    });

    // Listen for bill request processing updates (for Waiters who created the request)
    socket.on('billRequest:processed', (data: BillRequestNotificationData) => {
      console.log('Bill request processing started:', data);

      // Notify the waiter who created the request
      if (data.billRequest.requestedById === user.id) {
        toast.info(`Your bill request for Table ${data.billRequest.table?.number || 'N/A'} is being processed`, {
          duration: 4000,
          icon: '⏳',
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
    });

    // Listen for bill request completion (for Waiters)
    socket.on('billRequest:completed', (data: BillRequestNotificationData) => {
      console.log('Bill request completed:', data);

      // Notify the waiter who created the request
      if (data.billRequest.requestedById === user.id) {
        toast.success(`Bill ready for Table ${data.billRequest.table?.number || 'N/A'}!`, {
          duration: 5000,
          icon: '✅',
        });

        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => console.log('Could not play notification sound'));
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    });

    // Listen for bill request cancellation (for Waiters)
    socket.on('billRequest:cancelled', (data: BillRequestNotificationData) => {
      console.log('Bill request cancelled:', data);

      // Notify the waiter who created the request
      if (data.billRequest.requestedById === user.id) {
        toast.error(`Bill request for Table ${data.billRequest.table?.number || 'N/A'} was cancelled`, {
          duration: 5000,
          icon: '❌',
        });
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['bill-requests'] });
    });

    // Cleanup listeners on unmount
    return () => {
      console.log('Cleaning up bill request WebSocket listeners');
      socket.off('billRequest:created');
      socket.off('billRequest:processed');
      socket.off('billRequest:completed');
      socket.off('billRequest:cancelled');
    };
  }, [socket, isConnected, user, queryClient]);

  return { isConnected };
}
