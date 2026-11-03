import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChefHat,
  PhoneCall,
  Clock,
  ArrowRight,
  X,
  PackagePlus,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore, type AppNotification } from '../../store/notificationStore';

export default function NotificationBellDropdown() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'requests' | 'calls' | 'orders' | 'bills'>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    soundEnabled,
    voiceEnabled,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    toggleSound,
    toggleVoice,
  } = useNotificationStore();

  const userRole = user?.role?.name || '';
  const isManagerOrAdmin = ['Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);
  const isCashier = userRole === 'Cashier';
  const isWaiter = userRole === 'Waiter';

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

  // STRICT RBAC: Filter notifications so user sees ONLY notifications allowed for their role
  const canUserSeeNotification = (notif: AppNotification) => {
    if (['Super Admin', 'Owner'].includes(userRole)) return true;

    if (notif.targetRoles && notif.targetRoles.length > 0) {
      return notif.targetRoles.includes(userRole);
    }

    switch (notif.type) {
      case 'INGREDIENT_REQUEST':
        // STRICT: ONLY Managers and Admin/Owner! NEVER Waiter, NEVER Cashier!
        return isManagerOrAdmin;

      case 'WAITER_CALL':
        return ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);

      case 'ORDER_READY':
        return ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);

      case 'BILL_REQUEST':
        return ['Cashier', 'Manager', 'Admin', 'Owner', 'Super Admin', 'Waiter'].includes(userRole);

      case 'TIP':
        return ['Waiter', 'Manager', 'Admin', 'Owner', 'Super Admin'].includes(userRole);

      default:
        return false;
    }
  };

  // Only notifications visible to the logged-in role
  const visibleNotifications = notifications.filter(canUserSeeNotification);
  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length;

  // Tab counts
  const reqCount = visibleNotifications.filter((n) => n.type === 'INGREDIENT_REQUEST').length;
  const callsCount = visibleNotifications.filter((n) => n.type === 'WAITER_CALL').length;
  const ordersCount = visibleNotifications.filter((n) => n.type === 'ORDER_READY' || n.type === 'BILL_REQUEST').length;
  const billsCount = visibleNotifications.filter((n) => n.type === 'BILL_REQUEST').length;

  // Filter based on active tab
  const filteredNotifications = visibleNotifications.filter((notif) => {
    if (activeTab === 'requests') return notif.type === 'INGREDIENT_REQUEST';
    if (activeTab === 'calls') return notif.type === 'WAITER_CALL';
    if (activeTab === 'orders') return notif.type === 'ORDER_READY' || notif.type === 'BILL_REQUEST';
    if (activeTab === 'bills') return notif.type === 'BILL_REQUEST';
    return true;
  });

  // Handle clicking an item: mark as read and navigate
  const handleItemClick = (notification: AppNotification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setIsOpen(false);

    if (notification.link) {
      navigate(notification.link);
    } else if (notification.type === 'INGREDIENT_REQUEST') {
      navigate('/admin/ingredient-requests');
    } else if (notification.type === 'WAITER_CALL') {
      navigate('/admin/waiter-calls');
    } else if (notification.type === 'ORDER_READY') {
      navigate('/admin/orders');
    } else if (notification.type === 'BILL_REQUEST') {
      navigate('/admin/bill-requests');
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

        {/* Dynamic Badge Counter (counts ONLY role-allowed unread notifications!) */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
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

            {/* Role-Specific Quick Filter Tabs */}
            <div className="flex gap-1.5 mt-3 bg-gray-100/80 p-1 rounded-xl text-xs font-medium text-gray-600 overflow-x-auto">
              <button
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'all' ? 'bg-white text-gray-900 shadow-sm font-semibold' : 'hover:text-gray-900'
                }`}
              >
                All ({visibleNotifications.length})
              </button>

              {/* Kitchen Requisitions Tab: ONLY visible to Manager / Admin / Owner */}
              {isManagerOrAdmin && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === 'requests' ? 'bg-white text-amber-800 shadow-sm font-semibold' : 'hover:text-gray-900'
                  }`}
                >
                  Kitchen ({reqCount})
                </button>
              )}

              {/* Calls Tab (Waiters & Managers) */}
              {!isCashier && (
                <button
                  onClick={() => setActiveTab('calls')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === 'calls' ? 'bg-white text-amber-700 shadow-sm font-semibold' : 'hover:text-gray-900'
                  }`}
                >
                  Calls ({callsCount})
                </button>
              )}

              {/* Bills Tab (Cashiers) */}
              {isCashier && (
                <button
                  onClick={() => setActiveTab('bills')}
                  className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap ${
                    activeTab === 'bills' ? 'bg-white text-emerald-700 shadow-sm font-semibold' : 'hover:text-gray-900'
                  }`}
                >
                  Bills ({billsCount})
                </button>
              )}

              {/* Orders Tab */}
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 py-1 px-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === 'orders' ? 'bg-white text-green-700 shadow-sm font-semibold' : 'hover:text-gray-900'
                }`}
              >
                Orders ({ordersCount})
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
                <p className="text-sm font-medium text-gray-800">No notifications</p>
                <p className="text-xs text-gray-400 mt-1">
                  {activeTab === 'all'
                    ? "You're all caught up with your tasks!"
                    : activeTab === 'requests'
                    ? 'No pending kitchen ingredient requisitions.'
                    : activeTab === 'calls'
                    ? 'No waiter calls in queue.'
                    : 'No order alerts in queue.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isIngredientRequest = item.type === 'INGREDIENT_REQUEST';
                const isWaiterCall = item.type === 'WAITER_CALL';
                const isOrderReady = item.type === 'ORDER_READY';
                const isBillRequest = item.type === 'BILL_REQUEST';

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
                        isIngredientRequest
                          ? 'bg-amber-100 text-amber-700'
                          : isWaiterCall
                          ? item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-600'
                          : isBillRequest
                          ? item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-emerald-100 text-emerald-700'
                          : isOrderReady
                          ? item.status === 'SERVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-green-100 text-green-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      {isIngredientRequest ? (
                        <PackagePlus className="w-4 h-4 text-amber-700" />
                      ) : isWaiterCall ? (
                        item.status === 'COMPLETED' ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <PhoneCall className="w-4 h-4" />
                        )
                      ) : isBillRequest ? (
                        item.status === 'COMPLETED' ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-emerald-700" />
                        )
                      ) : isOrderReady ? (
                        item.status === 'SERVED' ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ChefHat className="w-4 h-4" />
                        )
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 truncate flex-wrap">
                          <span className="text-xs font-bold text-gray-900 truncate">
                            {item.title}
                          </span>
                          {item.status === 'SERVED' && (
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5 shadow-2xs">
                              <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" /> Served
                            </span>
                          )}
                          {item.status === 'COMPLETED' && (
                            <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-blue-600" /> Completed
                            </span>
                          )}
                          {item.status === 'CANCELLED' && (
                            <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                              Cancelled
                            </span>
                          )}
                          {item.status === 'READY' && !item.isRead && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded-full animate-pulse">
                              Ready
                            </span>
                          )}
                          {item.priority === 'urgent' && item.status !== 'SERVED' && (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-100 text-rose-700">
                              Urgent
                            </span>
                          )}
                        </div>
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
                            {isIngredientRequest
                              ? 'Review Requisition'
                              : isWaiterCall
                              ? item.status === 'COMPLETED'
                                ? 'View Call History'
                                : 'Go to Waiter Calls'
                              : isBillRequest
                              ? item.status === 'COMPLETED'
                                ? 'View Bill'
                                : 'Process Bill'
                              : isOrderReady
                              ? item.status === 'SERVED'
                                ? 'View Served Order'
                                : 'Serve Order'
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

          {/* Footer */}
          {visibleNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-xs">
              <span className="text-gray-500 font-medium">
                {visibleNotifications.length} total alerts
              </span>
              <button
                onClick={clearAll}
                className="text-gray-500 hover:text-red-600 transition-colors font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
