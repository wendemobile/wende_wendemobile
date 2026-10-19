'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin, Package } from 'lucide-react';

interface StockLocation {
  locationId: string;
  locationName: string;
  locationType?: string;
  availableQuantity: number;
}

interface LocationSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    costPrice: number;
    imageUrl?: string;
  };
  locations: StockLocation[];
  onSelect: (locationId: string, locationName: string) => void;
}

export function LocationSelectDialog({
  isOpen,
  onClose,
  item,
  locations,
  onSelect,
}: LocationSelectDialogProps) {
  if (!isOpen) return null;

  // Sort locations by available quantity (descending)
  const sortedLocations = [...locations].sort(
    (a, b) => b.availableQuantity - a.availableQuantity
  );

  const handleSelect = (location: StockLocation) => {
    if (location.availableQuantity > 0) {
      onSelect(location.locationId, location.locationName);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-sm mobile-card">
        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2">
          <CardTitle className="text-responsive-lg">Select Location</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 pt-0 space-y-3">
          {/* Item Info */}
          <div className="flex items-center gap-3 p-2 bg-secondary rounded-lg">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <Package className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm truncate">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                {item.sku}
              </p>
            </div>
          </div>

          {/* Location Options */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Choose location to deduct stock from:
            </p>
            {sortedLocations.map((location) => (
              <button
                key={location.locationId}
                onClick={() => handleSelect(location)}
                disabled={location.availableQuantity <= 0}
                className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  location.availableQuantity > 0
                    ? 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
                    : 'border-border/50 bg-muted/50 cursor-not-allowed opacity-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{location.locationName}</span>
                </div>
                <span
                  className={`badge ${
                    location.availableQuantity > 0 ? 'badge-success' : 'badge-error'
                  }`}
                >
                  {location.availableQuantity} available
                </span>
              </button>
            ))}
          </div>

          {/* Cancel Button */}
          <Button
            variant="outline"
            className="w-full h-10"
            onClick={onClose}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
