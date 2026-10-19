'use client';

import { MapPin } from 'lucide-react';

interface StockLocation {
  locationId: string;
  locationName: string;
  locationType?: string;
  availableQuantity: number;
}

interface StockByLocationProps {
  stocks: StockLocation[];
  compact?: boolean;
  showOutOfStock?: boolean;
}

export function StockByLocation({ stocks, compact = false, showOutOfStock = true }: StockByLocationProps) {
  const totalStock = stocks.reduce((sum, s) => sum + s.availableQuantity, 0);
  
  if (totalStock === 0 && showOutOfStock) {
    return (
      <div className={`badge badge-error ${compact ? 'text-xs' : ''}`}>
        Out of Stock
      </div>
    );
  }

  if (stocks.length === 0) {
    return null;
  }

  if (compact) {
    // Compact mode: show total with location count
    return (
      <div className="flex items-center gap-1">
        <span className={`badge ${totalStock > 0 ? 'badge-success' : 'badge-error'}`}>
          {totalStock}
        </span>
        {stocks.length > 1 && (
          <span className="text-xs text-muted-foreground">
            ({stocks.length} loc)
          </span>
        )}
      </div>
    );
  }

  // Full mode: show breakdown by location
  return (
    <div className="space-y-1">
      {stocks.map((stock) => (
        <div
          key={stock.locationId}
          className="flex items-center gap-1.5 text-xs"
        >
          <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          <span className="text-muted-foreground truncate max-w-[80px]">
            {stock.locationName}
          </span>
          <span className={`badge ${stock.availableQuantity > 0 ? 'badge-success' : 'badge-error'} text-xs`}>
            {stock.availableQuantity}
          </span>
        </div>
      ))}
    </div>
  );
}
