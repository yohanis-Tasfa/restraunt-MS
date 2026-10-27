import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { ChefHat } from 'lucide-react';

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
      
      // Show success toast - Green for primary notification
      toast.success(
        `🍽️ Order Ready! #${data.order.orderNumber.slice(-8)} - Table ${data.order.table?.number || 'N/A'} (${data.order.itemsCount || 0} items)`,
        {
          duration: 10000, // Show for 10 seconds
          position: 'top-right',
          icon: '🔔',
          style: {
            background: '#10B981',
            color: '#fff',
            fontWeight: 'bold',
          },
        }
      );

      // Play notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.7;
        audio.play().catch(() => {
          // Silently fail if audio can't play
        });
      } catch (error) {
        // Ignore audio errors
      }
    };

    // Handle reminder notifications (every 30s to assigned waiter)
    const handleOrderReadyReminder = (data: OrderReadyNotification) => {
      console.log(`Order ready reminder ${data.reminderCount}:`, data);
      
      // Show orange/yellow reminder toast (increasing urgency)
      const reminderCount = data.reminderCount || 1;
      toast(
        `🔔 Reminder ${reminderCount}: Order waiting! #${data.order.orderNumber.slice(-8)} - Table ${data.order.table?.number || 'N/A'}`,
        {
          duration: 8000,
          position: 'top-right',
          icon: '⏰',
          style: {
            background: reminderCount === 1 ? '#F59E0B' : reminderCount === 2 ? '#F97316' : '#EF4444', // Yellow → Orange → Red
            color: '#fff',
            fontWeight: 'bold',
          },
        }
      );

      // Play sound with increasing volume
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = Math.min(0.7 + (reminderCount * 0.1), 1.0); // Gradually increase volume
        audio.play().catch(() => {});
      } catch (error) {}
    };

    // Handle escalation notification (broadcast to all waiters after 2 minutes)
    const handleOrderReadyEscalation = (data: OrderReadyNotification) => {
      console.log('Order ready ESCALATION notification:', data);
      
      // Show urgent toast - Red for escalation (very urgent)
      toast(
        `🚨 URGENT: Order waiting 2min! #${data.order.orderNumber.slice(-8)} - Table ${data.order.table?.number || 'N/A'}`,
        {
          duration: 15000, // Show for 15 seconds (longer for urgency)
          position: 'top-right',
          icon: '🚨',
          style: {
            background: '#DC2626',
            color: '#fff',
            fontWeight: 'bold',
            border: '3px solid #991B1B',
            boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)',
          },
        }
      );

      // Play louder sound for escalation
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 1.0; // Maximum volume for urgency
        audio.play().catch(() => {});
      } catch (error) {}
    };

    // Register event listeners
    socket.on('order:ready', handleOrderReady);
    socket.on('order:ready:reminder', handleOrderReadyReminder);
    socket.on('order:ready:escalation', handleOrderReadyEscalation);

    console.log('Order ready notification listeners registered');

    // Cleanup on unmount
    return () => {
      socket.off('order:ready', handleOrderReady);
      socket.off('order:ready:reminder', handleOrderReadyReminder);
      socket.off('order:ready:escalation', handleOrderReadyEscalation);
      console.log('Order ready notification listeners removed');
    };
  }, [socket, isConnected, user]);
}
