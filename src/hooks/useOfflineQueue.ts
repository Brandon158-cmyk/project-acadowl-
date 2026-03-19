'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface QueuedMutation {
  id: string;
  mutationFn: string;
  args: Record<string, unknown>;
  clientId: string;
  timestamp: number;
}

const STORAGE_KEY = 'acadowl_offline_queue';

// Manages an offline queue for mutations (primarily attendance)
// Mutations must be idempotent and accept clientId for deduplication
export function useOfflineQueue() {
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedMutation[]>([]);
  const isReplayingRef = useRef(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch {
      // Silently fail if localStorage is unavailable
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

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

  // Clear the entire queue
  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  return {
    isOnline,
    queue,
    queueLength: queue.length,
    enqueue,
    dequeue,
    clearQueue,
    isReplaying: isReplayingRef.current,
  };
}
