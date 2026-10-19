'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

export const BarcodeScanner = dynamic(
    () => import('./barcode-scanner').then((mod) => mod.BarcodeScanner),
    {
        ssr: false,
        loading: () => (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
                <div className="text-white flex flex-col items-center gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading Camera...</p>
                </div>
            </div>
        )
    }
);
