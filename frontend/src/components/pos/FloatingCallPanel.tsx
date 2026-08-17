import { useState } from 'react';
import { Bell, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import { useActiveCalls, useWaiterCallActions } from '../../hooks/useWaiterCalls';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const requestTypeIcons = {
  ASSISTANCE: '🔔',
  ORDER_READY: '🛒',
  BILL_REQUEST: '💳',
  OTHER: '❓',
};

const requestTypeLabels = {
  ASSISTANCE: 'Assistance',
  ORDER_READY: 'Ready to Order',
  BILL_REQUEST: 'Bill Request',
  OTHER: 'Other',
};

export default function FloatingCallPanel() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const { calls, isLoading } = useActiveCalls(false); // No sound notifications in POS
  const { acknowledge, complete } = useWaiterCallActions();

  const pendingCalls = calls.filter((call) => call.status === 'PENDING');
  const acknowledgedCalls = calls.filter((call) => call.status === 'ACKNOWLEDGED');

  if (calls.length === 0) {
    return null; // Hide panel when no active calls
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="relative shadow-lg hover:shadow-xl transition-shadow"
          size="lg"
        >
          <Bell className="w-5 h-5 mr-2" />
          Active Calls
          {calls.length > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2">
              {calls.length}
            </Badge>
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h3 className="font-semibold">Active Calls</h3>
          <Badge className="bg-white text-green-700">
            {calls.length}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white hover:bg-green-800"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(true)}
            className="text-white hover:bg-green-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[500px]">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading calls...
            </div>
          ) : (
            <>
              {/* Pending Calls */}
              {pendingCalls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">
                    Pending ({pendingCalls.length})
                  </h4>
                  {pendingCalls.map((call) => (
                    <div
                      key={call.id}
                      className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 space-y-2 animate-pulse"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {requestTypeIcons[call.requestType]}
                            </span>
                            <span className="font-semibold text-gray-900">
                              Table {call.table.number}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {requestTypeLabels[call.requestType]}
                          </p>
                          {call.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              "{call.notes}"
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(call.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => acknowledge({ id: call.id })}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Acknowledge
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => complete({ id: call.id })}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Acknowledged Calls */}
              {acknowledgedCalls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase">
                    In Progress ({acknowledgedCalls.length})
                  </h4>
                  {acknowledgedCalls.map((call) => (
                    <div
                      key={call.id}
                      className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {requestTypeIcons[call.requestType]}
                            </span>
                            <span className="font-semibold text-gray-900">
                              Table {call.table.number}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1">
                            {requestTypeLabels[call.requestType]}
                          </p>
                          {call.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              "{call.notes}"
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3" />
                            Acknowledged{' '}
                            {call.acknowledgedAt &&
                              formatDistanceToNow(new Date(call.acknowledgedAt), {
                                addSuffix: true,
                              })}
                          </div>
                          {call.assignedWaiter && (
                            <p className="text-xs text-gray-600 mt-1">
                              Waiter: {call.assignedWaiter.firstName}{' '}
                              {call.assignedWaiter.lastName}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => complete({ id: call.id })}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        Mark Complete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
