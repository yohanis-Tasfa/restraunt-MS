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
  type: 'ready';
}

export function useOrderReadyNotifications() {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Only enable for waiters and kitchen staff
    if (!['Waiter', 'Kitchen Staff'].includes(user.role?.name || '')) return;

    // Handle order ready notification
    const handleOrderReady = (data: OrderReadyNotification) => {
      console.log('Order ready notification:', data);
      
      // Show success toast
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

      // Play notification sound (optional)
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

    // Register event listener
    socket.on('order:ready', handleOrderReady);

    console.log('Order ready notification listener registered');

    // Cleanup on unmount
    return () => {
      socket.off('order:ready', handleOrderReady);
      console.log('Order ready notification listener removed');
    };
  }, [socket, isConnected, user]);
}
