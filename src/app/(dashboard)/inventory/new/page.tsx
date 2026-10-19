'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ScanLine, Sparkles, Image as ImageIcon, X, Camera, Upload, Loader2, Package } from 'lucide-react';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/ui/barcode-scanner-lazy';
import { BarcodeGenerator } from '@/components/ui/barcode-generator';
import { generateBarcode } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Client-side image compression utility
async function compressImage(file: File, maxWidth = 800, quality = 0.6): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxWidth) {
        width = (width * maxWidth) / height;
        height = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function NewItemPage() {
  const router = useRouter();
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'barcode' | 'sku'>('barcode');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    category: '',
    unitPrice: '',
    costPrice: '',
    barcode: '',
    minStock: '0',
    initialStock: '0',
    locationId: '',
    unitOfMeasure: 'PIECE',
    supplierId: '',
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : (data.data?.items || []);
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const [error, setError] = useState<string | null>(null);

  const createItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error?.message || result.error?.details ? JSON.stringify(result.error.details) : 'Failed to create item');
      }
      return result;
    },
    onSuccess: async (result) => {
      // Upload image if exists
      if (imageFile && result.data?.id) {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          const imgRes = await fetch(`/api/items/${result.data.id}/image`, {
            method: 'POST',
            body: formData,
          });
          const imgData = await imgRes.json();
          if (!imgRes.ok || !imgData.success) {
            console.error('Image upload warning:', imgData.error);
          }
        } catch (imgErr) {
          console.error('Failed to upload image:', imgErr);
        }
      }
      router.push('/inventory');
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleScan = useCallback((result: string) => {
    if (scanTarget === 'barcode') {
      setFormData(prev => ({ ...prev, barcode: result }));
    } else {
      setFormData(prev => ({ ...prev, sku: result }));
    }
  }, [scanTarget]);

  const openScanner = (target: 'barcode' | 'sku') => {
    setScanTarget(target);
    setShowScanner(true);
  };

  const generateAutoBarcode = () => {
    setFormData(prev => ({ ...prev, barcode: generateBarcode() }));
  };

  const generateAutoSku = () => {
    const prefix = formData.category?.substring(0, 3).toUpperCase() || 'ITM';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `${prefix}-${random}` }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        // Compress image before storing
        const compressedFile = await compressImage(file, 800, 0.6);
        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        // Fallback to original file if compression fails
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  // Attach camera stream to video element when it's ready
  useEffect(() => {
    if (showCamera && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(console.error);
    }
  }, [showCamera, cameraStream]);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Start camera for photo capture
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      setShowCamera(true);
    } catch (err) {
      console.error('Camera access error:', err);
      toast.error('Could not access camera. Please check permissions or use the Upload button.');
    }
  };

  // Capture photo from video stream
  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    setIsCompressing(true);
    canvas.toBlob(
      async (blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.webp`, { type: 'image/webp' });
          try {
            const compressedFile = await compressImage(file, 800, 0.6);
            setImageFile(compressedFile);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(compressedFile);
          } catch {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
          }
        }
        setIsCompressing(false);
        stopCamera();
      },
      'image/webp',
      0.8
    );
  };

  // Stop camera and clean up
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createItem.mutate({
      sku: formData.sku,
      name: formData.name,
      brand: formData.brand || undefined,
      category: formData.category || undefined,
      unitPrice: parseFloat(formData.unitPrice),
      costPrice: parseFloat(formData.costPrice),
      barcode: formData.barcode || undefined,
      minStock: parseFloat(formData.minStock) || 0,
      initialStock: parseFloat(formData.initialStock) || 0,
      locationId: formData.locationId || undefined,
      unitOfMeasure: formData.unitOfMeasure,
      supplierId: formData.supplierId || undefined,
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/inventory">
          <Button variant="ghost" size="icon" className="touch-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add New Item</h1>
          <p className="text-sm text-muted-foreground">Create inventory item</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Image Upload */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Product Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                {isCompressing ? (
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
                ) : imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => { setImagePreview(null); setImageFile(null); }}
                      className="absolute top-1 right-1 p-1 bg-destructive rounded-full"
                    >
                      <X className="h-3 w-3 text-white" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageChange}
                  className="hidden"
                  id="camera-capture"
                />
                {/* Camera and Upload buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="default"
                    className="flex-1 h-11 gradient-primary"
                    onClick={startCamera}
                    disabled={isCompressing}
                  >
                    <Camera className="h-4 w-4 mr-1.5" />
                    Camera
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-11"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    Upload
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Auto-optimized • Max 800px</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SKU & Barcode */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Identification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm">SKU *</Label>
              {/* Stack vertically on very small screens */}
              <div className="flex flex-col xs:flex-row gap-2">
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="bg-secondary border-border h-11 flex-1 min-w-0 text-sm"
                  required
                />
                <div className="flex gap-2 flex-shrink-0">
                  <Button type="button" variant="outline" size="icon" onClick={() => openScanner('sku')} className="h-11 w-11 touch-target-min">
                    <ScanLine className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={generateAutoSku} className="h-11 w-11 touch-target-min">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode" className="text-sm">Barcode</Label>
              {/* Stack vertically on very small screens */}
              <div className="flex flex-col xs:flex-row gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or auto-generate"
                  className="bg-secondary border-border h-11 flex-1 min-w-0 text-sm"
                />
                <div className="flex gap-2 flex-shrink-0">
                  <Button type="button" variant="outline" size="icon" onClick={() => openScanner('barcode')} className="h-11 w-11 touch-target-min border-primary text-primary">
                    <ScanLine className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" onClick={generateAutoBarcode} className="h-11 w-11 touch-target-min">
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barcode Generation & Preview */}
        {(formData.barcode || formData.sku) && (
          <BarcodeGenerator
            value={formData.barcode || formData.sku}
            name={formData.name || 'New Item'}
            price={parseFloat(formData.unitPrice) || 0}
            sku={formData.sku}
          />
        )}

        {/* Basic Info */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-secondary border-border h-11"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="brand">Brand</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="bg-secondary border-border h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-secondary border-border h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <Select
                value={formData.supplierId}
                onValueChange={(v) => setFormData({ ...formData, supplierId: v })}
              >
                <SelectTrigger className="bg-secondary">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {vendors?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price fields - stack on very small screens */}
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice" className="text-sm">Cost Price *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="bg-secondary border-border h-11 w-full text-base"
                  required
                  inputMode="decimal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice" className="text-sm">Sell Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="bg-secondary border-border h-11 w-full text-base"
                  required
                  inputMode="decimal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock Alert</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="bg-secondary border-border"
                  placeholder="Alert when below"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unit</Label>
                <Select
                  value={formData.unitOfMeasure}
                  onValueChange={(v) => setFormData({ ...formData, unitOfMeasure: v })}
                >
                  <SelectTrigger className="bg-secondary">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIECE">Piece</SelectItem>
                    <SelectItem value="KG">Kilogram</SelectItem>
                    <SelectItem value="METER">Meter</SelectItem>
                    <SelectItem value="LITER">Liter</SelectItem>
                    <SelectItem value="BOX">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Initial Stock */}
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 space-y-3">
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <Package className="h-4 w-4" /> Initial Stock (Optional)
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="initialStock">Quantity</Label>
                  <Input
                    id="initialStock"
                    type="number"
                    value={formData.initialStock}
                    onChange={(e) => setFormData({ ...formData, initialStock: e.target.value })}
                    className="bg-secondary border-border"
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="locationId">Location</Label>
                  <Select
                    value={formData.locationId}
                    onValueChange={(v) => setFormData({ ...formData, locationId: v })}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc: any) => (
                        <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Add initial stock quantity to a location when creating the item
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="mobile-card border-destructive bg-destructive/10">
            <CardContent className="p-3">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href="/inventory" className="flex-1">
            <Button type="button" variant="outline" className="w-full touch-btn">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 gradient-primary glow-sm touch-btn"
            disabled={createItem.isPending}
          >
            {createItem.isPending ? 'Creating...' : 'Create Item'}
          </Button>
        </div>
      </form>

      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleScan}
      />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          <div className="flex items-center justify-between p-4 bg-black/80">
            <h2 className="text-white font-medium">Take Photo</h2>
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white hover:bg-white/20">
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="p-6 bg-black/80 flex justify-center">
            <button
              type="button"
              onClick={capturePhoto}
              disabled={isCompressing}
              className="w-20 h-20 rounded-full bg-white border-4 border-primary flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-primary" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
