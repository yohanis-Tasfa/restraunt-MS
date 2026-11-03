import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { soundManager } from '../utils/sound';

export type NotificationType =
  | 'WAITER_CALL'
  | 'ORDER_READY'
  | 'BILL_REQUEST'
  | 'TIP'
  | 'SYSTEM'
  | 'INGREDIENT_REQUEST';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  tableNumber?: string;
  orderNumber?: string;
  callId?: string;
  orderId?: string;
  targetRoles?: string[]; // Allowed roles that can see this notification (e.g. ['Manager', 'Owner'])
  link: string; // URL to navigate to when clicked (e.g. '/admin/waiter-calls' or '/admin/orders')
  createdAt: string; // ISO date string
  isRead: boolean;
  priority?: 'normal' | 'high' | 'urgent';
  status?: string; // 'READY' | 'SERVED' | 'COMPLETED' | 'CANCELLED' | 'ACKNOWLEDGED'
  resolvedAt?: string;
}

interface NotificationStore {
  notifications: AppNotification[];
  soundEnabled: boolean;
  voiceEnabled: boolean;
  unreadCount: number;

  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  toggleSound: () => void;
  toggleVoice: () => void;

  // Real-time lifecycle & auto-resolution handlers
  resolveOrderNotifications: (
    orderId: string,
    options?: {
      newStatus?: string;
      orderNumber?: string;
      tableNumber?: string;
      message?: string;
    }
  ) => void;
  markOrderAsRead: (orderId: string) => void;
  resolveWaiterCallNotifications: (
    callId: string,
    options?: {
      newStatus?: string;
      message?: string;
    }
  ) => void;
  resolveBillRequestNotifications: (
    billRequestId: string,
    options?: {
      newStatus?: string;
      orderId?: string;
    }
  ) => void;
  syncOrdersStatus: (
    orders: Array<{
      id: string;
      status: string;
      orderNumber?: string;
      table?: { number?: string };
    }>
  ) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      soundEnabled: true,
      voiceEnabled: true,
      unreadCount: 0,

      addNotification: (newNotif) => {
        const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const initialStatus =
          newNotif.status || (newNotif.type === 'ORDER_READY' ? 'READY' : undefined);

        const notificationItem: AppNotification = {
          ...newNotif,
          id,
          createdAt: new Date().toISOString(),
          isRead: false,
          status: initialStatus,
        };

        // Trigger sound & voice alert
        const { soundEnabled, voiceEnabled } = get();
        soundManager.setSoundEnabled(soundEnabled);
        soundManager.setVoiceEnabled(voiceEnabled);

        if (newNotif.type === 'ORDER_READY') {
          soundManager.alertOrderReady(newNotif.tableNumber, newNotif.orderNumber);
        } else if (newNotif.type === 'WAITER_CALL') {
          soundManager.alertWaiterCall(newNotif.tableNumber, newNotif.message);
        } else if (newNotif.priority === 'urgent') {
          soundManager.playUrgentAlert();
        } else {
          soundManager.playWaiterCall();
        }

        set((state) => {
          // If this order is already marked as SERVED or COMPLETED, do not re-add an unread ready alert
          if (newNotif.type === 'ORDER_READY' && newNotif.orderId) {
            const alreadyServed = state.notifications.some(
              (n) =>
                n.orderId === newNotif.orderId &&
                (n.status === 'SERVED' || n.status === 'COMPLETED')
            );
            if (alreadyServed) {
              return state;
            }
          }

          // Avoid duplicate notifications if same callId/orderId received within last 5 seconds
          const exists = state.notifications.some(
            (n) =>
              (newNotif.callId &&
                n.callId === newNotif.callId &&
                Date.now() - new Date(n.createdAt).getTime() < 5000) ||
              (newNotif.orderId &&
                n.orderId === newNotif.orderId &&
                n.type === newNotif.type &&
                Date.now() - new Date(n.createdAt).getTime() < 5000)
          );

          if (exists) {
            return state;
          }

          const updatedList = [notificationItem, ...state.notifications].slice(0, 50); // Cap at 50 items
          const unread = updatedList.filter((n) => !n.isRead).length;

          return {
            notifications: updatedList,
            unreadCount: unread,
          };
        });
      },

      markAsRead: (id: string) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      removeNotification: (id: string) => {
        set((state) => {
          const updated = state.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },

      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0,
        });
      },

      toggleSound: () => {
        const next = !get().soundEnabled;
        soundManager.setSoundEnabled(next);
        set({ soundEnabled: next });
      },

      toggleVoice: () => {
        const next = !get().voiceEnabled;
        soundManager.setVoiceEnabled(next);
        set({ voiceEnabled: next });
      },

      // Mark order-related notifications as SERVED / COMPLETED / CANCELLED and decrease badge count
      resolveOrderNotifications: (orderId, options) => {
        set((state) => {
          let hasChanges = false;
          const targetStatus = (options?.newStatus || 'SERVED').toUpperCase();

          const updated = state.notifications.map((n) => {
            const matchOrderId = Boolean(n.orderId && n.orderId === orderId);
            const matchOrderNumber = Boolean(
              options?.orderNumber && n.orderNumber && n.orderNumber === options.orderNumber
            );

            if ((matchOrderId || matchOrderNumber) && n.type === 'ORDER_READY') {
              hasChanges = true;
              const tbl = options?.tableNumber || n.tableNumber || 'N/A';
              const ordNum = options?.orderNumber || n.orderNumber || '';

              let newTitle = n.title;
              let newMsg = options?.message || n.message;

              if (targetStatus === 'SERVED') {
                newTitle = `Order Served — Table ${tbl}`;
                newMsg = `Order #${ordNum} was served to customer`;
              } else if (targetStatus === 'COMPLETED') {
                newTitle = `Order Completed — Table ${tbl}`;
                newMsg = `Order #${ordNum} completed`;
              } else if (targetStatus === 'CANCELLED') {
                newTitle = `Order Cancelled — Table ${tbl}`;
                newMsg = `Order #${ordNum} was cancelled`;
              }

              return {
                ...n,
                isRead: true, // Automatically clears the unread badge count!
                status: targetStatus,
                priority: 'normal' as const,
                title: newTitle,
                message: newMsg,
                resolvedAt: new Date().toISOString(),
              };
            }
            return n;
          });

          if (!hasChanges) return state;

          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },

      // Mark notifications for an order as read without changing status
      markOrderAsRead: (orderId) => {
        set((state) => {
          let hasChanges = false;
          const updated = state.notifications.map((n) => {
            if (n.orderId === orderId && !n.isRead) {
              hasChanges = true;
              return { ...n, isRead: true };
            }
            return n;
          });

          if (!hasChanges) return state;

          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },

      // Resolve waiter calls (e.g. ACKNOWLEDGED or COMPLETED)
      resolveWaiterCallNotifications: (callId, options) => {
        set((state) => {
          let hasChanges = false;
          const targetStatus = (options?.newStatus || 'COMPLETED').toUpperCase();

          const updated = state.notifications.map((n) => {
            if (n.callId === callId && n.type === 'WAITER_CALL') {
              hasChanges = true;
              const tbl = n.tableNumber || 'N/A';
              return {
                ...n,
                isRead: true, // Clears badge
                status: targetStatus,
                priority: 'normal' as const,
                title: `Table ${tbl} Call (${
                  targetStatus === 'ACKNOWLEDGED' ? 'Acknowledged' : 'Completed'
                })`,
                message: options?.message || `Table ${tbl} call was resolved`,
                resolvedAt: new Date().toISOString(),
              };
            }
            return n;
          });

          if (!hasChanges) return state;

          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },

      // Resolve bill requests
      resolveBillRequestNotifications: (billRequestId, options) => {
        set((state) => {
          let hasChanges = false;
          const targetStatus = (options?.newStatus || 'COMPLETED').toUpperCase();

          const updated = state.notifications.map((n) => {
            const matchCall = Boolean(n.callId && n.callId === billRequestId);
            const matchOrder = Boolean(options?.orderId && n.orderId && n.orderId === options.orderId);

            if ((matchCall || matchOrder) && n.type === 'BILL_REQUEST') {
              hasChanges = true;
              return {
                ...n,
                isRead: true,
                status: targetStatus,
                priority: 'normal' as const,
                resolvedAt: new Date().toISOString(),
              };
            }
            return n;
          });

          if (!hasChanges) return state;

          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },

      // Reconcile and auto-resolve any orders that are already SERVED / COMPLETED
      syncOrdersStatus: (orders) => {
        if (!orders || orders.length === 0) return;
        set((state) => {
          let hasChanges = false;
          const orderMap = new Map(orders.map((o) => [o.id, o]));

          const updated = state.notifications.map((n) => {
            if (n.orderId && n.type === 'ORDER_READY' && (!n.isRead || n.status === 'READY')) {
              const matchingOrder = orderMap.get(n.orderId);
              if (
                matchingOrder &&
                ['SERVED', 'COMPLETED', 'CANCELLED'].includes(
                  (matchingOrder.status || '').toUpperCase()
                )
              ) {
                hasChanges = true;
                const status = (matchingOrder.status || '').toUpperCase();
                const tbl =
                  n.tableNumber ||
                  (matchingOrder.table?.number
                    ? String(matchingOrder.table.number).replace(/^T/i, '')
                    : 'N/A');
                const ordNum =
                  n.orderNumber ||
                  (matchingOrder.orderNumber ? String(matchingOrder.orderNumber).slice(-6) : '');

                return {
                  ...n,
                  isRead: true,
                  status,
                  priority: 'normal' as const,
                  title:
                    status === 'SERVED'
                      ? `Order Served — Table ${tbl}`
                      : status === 'COMPLETED'
                      ? `Order Completed — Table ${tbl}`
                      : `Order Cancelled — Table ${tbl}`,
                  message: `Order #${ordNum} was ${status.toLowerCase()}`,
                  resolvedAt: new Date().toISOString(),
                };
              }
            }
            return n;
          });

          if (!hasChanges) return state;

          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.isRead).length,
          };
        });
      },
    }),
    {
      name: 'rms-notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
        soundEnabled: state.soundEnabled,
        voiceEnabled: state.voiceEnabled,
        unreadCount: state.notifications.filter((n) => !n.isRead).length,
      }),
    }
  )
);
