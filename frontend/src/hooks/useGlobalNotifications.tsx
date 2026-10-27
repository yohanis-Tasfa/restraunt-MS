import { useEffect } from 'react';
import { useWebSocket } from '../contexts/WebSocketContext';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import toast from 'react-hot-toast';

export function useGlobalNotifications() {
  const { socket, isConnected } = useWebSocket();
  const { user } = useAuthStore();
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (!socket || !isConnected || !user) return;

    const userRole = user.role?.name || '';
    const isWaiter = userRole === 'Waiter';
    const isStaffOrAdmin = ['Waiter', 'Kitchen Staff', 'Manager', 'Admin', 'Owner', 'Cashier'].includes(userRole);

    if (!isStaffOrAdmin) return;

    // 1. Waiter Call Created (Customer called waiter / ready to order / bill)
    const handleWaiterCallCreated = (call: any) => {
      // Role check: Waiters, Managers, Admins
      if (!['Waiter', 'Manager', 'Admin', 'Owner'].includes(userRole)) return;

      const tableNum = call.table?.number ? String(call.table.number).replace(/^T/i, '') : 'N/A';
      const reqType = call.requestType;
      
      let typeLabel = 'Customer called for assistance';
      if (reqType === 'ORDER_READY') typeLabel = 'Ready to place order';
      else if (reqType === 'BILL_REQUEST') typeLabel = 'Customer requested bill';
      else if (reqType === 'ASSISTANCE') typeLabel = 'Assistance requested';

      const itemsDetail = Array.isArray(call.selectedItems) && call.selectedItems.length > 0
        ? ` (${call.selectedItems.length} items chosen)`
        : '';

      // Add to unified header notification store
      addNotification({
        type: 'WAITER_CALL',
        title: `Table ${tableNum} Call`,
        message: `${typeLabel}${itemsDetail}`,
        tableNumber: tableNum,
        callId: call.id,
        link: '/admin/waiter-calls',
        priority: 'high',
      });

      // Show toast
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = '/admin/waiter-calls';
            }}
            className={`cursor-pointer max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-3.5 border-l-4 border-amber-500 transition-all ${
              t.visible ? 'animate-enter' : 'animate-leave'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛎️</span>
              <div>
                <p className="text-sm font-bold text-gray-900">Table {tableNum} — Waiter Call</p>
                <p className="text-xs text-gray-600 mt-0.5">{typeLabel}{itemsDetail}</p>
                <p className="text-[11px] text-amber-600 font-medium mt-1">Click to open Waiter Calls →</p>
              </div>
            </div>
          </div>
        ),
        { duration: 8000, position: 'top-right' }
      );
    };

    // 2. Kitchen Order Ready for Waiter Pickup
    const handleOrderReady = (data: any) => {
      // Role check: Waiters, Managers, Admins
      if (!['Waiter', 'Manager', 'Admin', 'Owner'].includes(userRole)) return;

      const order = data.order || data;
      const tableNum = order.table?.number ? String(order.table.number).replace(/^T/i, '') : 'N/A';
      const orderShortNum = order.orderNumber ? String(order.orderNumber).slice(-6) : '';
      const itemsCount = order.itemsCount || (Array.isArray(order.items) ? order.items.length : 0);
      const itemNames = order.itemNames || '';

      addNotification({
        type: 'ORDER_READY',
        title: `Order Ready — Table ${tableNum}`,
        message: itemNames ? `${itemNames}` : `Order #${orderShortNum} is ready for pickup`,
        tableNumber: tableNum,
        orderNumber: orderShortNum,
        orderId: order.id,
        link: '/admin/orders',
        priority: 'high',
      });

      // Show Toast
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = '/admin/orders';
            }}
            className={`cursor-pointer max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-3.5 border-l-4 border-green-500 transition-all ${
              t.visible ? 'animate-enter' : 'animate-leave'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍽️</span>
              <div>
                <p className="text-sm font-bold text-gray-900">Order Ready — Table {tableNum}</p>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{itemNames || `${itemsCount} items ready for table pickup`}</p>
                <p className="text-[11px] text-green-600 font-medium mt-1">Click to open Orders →</p>
              </div>
            </div>
          </div>
        ),
        { duration: 10000, position: 'top-right' }
      );
    };

    // 3. Order Ready Reminder
    const handleOrderReadyReminder = (data: any) => {
      if (!['Waiter', 'Manager', 'Admin', 'Owner'].includes(userRole)) return;

      const order = data.order || data;
      const tableNum = order.table?.number ? String(order.table.number).replace(/^T/i, '') : 'N/A';
      const reminderCount = data.reminderCount || 1;

      addNotification({
        type: 'ORDER_READY',
        title: `Reminder ${reminderCount}: Order Waiting — Table ${tableNum}`,
        message: `Order for Table ${tableNum} is still waiting for pickup in kitchen`,
        tableNumber: tableNum,
        orderNumber: order.orderNumber?.slice(-6),
        orderId: order.id,
        link: '/admin/orders',
        priority: 'urgent',
      });
    };

    // 4. Order Ready Escalation
    const handleOrderReadyEscalation = (data: any) => {
      if (!['Waiter', 'Manager', 'Admin', 'Owner'].includes(userRole)) return;

      const order = data.order || data;
      const tableNum = order.table?.number ? String(order.table.number).replace(/^T/i, '') : 'N/A';

      addNotification({
        type: 'ORDER_READY',
        title: `🚨 URGENT: Table ${tableNum} Order Waiting 2+ Min`,
        message: `Kitchen order for Table ${tableNum} has been waiting uncollected for over 2 minutes!`,
        tableNumber: tableNum,
        orderNumber: order.orderNumber?.slice(-6),
        orderId: order.id,
        link: '/admin/orders',
        priority: 'urgent',
      });
    };

    // Register socket listeners
    socket.on('waiter-call:created', handleWaiterCallCreated);
    socket.on('order:ready', handleOrderReady);
    socket.on('order:ready:reminder', handleOrderReadyReminder);
    socket.on('order:ready:escalation', handleOrderReadyEscalation);

    return () => {
      socket.off('waiter-call:created', handleWaiterCallCreated);
      socket.off('order:ready', handleOrderReady);
      socket.off('order:ready:reminder', handleOrderReadyReminder);
      socket.off('order:ready:escalation', handleOrderReadyEscalation);
    };
  }, [socket, isConnected, user, addNotification]);
}
