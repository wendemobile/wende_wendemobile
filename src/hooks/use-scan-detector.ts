'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface ScanDetectorOptions {
  onScan: (barcode: string) => void;
  minLength?: number;        // Minimum barcode length (default: 4)
  maxDelay?: number;         // Max ms between keystrokes (default: 50)
  endKeys?: string[];        // Keys that end scan (default: ['Enter'])
  enabled?: boolean;         // Enable/disable detection
}

export interface ScanDetectorResult {
  isScanning: boolean;       // Currently receiving scan input
  lastScan: string | null;   // Last scanned barcode
  reset: () => void;         // Reset scan state
}

/**
 * Hook to detect physical barcode scanner input.
 * Physical scanners send characters rapidly (10-30ms apart) and end with Enter.
 * This hook distinguishes scanner input from manual typing by timing.
 */
export function useScanDetector(options: ScanDetectorOptions): ScanDetectorResult {
  const {
    onScan,
    minLength = 4,
    maxDelay = 50,
    endKeys = ['Enter'],
    enabled = true,
  } = options;

  const [isScanning, setIsScanning] = useState(false);
  const [lastScan, setLastScan] = useState<string | null>(null);
  
  // Use refs to track state without causing re-renders
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    bufferRef.current = '';
    lastKeyTimeRef.current = 0;
    setIsScanning(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const now = Date.now();
    const timeSinceLastKey = now - lastKeyTimeRef.current;
    const key = event.key;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Check if this is an end key (typically Enter)
    if (endKeys.includes(key)) {
      const buffer = bufferRef.current;
      
      // If we have accumulated enough characters quickly, it's a scan
      if (buffer.length >= minLength) {
        // Prevent the Enter key from triggering form submissions or other actions
        event.preventDefault();
        event.stopPropagation();
        
        setLastScan(buffer);
        onScan(buffer);
      }
      
      // Reset the buffer
      reset();
      return;
    }

    // Only accept printable characters (single character keys)
    if (key.length !== 1) {
      // Non-printable key (Shift, Ctrl, etc.) - ignore but don't reset
      return;
    }

    // Check if this keystroke is fast enough to be from a scanner
    if (bufferRef.current.length === 0 || timeSinceLastKey <= maxDelay) {
      // Fast keystroke - accumulate it
      bufferRef.current += key;
      lastKeyTimeRef.current = now;
      
      // Mark as scanning if we have at least 2 characters
      if (bufferRef.current.length >= 2) {
        setIsScanning(true);
        
        // Prevent the character from appearing in focused inputs
        event.preventDefault();
        event.stopPropagation();
      }
      
      // Set a timeout to reset if no more keys come quickly
      timeoutRef.current = setTimeout(() => {
        // If we accumulated characters but didn't get Enter, reset
        reset();
      }, maxDelay * 2);
    } else {
      // Slow keystroke - this is manual typing, reset buffer
      reset();
    }
  }, [enabled, endKeys, maxDelay, minLength, onScan, reset]);

  useEffect(() => {
    if (!enabled) {
      reset();
      return;
    }

    // Use capture phase to intercept events before they reach input fields
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, handleKeyDown, reset]);

  return {
    isScanning,
    lastScan,
    reset,
  };
}
