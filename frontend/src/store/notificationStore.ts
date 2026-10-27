import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { soundManager } from '../utils/sound';

export type NotificationType = 'WAITER_CALL' | 'ORDER_READY' | 'BILL_REQUEST' | 'TIP' | 'SYSTEM';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  tableNumber?: string;
  orderNumber?: string;
  callId?: string;
  orderId?: string;
  link: string; // URL to navigate to when clicked (e.g. '/admin/waiter-calls' or '/admin/orders')
  createdAt: string; // ISO date string
  isRead: boolean;
  priority?: 'normal' | 'high' | 'urgent';
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
        const notificationItem: AppNotification = {
          ...newNotif,
          id,
          createdAt: new Date().toISOString(),
          isRead: false,
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
          // Avoid duplicate notifications if same callId/orderId received within last 5 seconds
          const exists = state.notifications.some(
            (n) =>
              (newNotif.callId && n.callId === newNotif.callId && Date.now() - new Date(n.createdAt).getTime() < 5000) ||
              (newNotif.orderId && n.orderId === newNotif.orderId && n.type === newNotif.type && Date.now() - new Date(n.createdAt).getTime() < 5000)
          );

          if (exists) {
            return state;
          }

          const updatedList = [notificationItem, ...state.notifications].slice(0, 40); // Cap at 40 items
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

