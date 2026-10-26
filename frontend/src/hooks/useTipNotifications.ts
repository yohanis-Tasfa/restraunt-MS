import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { DollarSign, CheckCircle } from 'lucide-react';

interface TipNotification {
  tip: {
    id: string;
    amount: number;
    method: string;
    status: string;
    orderId: string;
    createdAt: string;
  };
  message: string;
  type: 'received' | 'paid';
}

export function useTipNotifications() {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    // Only enable for waiters
    if (user.role?.name !== 'Waiter') return;

    // Handle tip received notification
    const handleTipReceived = (data: TipNotification) => {
      console.log('Tip received notification:', data);
      
      // Show success toast
      toast.success(
        `🎉 Transfer Tip Received! ${data.tip.amount.toFixed(2)} ETB from ${data.tip.method} payment. Pending payout from manager.`,
        {
          duration: 8000,
          position: 'top-right',
          icon: '💰',
        }
      );

      // Play notification sound (optional)
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => {
          // Silently fail if audio can't play
        });
      } catch (error) {
        // Ignore audio errors
      }
    };

    // Handle tip paid notification
    const handleTipPaid = (data: TipNotification) => {
      console.log('Tip paid notification:', data);
      
      // Show success toast
      toast.success(
        `✅ Tip Paid Out! ${data.tip.amount.toFixed(2)} ETB has been paid out by manager.`,
        {
          duration: 6000,
          position: 'top-right',
          icon: '💵',
        }
      );
    };

    // Register event listeners
    socket.on('tip:received', handleTipReceived);
    socket.on('tip:paid', handleTipPaid);

    console.log('Tip notification listeners registered');

    // Cleanup on unmount
    return () => {
      socket.off('tip:received', handleTipReceived);
      socket.off('tip:paid', handleTipPaid);
      console.log('Tip notification listeners removed');
    };
  }, [socket, isConnected, user]);
}
