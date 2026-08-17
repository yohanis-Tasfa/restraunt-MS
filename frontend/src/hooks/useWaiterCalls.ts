import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { waiterCallsApi, type WaiterCall, type WaiterCallsQueryParams } from '../api/waiter-calls';
import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// Hook for real-time waiter calls with auto-refresh
export function useWaiterCalls(params?: WaiterCallsQueryParams, enableSound = true) {
  const queryClient = useQueryClient();
  const previousCallsRef = useRef<WaiterCall[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Query for waiter calls with auto-refresh
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['waiter-calls', params],
    queryFn: () => waiterCallsApi.getCalls(params),
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

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

  const { data: calls, isLoading, error, refetch } = useQuery({
    queryKey: ['waiter-calls-active'],
    queryFn: () => waiterCallsApi.getActiveCalls(),
    refetchInterval: 10000, // Refresh every 10 seconds (reduced from 3s to prevent rate limiting)
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  });

  // Detect new calls
  useEffect(() => {
    if (calls && previousCallsRef.current.length > 0) {
      const newCalls = calls.filter(
        (call) => 
          call.status === 'PENDING' &&
          !previousCallsRef.current.some((prev) => prev.id === call.id)
      );

      if (newCalls.length > 0 && enableSound && audioRef.current) {
        audioRef.current.play();
        
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
    
    if (calls) {
      previousCallsRef.current = calls;
    }
  }, [calls, enableSound]);

  return {
    calls: calls || [],
    isLoading,
    error,
    refetch,
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
