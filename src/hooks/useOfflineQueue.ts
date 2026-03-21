'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface QueuedMutation {
  id: string;
  mutationFn: string;
  args: Record<string, unknown>;
  clientId: string;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

const STORAGE_KEY = 'acadowl_offline_queue';

// Manages an offline queue for mutations (primarily attendance)
// Mutations must be idempotent and accept clientId for deduplication
export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') {
      return true;
    }

    return navigator.onLine;
  });
  const [queue, setQueue] = useState<QueuedMutation[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as QueuedMutation[]) : [];
    } catch {
      return [];
    }
  });
  const [isReplaying, setIsReplaying] = useState(false);
  const isReplayingRef = useRef(false);

  // Sync online/offline state on mount
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    } catch {
      // Silently fail
    }
  }, [queue]);

  // Add a mutation to the offline queue
  const enqueue = useCallback(
    (mutationFn: string, args: Record<string, unknown>) => {
      const clientId = crypto.randomUUID();
      const item: QueuedMutation = {
        id: crypto.randomUUID(),
        mutationFn,
        args: { ...args, clientId },
        clientId,
        timestamp: Date.now(),
        retryCount: 0,
      };
      setQueue((prev) => [...prev, item]);
      return clientId;
    },
    [],
  );

  // Remove a specific item from the queue
  const dequeue = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const markProcessed = useCallback((id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const markFailed = useCallback((id: string, error: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              retryCount: item.retryCount + 1,
              lastError: error,
            }
          : item,
      ),
    );
  }, []);

  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const setReplayingState = useCallback((value: boolean) => {
    isReplayingRef.current = value;
    setIsReplaying(value);
  }, []);

  return {
    isOnline,
    queue,
    queueLength: queue.length,
    enqueue,
    dequeue,
    markProcessed,
    markFailed,
    clearQueue,
    isReplaying,
    setReplayingState,
  };
}
