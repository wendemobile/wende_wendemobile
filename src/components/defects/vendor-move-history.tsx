'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { Truck, ArrowRight, Clock, CheckCircle } from 'lucide-react';

interface VendorMove {
  id: string;
  vendorId: string;
  sentAt: string;
  receivedAt?: string | null;
  notes?: string | null;
  vendor: {
    id: string;
    name: string;
    phone?: string;
  };
}

interface VendorMoveHistoryProps {
  vendorMoves: VendorMove[];
  currentStatus: string;
}

export function VendorMoveHistory({ vendorMoves, currentStatus }: VendorMoveHistoryProps) {
  if (!vendorMoves || vendorMoves.length === 0) {
    return null;
  }

  // Find the active vendor move (no receivedAt)
  const activeMove = vendorMoves.find(move => !move.receivedAt);

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="px-4 pt-4 pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4 text-amber-500" />
          Vendor History
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        {vendorMoves.map((move, index) => {
          const isActive = !move.receivedAt;
          const isCompleted = !!move.receivedAt;

          return (
            <div 
              key={move.id} 
              className={`p-3 rounded-xl border ${
                isActive 
                  ? 'bg-amber-500/10 border-amber-500/30' 
                  : 'bg-secondary/50 border-border/50'
              }`}
            >
              {/* Vendor Name and Status */}
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{move.vendor.name}</span>
                {isActive ? (
                  <span className="flex items-center gap-1 text-xs text-amber-400">
                    <Clock className="h-3 w-3" />
                    Currently with vendor
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <CheckCircle className="h-3 w-3" />
                    Returned
                  </span>
                )}
              </div>

              {/* Dates */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sent: {formatDate(move.sentAt)}</span>
                {move.receivedAt && (
                  <>
                    <ArrowRight className="h-3 w-3" />
                    <span>Received: {formatDate(move.receivedAt)}</span>
                  </>
                )}
              </div>

              {/* Notes */}
              {move.notes && (
                <p className="mt-2 text-sm text-muted-foreground bg-background/50 p-2 rounded-lg">
                  {move.notes}
                </p>
              )}
            </div>
          );
        })}

        {/* Summary */}
        <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground">
          Total vendor visits: {vendorMoves.length}
          {activeMove && currentStatus === 'WITH_VENDOR' && (
            <span className="ml-2 text-amber-400">• Item currently at {activeMove.vendor.name}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
