'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ScanLine, Sparkles, Save, Image as ImageIcon, X, Camera, Upload, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { BarcodeScanner } from '@/components/ui/barcode-scanner-lazy';
import { BarcodeGenerator } from '@/components/ui/barcode-generator';
import { generateBarcode } from '@/lib/utils';

// Client-side image compression utility
async function compressImage(file: File, maxWidth = 800, quality = 0.6): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
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

export default function EditItemPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<'barcode' | 'sku'>('barcode');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
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
    unitOfMeasure: 'PIECE',
    supplierId: '',
  });

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/items/${params.id}`);
      const data = await res.json();
      return data.data;
    },
  });

  const { data: vendors } = useQuery({
    queryKey: ['vendors'],
    queryFn: async () => {
      const res = await fetch('/api/vendors');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : (data.data?.items || []);
    },
  });

  useEffect(() => {
    if (item) {
      setFormData({
        sku: item.sku || '',
        name: item.name || '',
        brand: item.brand || '',
        category: item.category || '',
        unitPrice: item.unitPrice?.toString() || '',
        costPrice: item.costPrice?.toString() || '',
        barcode: item.barcode || '',
        minStock: item.minStock?.toString() || '0',
        unitOfMeasure: item.unitOfMeasure || 'PIECE',
        supplierId: item.supplierId || item.vendorId || '',
      });
      if (item.image?.path) {
        setImagePreview(`/api/items/${params.id}/image`);
      }
    }
  }, [item, params.id]);

  const updateItem = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/items/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update item');
      return res.json();
    },
    onSuccess: async () => {
      if (imageFile) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await fetch(`/api/items/${params.id}/image`, {
          method: 'POST',
          body: formData,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['item', params.id] });
      router.push(`/inventory/${params.id}`);
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedFile = await compressImage(file, 800, 0.6);
        setImageFile(compressedFile);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(compressedFile);
      } catch {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } finally {
        setIsCompressing(false);
      }
    }
  };

  useEffect(() => {
    if (showCamera && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.error);
    }
  }, [showCamera]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      setShowCamera(true);
    } catch {
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);
    
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
      0.6
    );
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateItem.mutate({
      ...formData,
      unitPrice: parseFloat(formData.unitPrice),
      costPrice: parseFloat(formData.costPrice),
      minStock: parseFloat(formData.minStock),
      supplierId: formData.supplierId || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-12 w-48 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/inventory/${params.id}`}>
          <Button variant="ghost" size="icon" className="touch-btn">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-foreground">Edit Item</h1>
          <p className="text-sm text-muted-foreground">{item?.name}</p>
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
              <Label htmlFor="sku">SKU *</Label>
              <div className="flex gap-2">
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
                <Button type="button" variant="outline" size="icon" onClick={() => openScanner('sku')} className="touch-btn">
                  <ScanLine className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="bg-secondary border-border"
                />
                <Button type="button" variant="outline" size="icon" onClick={() => openScanner('barcode')} className="touch-btn border-primary text-primary">
                  <ScanLine className="h-4 w-4" />
                </Button>
                <Button type="button" variant="outline" size="icon" onClick={generateAutoBarcode} className="touch-btn">
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Barcode Generation & Preview */}
        {(formData.barcode || formData.sku) && (
          <BarcodeGenerator
            value={formData.barcode || formData.sku}
            name={formData.name || item?.name || 'Item'}
            price={parseFloat(formData.unitPrice) || item?.unitPrice || 0}
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
                className="bg-secondary border-border"
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
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier</Label>
              <select
                id="supplierId"
                className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">Select supplier</option>
                {vendors?.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pricing & Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price *</Label>
                <Input
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitPrice">Sell Price *</Label>
                <Input
                  id="unitPrice"
                  type="number"
                  step="0.01"
                  value={formData.unitPrice}
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="bg-secondary border-border"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unit</Label>
                <select
                  id="unitOfMeasure"
                  className="w-full h-11 rounded-xl border border-border bg-secondary px-3 text-sm"
                  value={formData.unitOfMeasure}
                  onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                >
                  <option value="PIECE">Piece</option>
                  <option value="KG">Kilogram</option>
                  <option value="METER">Meter</option>
                  <option value="LITER">Liter</option>
                  <option value="BOX">Box</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <Link href={`/inventory/${params.id}`} className="flex-1">
            <Button type="button" variant="outline" className="w-full touch-btn">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="flex-1 gradient-primary glow-sm touch-btn"
            disabled={updateItem.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateItem.isPending ? 'Saving...' : 'Save Changes'}
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
            <Button variant="ghost" size="icon" onClick={stopCamera} className="text-white">
              <X className="h-6 w-6" />
            </Button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-hidden">
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
              className="w-16 h-16 rounded-full bg-white border-4 border-primary flex items-center justify-center active:scale-95 transition-transform"
            >
              <div className="w-12 h-12 rounded-full bg-primary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
