import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Trash2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChefHat,
  PhoneCall,
  Clock,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { useNotificationStore, type AppNotification } from '../../store/notificationStore';
import { soundManager } from '../../utils/sound';

export default function NotificationBellDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'calls' | 'orders'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    soundEnabled,
    voiceEnabled,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleSound,
    toggleVoice,
  } = useNotificationStore();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filter notifications based on tab
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'calls') return notif.type === 'WAITER_CALL';
    if (activeTab === 'orders') return notif.type === 'ORDER_READY';
    return true;
  });

  // Handle clicking an item: mark as read (reduces badge count!) and navigate
  const handleItemClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'WAITER_CALL') {
      navigate('/admin/waiter-calls');
    } else if (notification.type === 'ORDER_READY') {
      navigate('/admin/orders');
    }
  };

  // Helper for human-readable relative time
  const formatTimeAgo = (dateStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      const diffSec = Math.floor((now - past) / 1000);

      if (diffSec < 45) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 ${
          isOpen
            ? 'bg-blue-50 text-blue-600 ring-2 ring-blue-500/20'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'text-gray-800' : 'text-gray-600'}`} />

        {/* Dynamic Badge Counter */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-base">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                    {unreadCount} unread
                  </span>
                )}
              </div>

              {/* Sound & Voice Controls */}
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleSound}
                  title={soundEnabled ? 'Chime sound: ON (Click to mute)' : 'Chime sound: MUTED (Click to unmute)'}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    soundEnabled ? 'text-gray-600 hover:bg-gray-100' : 'text-red-500 bg-red-50 hover:bg-red-100'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleVoice}
                  title={voiceEnabled ? 'Voice alert: ON (Click to mute)' : 'Voice alert: MUTED (Click to unmute)'}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    voiceEnabled ? 'text-gray-600 hover:bg-gray-100' : 'text-red-500 bg-red-50 hover:bg-red-100'
                  }`}
                >
                  {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded-md font-medium transition-colors ml-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Read all</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex gap-1.5 mt-3 bg-gray-100/80 p-1 rounded-xl text-xs font-medium text-gray-600">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'hover:text-gray-900'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveTab('calls')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  activeTab === 'calls' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'hover:text-gray-900'
                }`}
              >
                Calls ({notifications.filter((n) => n.type === 'WAITER_CALL').length})
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-1 rounded-lg transition-all ${
                  activeTab === 'orders' ? 'bg-white text-green-700 shadow-sm font-semibold' : 'hover:text-gray-900'
                }`}
              >
                Ready ({notifications.filter((n) => n.type === 'ORDER_READY').length})
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Bell className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-800">No notifications yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTab === 'all'
                    ? "You're all caught up with your orders and calls!"
                    : `No ${activeTab === 'calls' ? 'waiter calls' : 'ready orders'} in queue.`}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isWaiterCall = item.type === 'WAITER_CALL';
                const isOrderReady = item.type === 'ORDER_READY';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`group relative p-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors flex gap-3 items-start ${
                      !item.isRead ? 'bg-blue-50/40' : 'bg-white'
                    }`}
                  >
                    {/* Unread Accent Indicator */}
                    {!item.isRead && (
                      <span className="absolute left-1.5 top-5 w-1.5 h-1.5 rounded-full bg-blue-600" />
                    )}

                    {/* Icon Badge */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isWaiterCall
                          ? 'bg-amber-100 text-amber-600'
                          : isOrderReady
                          ? 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {isWaiterCall ? (
                        <PhoneCall className="w-4 h-4" />
                      ) : isOrderReady ? (
                        <ChefHat className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-bold text-gray-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-gray-400 whitespace-nowrap flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1">
                        <span className="text-[11px] font-medium text-blue-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>
                            {isWaiterCall
                              ? 'Go to Waiter Calls'
                              : isOrderReady
                              ? 'View Orders'
                              : 'Open'}
                          </span>
                          <ArrowRight className="w-3 h-3" />
                        </span>

                        {item.tableNumber && (
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            T{item.tableNumber.replace(/^T/i, '')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(item.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all absolute right-2 top-2"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
              <button
                onClick={clearAll}
                className="text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors px-1 py-0.5 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear history</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/waiter-calls');
                  }}
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Calls
                </button>
                <span className="text-gray-300">•</span>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/admin/orders');
                  }}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Orders →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

