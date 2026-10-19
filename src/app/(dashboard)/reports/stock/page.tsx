'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDateTime } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, History, User, Package, MapPin, FileDown } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { generateStockMovementPDF, downloadPDF } from '@/lib/pdf-generator';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

export default function StockInOutReportPage() {
    const { data: session } = useSession();
    const [isGenerating, setIsGenerating] = useState(false);
    const [startDate, setStartDate] = useState(
        new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date(new Date().setHours(23, 59, 59, 999)).toISOString().split('T')[0]
    );

    const { data: movements, isLoading } = useQuery({
        queryKey: ['stock-in-out', startDate, endDate],
        queryFn: async () => {
            const res = await fetch(`/api/reports/stock-in-out?startDate=${startDate}&endDate=${endDate}`);
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();
            return data.data;
        },
        enabled: !!session,
    });

    const handleDownloadPDF = async () => {
        if (!movements || movements.length === 0) {
            toast.error('No data to download');
            return;
        }

        try {
            setIsGenerating(true);
            const doc = generateStockMovementPDF(movements, startDate, endDate);
            downloadPDF(doc, `Stock-Ledger-${startDate}-to-${endDate}.pdf`);
            toast.success('PDF downloaded successfully');
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    if (!session) return null;

    const role = session.user.role;
    if (role !== 'ADMIN' && role !== 'BASEMENT_MANAGER') {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">You do not have permission to view this report.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20 md:pb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground font-heading tracking-tight">Stock Ledger</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">Track exact stock movements (In and Out)</p>
                </div>
                <Button
                    onClick={handleDownloadPDF}
                    disabled={isGenerating || !movements || movements.length === 0}
                    className="w-full sm:w-auto gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <FileDown className={`h-4 w-4 ${isGenerating ? 'animate-bounce' : ''}`} />
                    {isGenerating ? 'Generating PDF...' : 'Download PDF'}
                </Button>
            </div>

            <Card className="mobile-card">
                <CardContent className="p-3 sm:p-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label>Start Date</Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-secondary"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label>End Date</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-secondary"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="mobile-card">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        Stock Movements ({movements?.length || 0})
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading ? (
                        [...Array(5)].map((_, i) => <div key={i} className="skeleton h-24 rounded-xl" />)
                    ) : movements?.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No stock movements found in this period.</p>
                    ) : (
                        movements?.map((mov: any) => {
                            const isIn = mov.qtyChange > 0;
                            return (
                                <div key={mov.id} className="p-3 bg-secondary/50 rounded-xl relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 w-1 h-full ${isIn ? 'bg-emerald-500' : 'bg-red-500'}`} />

                                    <div className="flex justify-between items-start mb-2 pl-2">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isIn ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                                    {mov.type.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-muted-foreground font-mono">{mov.reference}</span>
                                            </div>
                                            <p className="font-medium text-foreground text-base leading-tight">{mov.item}</p>
                                            <p className="text-sm text-muted-foreground mt-0.5 text-xs">SKU: {mov.sku}</p>
                                        </div>

                                        <div className="text-right">
                                            <span className={`text-xl font-bold flex items-center justify-end gap-1 ${isIn ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {isIn ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                                                {Math.abs(mov.qtyChange)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/50 text-sm md:grid-cols-4 pl-2">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> Location
                                            </span>
                                            <span className="font-medium text-foreground truncate">{mov.location}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                                                <User className="h-3 w-3" /> User
                                            </span>
                                            <span className="font-medium text-foreground truncate">{mov.user}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5 col-span-2 md:col-span-2 md:text-right">
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1 md:justify-end">
                                                <History className="h-3 w-3" /> Date & Time
                                            </span>
                                            <span className="font-medium text-foreground">{formatDateTime(mov.date)}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
