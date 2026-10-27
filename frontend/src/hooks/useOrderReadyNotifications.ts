import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { soundManager } from '../utils/sound';

interface OrderReadyNotification {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    table?: {
      number: string;
    };
    itemsCount?: number;
    itemNames?: string;
    createdAt: string;
  };
  message: string;
  type: 'ready' | 'ready_reminder' | 'ready_escalation';
  timestamp: string;
  escalated?: boolean;
  reminderCount?: number;
}

export function useOrderReadyNotifications() {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Only enable for waiters and kitchen staff
    if (!['Waiter', 'Kitchen Staff'].includes(user.role?.name || '')) return;

    // Handle primary order ready notification (only assigned waiter)
    const handleOrderReady = (data: OrderReadyNotification) => {
      console.log('Order ready notification:', data);
      
      // Play synthesized audio and voice
      soundManager.alertOrderReady(data.order.table?.number, data.order.orderNumber);
    };

    // Handle reminder notifications (every 30s to assigned waiter)
    const handleOrderReadyReminder = (data: OrderReadyNotification) => {
      console.log(`Order ready reminder ${data.reminderCount}:`, data);
      soundManager.playUrgentAlert();
    };

    // Handle escalation notification (broadcast to all waiters after 2 minutes)
    const handleOrderReadyEscalation = (data: OrderReadyNotification) => {
      console.log('Order ready ESCALATION notification:', data);
      soundManager.playUrgentAlert();
    };

    // Register event listeners
    socket.on('order:ready', handleOrderReady);
    socket.on('order:ready:reminder', handleOrderReadyReminder);
    socket.on('order:ready:escalation', handleOrderReadyEscalation);

    return () => {
      socket.off('order:ready', handleOrderReady);
      socket.off('order:ready:reminder', handleOrderReadyReminder);
      socket.off('order:ready:escalation', handleOrderReadyEscalation);
    };
  }, [socket, isConnected, user]);
}
