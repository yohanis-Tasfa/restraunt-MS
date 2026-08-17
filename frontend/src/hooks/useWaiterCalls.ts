import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waiterCallsApi, type WaiterCall, type WaiterCallsQueryParams } from '../api/waiter-calls';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useWebSocket } from '../contexts/WebSocketContext';

// Hook for real-time waiter calls with auto-refresh
export function useWaiterCalls(params?: WaiterCallsQueryParams, enableSound = true) {
  const queryClient = useQueryClient();
  const previousCallsRef = useRef<WaiterCall[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { socket } = useWebSocket();

  // Initialize notification sound
  useEffect(() => {
    if (enableSound && !audioRef.current) {
      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // Frequency in Hz
      gainNode.gain.value = 0.3; // Volume
      
      // Store for later use
      audioRef.current = {
        play: () => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = 800;
          gain.gain.value = 0.3;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          osc.stop(audioContext.currentTime + 0.3);
        }
      } as any;
    }
  }, [enableSound]);

  // Query for waiter calls with WebSocket updates
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['waiter-calls', params],
    queryFn: () => waiterCallsApi.getCalls(params),
    // WebSocket-only: no polling
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    staleTime: Infinity, // WebSocket keeps data fresh
  });

  // WebSocket event listeners for this hook too
  useEffect(() => {
    if (!socket) return;

    const handleCallEvent = () => {
      // Refetch data when any call event happens
      queryClient.invalidateQueries({ queryKey: ['waiter-calls', params] });
    };

    socket.on('waiter-call:created', handleCallEvent);
    socket.on('waiter-call:acknowledged', handleCallEvent);
    socket.on('waiter-call:completed', handleCallEvent);
    socket.on('waiter-call:cancelled', handleCallEvent);
    socket.on('waiter-call:updated', handleCallEvent);

    return () => {
      socket.off('waiter-call:created', handleCallEvent);
      socket.off('waiter-call:acknowledged', handleCallEvent);
      socket.off('waiter-call:completed', handleCallEvent);
      socket.off('waiter-call:cancelled', handleCallEvent);
      socket.off('waiter-call:updated', handleCallEvent);
    };
  }, [socket, queryClient, params]);

  // Detect new calls and play sound
  useEffect(() => {
    if (data?.calls && previousCallsRef.current.length > 0) {
      const newCalls = data.calls.filter(
        (call) => 
          call.status === 'PENDING' &&
          !previousCallsRef.current.some((prev) => prev.id === call.id)
      );

      if (newCalls.length > 0 && enableSound && audioRef.current) {
        // Play notification sound
        audioRef.current.play();
        
        // Show toast notification
        newCalls.forEach((call) => {
          const requestTypeLabels = {
            ASSISTANCE: '🔔 Assistance',
            ORDER_READY: '🛒 Ready to Order',
            BILL_REQUEST: '💳 Bill Request',
            OTHER: '❓ Other',
          };
          
          toast.success(
            `New Call: Table ${call.table.number} - ${requestTypeLabels[call.requestType]}`,
            {
              duration: 5000,
              position: 'top-right',
            }
          );
        });
      }
    }
    
    if (data?.calls) {
      previousCallsRef.current = data.calls;
    }
  }, [data?.calls, enableSound]);

  const calls = data?.calls || [];
  const total = data?.total || 0;

  return {
    calls,
    total,
    isLoading,
    error,
    refetch,
  };
}

// Hook for active calls only
export function useActiveCalls(enableSound = true) {
  const queryClient = useQueryClient();
  const previousCallsRef = useRef<WaiterCall[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { socket, isConnected } = useWebSocket();

  // Initialize notification sound
  useEffect(() => {
    if (enableSound && !audioRef.current) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioRef.current = {
        play: () => {
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.frequency.value = 800;
          gain.gain.value = 0.3;
          osc.start();
          gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          osc.stop(audioContext.currentTime + 0.3);
        }
      } as any;
    }
  }, [enableSound]);

  // Fetch initial data ONCE on mount
  const { data: calls, isLoading, error, refetch } = useQuery({
    queryKey: ['waiter-calls-active'],
    queryFn: () => waiterCallsApi.getActiveCalls(),
    // WebSocket-only: no polling at all
    refetchInterval: false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true, // Only refetch when window regains focus
    staleTime: Infinity, // Data never goes stale since WebSocket keeps it fresh
  });

  // WebSocket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallCreated = (call: WaiterCall) => {
      console.log('WebSocket: waiter-call:created', call);
      
      // Update query cache
      queryClient.setQueryData(['waiter-calls-active'], (oldData: WaiterCall[] | undefined) => {
        if (!oldData) return [call];
        // Add new call if not already present
        if (!oldData.some((c) => c.id === call.id)) {
          return [call, ...oldData];
        }
        return oldData;
      });

      // Play sound and show notification
      if (enableSound && audioRef.current) {
        audioRef.current.play();
        
        const requestTypeLabels = {
          ASSISTANCE: '🔔 Assistance',
          ORDER_READY: '🛒 Ready to Order',
          BILL_REQUEST: '💳 Bill Request',
          OTHER: '❓ Other',
        };
        
        toast.success(
          `New Call: Table ${call.table.number} - ${requestTypeLabels[call.requestType]}`,
          {
            duration: 5000,
            position: 'top-right',
          }
        );
      }
    };

    const handleCallAcknowledged = (call: WaiterCall) => {
      console.log('WebSocket: waiter-call:acknowledged', call);
      updateCallInCache(call);
    };

    const handleCallCompleted = (call: WaiterCall) => {
      console.log('WebSocket: waiter-call:completed', call);
      // Remove completed call from active calls
      queryClient.setQueryData(['waiter-calls-active'], (oldData: WaiterCall[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((c) => c.id !== call.id);
      });
    };

    const handleCallCancelled = (call: WaiterCall) => {
      console.log('WebSocket: waiter-call:cancelled', call);
      // Remove cancelled call from active calls
      queryClient.setQueryData(['waiter-calls-active'], (oldData: WaiterCall[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((c) => c.id !== call.id);
      });
    };

    const handleCallUpdated = (call: WaiterCall) => {
      console.log('WebSocket: waiter-call:updated', call);
      updateCallInCache(call);
    };

    // Helper to update call in cache
    const updateCallInCache = (updatedCall: WaiterCall) => {
      queryClient.setQueryData(['waiter-calls-active'], (oldData: WaiterCall[] | undefined) => {
        if (!oldData) return [updatedCall];
        return oldData.map((c) => (c.id === updatedCall.id ? updatedCall : c));
      });
    };

    // Subscribe to events
    socket.on('waiter-call:created', handleCallCreated);
    socket.on('waiter-call:acknowledged', handleCallAcknowledged);
    socket.on('waiter-call:completed', handleCallCompleted);
    socket.on('waiter-call:cancelled', handleCallCancelled);
    socket.on('waiter-call:updated', handleCallUpdated);

    // Cleanup listeners
    return () => {
      socket.off('waiter-call:created', handleCallCreated);
      socket.off('waiter-call:acknowledged', handleCallAcknowledged);
      socket.off('waiter-call:completed', handleCallCompleted);
      socket.off('waiter-call:cancelled', handleCallCancelled);
      socket.off('waiter-call:updated', handleCallUpdated);
    };
  }, [socket, queryClient, enableSound]);

  return {
    calls: calls || [],
    isLoading,
    error,
    refetch,
    isConnected, // Expose connection status
  };
}

// Mutations for call actions
export function useWaiterCallActions() {
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      waiterCallsApi.acknowledgeCall(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-calls'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-calls-active'] });
      toast.success('Call acknowledged');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to acknowledge call');
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      waiterCallsApi.completeCall(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-calls'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-calls-active'] });
      toast.success('Call completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete call');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      waiterCallsApi.cancelCall(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-calls'] });
      queryClient.invalidateQueries({ queryKey: ['waiter-calls-active'] });
      toast.success('Call cancelled');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel call');
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      waiterCallsApi.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['waiter-calls'] });
      toast.success('Notes updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update notes');
    },
  });

  return {
    acknowledge: acknowledgeMutation.mutate,
    complete: completeMutation.mutate,
    cancel: cancelMutation.mutate,
    updateNotes: updateNotesMutation.mutate,
    isLoading:
      acknowledgeMutation.isPending ||
      completeMutation.isPending ||
      cancelMutation.isPending ||
      updateNotesMutation.isPending,
  };
}
