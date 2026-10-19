'use client';

import { useState, useCallback } from 'react';
import { useScanDetector } from './use-scan-detector';

export interface ScannedItem {
  id: string;
  sku: string;
  name: string;
  barcode: string;
  brand?: string;
  category?: string;
  unitPrice: number;
  costPrice: number;
  unitOfMeasure?: string;
  imageUrl?: string;
  stocksByLocation: {
    locationId: string;
    locationName: string;
    locationType: string;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
  }[];
  totalStock: number;
}

export interface UseScanOptions {
  onItemFound: (item: ScannedItem) => void;
  onItemNotFound?: (barcode: string) => void;
  onError?: (error: Error) => void;
  locationId?: string;       // For stock filtering
  enabled?: boolean;
}

export interface UseScanResult {
  // Camera scanner controls
  showScanner: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  
  // State
  isSearching: boolean;
  lastScannedBarcode: string | null;
  error: string | null;
  
  // Manual scan trigger (for camera scanner callback)
  handleScan: (barcode: string) => Promise<void>;
  
  // Physical scanner state
  isPhysicalScanning: boolean;
}

/**
 * Unified hook for barcode/QR code scanning.
 * Combines physical scanner detection and camera scanning with item lookup.
 */
export function useScan(options: UseScanOptions): UseScanResult {
  const {
    onItemFound,
    onItemNotFound,
    onError,
    enabled = true,
  } = options;

  const [showScanner, setShowScanner] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Look up item by barcode
  const lookupItem = useCallback(async (barcode: string): Promise<ScannedItem | null> => {
    try {
      const response = await fetch(`/api/items/lookup?barcode=${encodeURIComponent(barcode)}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        return null;
      }

      return {
        ...data.data.item,
        stocksByLocation: data.data.stocksByLocation,
        totalStock: data.data.totalStock,
      };
    } catch (err) {
      console.error('Item lookup error:', err);
      throw err;
    }
  }, []);

  // Handle scan from any source (physical or camera)
  const handleScan = useCallback(async (barcode: string) => {
    if (!barcode || barcode.trim().length === 0) return;

    const cleanBarcode = barcode.trim();
    setLastScannedBarcode(cleanBarcode);
    setError(null);
    setIsSearching(true);

    try {
      const item = await lookupItem(cleanBarcode);

      if (item) {
        onItemFound(item);
        setError(null);
      } else {
        setError(`Item not found: ${cleanBarcode}`);
        onItemNotFound?.(cleanBarcode);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to look up item';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsSearching(false);
    }
  }, [lookupItem, onItemFound, onItemNotFound, onError]);

  // Physical scanner detection
  const { isScanning: isPhysicalScanning } = useScanDetector({
    onScan: handleScan,
    enabled,
    minLength: 4,
    maxDelay: 50,
  });

  // Camera scanner controls
  const openScanner = useCallback(() => {
    setShowScanner(true);
    setError(null);
  }, []);

  const closeScanner = useCallback(() => {
    setShowScanner(false);
  }, []);

  // Handle camera scan result
  const handleCameraScan = useCallback(async (barcode: string) => {
    await handleScan(barcode);
    // Close scanner after successful scan
    setShowScanner(false);
  }, [handleScan]);

  return {
    showScanner,
    openScanner,
    closeScanner,
    isSearching,
    lastScannedBarcode,
    error,
    handleScan: handleCameraScan,
    isPhysicalScanning,
  };
}
