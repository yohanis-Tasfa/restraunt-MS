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
    const isStaffOrAdmin = ['Waiter', 'Kitchen Staff', 'Manager', 'Admin', 'Owner', 'Cashier', 'Super Admin'].includes(userRole);

    if (!isStaffOrAdmin) return;

    // 1. Kitchen Ingredient Requisition Created
    // STRICT RBAC: ONLY Managers, Admins, Owners. NEVER Waiters or Cashiers!
    const handleIngredientRequestCreated = (data: any) => {
      if (!['Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole)) {
        // Waiters and Cashiers are strictly forbidden from seeing ingredient requests!
        return;
      }

      const req = data.request || data;
      const isUrgent = req.priority === 'URGENT';
      const inventoryName = req.inventoryName || 'Kitchen stock';
      const quantityText = `${req.quantity} ${req.unit || ''}`.trim();
      const requestedBy = req.requestedByName || 'Kitchen Staff';

      addNotification({
        type: 'INGREDIENT_REQUEST',
        title: `Kitchen Requisition${isUrgent ? ' (URGENT)' : ''}`,
        message: `${requestedBy} requested ${quantityText} of ${inventoryName}`,
        link: '/admin/ingredient-requests',
        targetRoles: ['Manager', 'Admin', 'Owner', 'Super Admin'],
        priority: isUrgent ? 'urgent' : 'high',
      });

      // Show Toast only for Manager / Owner
      toast.custom(
        (t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              window.location.href = '/admin/ingredient-requests';
            }}
            className={`cursor-pointer max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-3.5 border-l-4 ${
              isUrgent ? 'border-rose-500' : 'border-amber-500'
            } transition-all ${t.visible ? 'animate-enter' : 'animate-leave'}`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{isUrgent ? '🚨' : '📦'}</span>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">Kitchen Ingredient Requisition</p>
                  {isUrgent && (
                    <span className="text-[10px] font-black bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                      URGENT
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {requestedBy} requested <strong className="text-gray-900">{quantityText} of {inventoryName}</strong>
                </p>
                <p className="text-[11px] text-amber-600 font-bold mt-1">Click to Review & Issue to Kitchen →</p>
              </div>
            </div>
          </div>
        ),
        { duration: 9000, position: 'top-right' }
      );
    };

    // 2. Kitchen Ingredient Requisition Updated (Approved / Rejected)
    // STRICT RBAC: ONLY Kitchen Staff who requested the ingredients
    const handleIngredientRequestUpdated = (data: any) => {
      if (userRole !== 'Kitchen Staff') return;

      const req = data.request || data;
      const isApproved = req.status === 'APPROVED';
      toast.success(
        data.message || `Requisition for ${req.inventoryName} was ${isApproved ? 'Approved & Issued' : 'Rejected'}`,
        {
          duration: 6000,
          icon: isApproved ? '✅' : '❌',
        }
      );
    };

    // 3. Waiter Call Created (Customer called waiter / assistance / bill)
    // STRICT RBAC: Waiters, Managers, Admins. NEVER Cashier or Kitchen Staff!
    const handleWaiterCallCreated = (call: any) => {
      if (!['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole)) return;

      const tableNum = call.table?.number ? String(call.table.number).replace(/^T/i, '') : 'N/A';
      const reqType = call.requestType;
      
      let typeLabel = 'Customer called for assistance';
      if (reqType === 'ORDER_READY') typeLabel = 'Ready to place order';
      else if (reqType === 'BILL_REQUEST') typeLabel = 'Customer requested bill';
      else if (reqType === 'ASSISTANCE') typeLabel = 'Assistance requested';

      const itemsDetail = Array.isArray(call.selectedItems) && call.selectedItems.length > 0
        ? ` (${call.selectedItems.length} items chosen)`
        : '';

      addNotification({
        type: 'WAITER_CALL',
        title: `Table ${tableNum} Call`,
        message: `${typeLabel}${itemsDetail}`,
        tableNumber: tableNum,
        callId: call.id,
        link: '/admin/waiter-calls',
        targetRoles: ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'],
        priority: 'high',
      });

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

    // 4. Kitchen Order Ready for Waiter Pickup
    // STRICT RBAC: Waiters, Managers, Admins. NEVER Cashier or Kitchen Staff!
    const handleOrderReady = (data: any) => {
      if (!['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole)) return;

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
        targetRoles: ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'],
        priority: 'high',
      });

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

    // 5. Order Ready Reminder
    const handleOrderReadyReminder = (data: any) => {
      if (!['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole)) return;

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
        targetRoles: ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'],
        priority: 'urgent',
      });
    };

    // 6. Order Ready Escalation
    const handleOrderReadyEscalation = (data: any) => {
      if (!['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole)) return;

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
        targetRoles: ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'],
        priority: 'urgent',
      });
    };

    // 7. Bill Request Created
    // STRICT RBAC: Cashiers, Managers, Owners, Waiters. NEVER Kitchen Staff!
    const handleBillRequestCreated = (data: any) => {
      if (!['Cashier', 'Manager', 'Admin', 'Owner', 'Super Admin', 'Waiter'].includes(userRole)) return;

      const billReq = data.billRequest || data;
      const tableNum = billReq.table?.number ? String(billReq.table.number).replace(/^T/i, '') : 'Counter';

      addNotification({
        type: 'BILL_REQUEST',
        title: `Bill Requested — Table ${tableNum}`,
        message: `Table ${tableNum} requested bill settlement`,
        tableNumber: tableNum,
        link: '/admin/bill-requests',
        targetRoles: ['Cashier', 'Manager', 'Admin', 'Owner', 'Super Admin', 'Waiter'],
        priority: 'high',
      });

      if (['Cashier', 'Manager', 'Owner', 'Admin', 'Super Admin'].includes(userRole)) {
        toast.custom(
          (t) => (
            <div
              onClick={() => {
                toast.dismiss(t.id);
                window.location.href = '/admin/bill-requests';
              }}
              className={`cursor-pointer max-w-md w-full bg-white shadow-xl rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-3.5 border-l-4 border-emerald-500 transition-all ${
                t.visible ? 'animate-enter' : 'animate-leave'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧾</span>
                <div>
                  <p className="text-sm font-bold text-gray-900">Bill Request — Table {tableNum}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Guest requested payment receipt</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Open Bill Requests →</p>
                </div>
              </div>
            </div>
          ),
          { duration: 8000, position: 'top-right' }
        );
      }
    };

    // Register all socket listeners
    socket.on('ingredientRequest:created', handleIngredientRequestCreated);
    socket.on('ingredientRequest:updated', handleIngredientRequestUpdated);
    socket.on('waiter-call:created', handleWaiterCallCreated);
    socket.on('order:ready', handleOrderReady);
    socket.on('order:ready:reminder', handleOrderReadyReminder);
    socket.on('order:ready:escalation', handleOrderReadyEscalation);
    socket.on('billRequest:created', handleBillRequestCreated);

    return () => {
      socket.off('ingredientRequest:created', handleIngredientRequestCreated);
      socket.off('ingredientRequest:updated', handleIngredientRequestUpdated);
      socket.off('waiter-call:created', handleWaiterCallCreated);
      socket.off('order:ready', handleOrderReady);
      socket.off('order:ready:reminder', handleOrderReadyReminder);
      socket.off('order:ready:escalation', handleOrderReadyEscalation);
      socket.off('billRequest:created', handleBillRequestCreated);
    };
  }, [socket, isConnected, user, addNotification]);
}
