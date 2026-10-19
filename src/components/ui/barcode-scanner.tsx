'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { X, Camera, FlashlightOff, Flashlight, SwitchCamera, RefreshCw, Settings } from 'lucide-react';
import { Button } from './button';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
}

type PermissionState = 'prompt' | 'granted' | 'denied' | 'requesting';

// Browser-specific permission instructions - only shown after user explicitly denies
const getPermissionInstructions = () => {
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('chrome')) {
    return {
      browser: 'Chrome',
      steps: [
        'Click the lock/info icon in the address bar',
        'Find "Camera" in the permissions list',
        'Change it to "Allow"',
        'Refresh the page'
      ]
    };
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    return {
      browser: 'Safari',
      steps: [
        'Go to Safari > Settings > Websites',
        'Click "Camera" in the left sidebar',
        'Find this website and select "Allow"',
        'Refresh the page'
      ]
    };
  } else if (ua.includes('firefox')) {
    return {
      browser: 'Firefox',
      steps: [
        'Click the lock icon in the address bar',
        'Click "Connection secure" or site info',
        'Find camera permissions and allow',
        'Refresh the page'
      ]
    };
  } else if (ua.includes('edg')) {
    return {
      browser: 'Edge',
      steps: [
        'Click the lock icon in the address bar',
        'Click "Permissions for this site"',
        'Set Camera to "Allow"',
        'Refresh the page'
      ]
    };
  }
  
  return {
    browser: 'your browser',
    steps: [
      'Open browser settings',
      'Find site permissions or privacy settings',
      'Allow camera access for this site',
      'Refresh the page'
    ]
  };
};

export function BarcodeScanner({ isOpen, onClose, onScan, onError }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState>('requesting');
  const [torch, setTorch] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [currentDevice, setCurrentDevice] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [permissionDeniedPermanently, setPermissionDeniedPermanently] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const stopScanner = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Directly request camera access - this triggers the browser's native permission prompt
  const startScanner = useCallback(async (deviceId?: string) => {
    if (!videoRef.current) return;

    try {
      setError(null);
      setIsRetrying(false);
      setPermissionState('requesting');
      
      const reader = new BrowserMultiFormatReader();
      readerRef.current = reader;

      // First, try to get camera access - this will trigger browser's permission prompt
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        }
      };

      // This call triggers the browser's native "Allow/Block" permission dialog
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setPermissionState('granted');
      setPermissionDeniedPermanently(false);

      // Now enumerate devices after we have permission
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameras = videoDevices.filter(d => d.kind === 'videoinput');
      setDevices(cameras);

      const selectedDevice = deviceId || cameras.find(c => c.label.toLowerCase().includes('back'))?.deviceId || cameras[0]?.deviceId;

      reader.decodeFromVideoDevice(
        selectedDevice || null,
        videoRef.current,
        (result, err) => {
          if (result) {
            const text = result.getText();
            onScan(text);
            stopScanner();
            onClose();
          }
          if (err && !(err instanceof NotFoundException)) {
            console.error('Scan error:', err);
          }
        }
      );
    } catch (err: any) {
      console.error('Camera error:', err);
      
      // Determine the type of error
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        // Check if this is a permanent denial (user clicked "Block" or previously blocked)
        // We can detect this by trying to check the permission state
        try {
          if (navigator.permissions && navigator.permissions.query) {
            const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
            if (result.state === 'denied') {
              setPermissionDeniedPermanently(true);
            }
          }
        } catch {
          // If we can't check, assume it might be permanent after first denial
          setPermissionDeniedPermanently(true);
        }
        setError('Camera permission was denied. Please allow camera access when prompted.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found on this device');
        setPermissionState('denied');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is in use by another application. Please close other apps using the camera.');
        setPermissionState('denied');
      } else if (err.name === 'OverconstrainedError') {
        // Try again with less strict constraints
        try {
          const simpleStream = await navigator.mediaDevices.getUserMedia({ video: true });
          streamRef.current = simpleStream;
          if (videoRef.current) {
            videoRef.current.srcObject = simpleStream;
            setPermissionState('granted');
          }
          return;
        } catch {
          setError('Camera does not meet requirements');
          setPermissionState('denied');
        }
      } else if (err.name === 'SecurityError') {
        setError('Camera access requires HTTPS. Please use a secure connection.');
        setPermissionState('denied');
      } else {
        setError(err.message || 'Failed to access camera');
        setPermissionState('denied');
      }
      
      onError?.(err);
    }
  }, [onScan, onClose, stopScanner, onError]);

  const retryCamera = useCallback(async () => {
    setIsRetrying(true);
    setPermissionDeniedPermanently(false);
    stopScanner();
    // Small delay to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    await startScanner();
    setIsRetrying(false);
  }, [stopScanner, startScanner]);

  useEffect(() => {
    if (isOpen) {
      // Immediately try to start scanner - this triggers browser's permission prompt
      startScanner();
    } else {
      stopScanner();
      setError(null);
      setPermissionState('requesting');
      setPermissionDeniedPermanently(false);
    }

    return () => stopScanner();
  }, [isOpen, startScanner, stopScanner]);

  const toggleTorch = async () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: !torch } as any] });
        setTorch(!torch);
      }
    }
  };

  const switchCamera = () => {
    const nextDevice = (currentDevice + 1) % devices.length;
    setCurrentDevice(nextDevice);
    stopScanner();
    startScanner(devices[nextDevice]?.deviceId);
  };

  if (!isOpen) return null;

  const instructions = getPermissionInstructions();

  return (
    <div className="scanner-overlay">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      
      {/* Scanner frame - only show when camera is working */}
      {permissionState === 'granted' && !error && (
        <div className="scanner-frame">
          <div className="scanner-line" />
          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
        </div>
      )}

      {/* Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center safe-top">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="h-6 w-6" />
        </Button>
        
        {permissionState === 'granted' && !error && (
          <div className="flex gap-2">
            {devices.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={switchCamera}
                className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
              >
                <SwitchCamera className="h-6 w-6" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTorch}
              className="h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              {torch ? <Flashlight className="h-6 w-6" /> : <FlashlightOff className="h-6 w-6" />}
            </Button>
          </div>
        )}
      </div>

      {/* Instructions - only show when camera is working */}
      {permissionState === 'granted' && !error && (
        <div className="absolute bottom-20 left-0 right-0 text-center text-white safe-bottom">
          <p className="text-lg font-medium">Point camera at barcode or QR code</p>
          <p className="text-sm text-white/70 mt-1">Scanning will happen automatically</p>
        </div>
      )}

      {/* Permission Denied - Show simple retry first, manual instructions only if permanently blocked */}
      {permissionState === 'denied' && !permissionDeniedPermanently && (
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-card/95 text-card-foreground border border-border p-5 rounded-2xl text-center max-w-md mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Camera Access Needed</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please click "Allow" when your browser asks for camera permission.
          </p>
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={retryCamera} className="flex-1" disabled={isRetrying}>
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Camera className="h-4 w-4 mr-2" />
              )}
              Request Permission
            </Button>
          </div>
        </div>
      )}

      {/* Permission Permanently Denied - Show manual instructions */}
      {permissionState === 'denied' && permissionDeniedPermanently && (
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-card/95 text-card-foreground border border-border p-5 rounded-2xl text-center max-w-md mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Camera Blocked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Camera access was blocked. Please enable it in your browser settings.
          </p>
          
          <div className="bg-secondary rounded-xl p-4 text-left mb-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Settings className="h-3 w-3" />
              How to enable in {instructions.browser}:
            </p>
            <ol className="text-sm text-foreground space-y-1">
              {instructions.steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary font-medium">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button onClick={retryCamera} className="flex-1" disabled={isRetrying}>
              {isRetrying ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Try Again
            </Button>
          </div>
        </div>
      )}

      {/* Other Errors (not permission related) */}
      {error && permissionState !== 'denied' && (
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 bg-red-500/90 text-white p-5 rounded-xl text-center">
          <Camera className="h-8 w-8 mx-auto mb-2" />
          <p className="font-medium">Camera Error</p>
          <p className="text-sm mt-1 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
            <Button onClick={retryCamera} variant="outline" className="bg-transparent border-white text-white hover:bg-white/20" disabled={isRetrying}>
              {isRetrying ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Loading/Requesting state - shows while browser permission dialog is open */}
      {permissionState === 'requesting' && !error && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Camera className="h-8 w-8 text-primary animate-pulse" />
          </div>
          <p className="text-lg font-medium mb-2">Allow Camera Access</p>
          <p className="text-sm text-white/70">Click "Allow" in the browser prompt above</p>
        </div>
      )}
    </div>
  );
}
