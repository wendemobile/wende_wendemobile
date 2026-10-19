'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    ArrowLeft,
    Download,
    FileDown,
    TrendingUp,
    Users
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatCurrency } from '@/lib/utils';

interface CommissionItem {
    id: string;
    date: string;
    receiptNumber: string;
    salesman: string;
    itemName: string;
    qty: number;
    sellingPrice: number;
    costPrice: number;
    profit: number;
    commission: number;
    rate: number;
}

interface UserStat {
    userId: string;
    userName: string;
    userRole: string;
    totalCommission: number;
    totalProfit: number;
    count: number;
}

interface ReportData {
    commissionItems: CommissionItem[];
    summary: {
        totalCommission: number;
        totalProfitGenerated: number;
        count: number;
    };
    userStats: UserStat[];
}

export default function CommissionReportPage() {
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === 'ADMIN';

    // Default to first day of current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(firstDay.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
    const [selectedUserId, setSelectedUserId] = useState('');

    // Fetch users for filter (Admin only)
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            if (!isAdmin) return [];
            const res = await fetch('/api/users');
            const data = await res.json();
            return data.data || [];
        },
        enabled: isAdmin,
    });

    // Fetch report data
    const { data: report, isLoading } = useQuery<ReportData>({
        queryKey: ['commission-report', startDate, endDate, selectedUserId],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);
            if (selectedUserId) params.append('userId', selectedUserId);

            const res = await fetch(`/api/reports/commissions?${params.toString()}`);
            const data = await res.json();
            return data.data;
        },
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString() + ' ' + new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleDownloadPDF = async () => {
        if (!report) return;
        try {
            const pdfLib = await import('@/lib/pdf-generator');
            const doc = pdfLib.generateCommissionPDF(report, startDate, endDate);
            pdfLib.downloadPDF(doc, `commission_report_${startDate}_${endDate}.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
        }
    };

    // Admin-only access guard
    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Card className="bg-card border-border/50 max-w-md w-full">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                            <Users className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
                        <p className="text-sm text-muted-foreground">
                            Commission reports are only accessible to administrators. Please contact your admin if you need access.
                        </p>
                        <Link href="/dashboard">
                            <Button className="gradient-primary mt-2">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4 pb-20 md:pb-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link href="/reports">
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Commission Report</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">Track commissions and profit</p>
                    </div>
                </div>
                {report && (
                    <Button
                        size="sm"
                        onClick={handleDownloadPDF}
                        className="gradient-primary h-10 sm:h-11 px-3 sm:px-4 text-sm sm:text-base"
                    >
                        <FileDown className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
                        PDF
                    </Button>
                )}
            </div>

            {/* Filters */}
            <Card className="bg-card border-border/50">
                <CardContent className="p-3 sm:p-4">
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div className="space-y-1">
                                <Label className="text-sm sm:text-base">Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-10 sm:h-11 bg-secondary text-sm sm:text-base w-full min-w-0 px-2 sm:px-3"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-sm sm:text-base">End Date</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-10 sm:h-11 bg-secondary text-sm sm:text-base w-full min-w-0 px-2 sm:px-3"
                                />
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="space-y-1">
                                <Label className="text-sm sm:text-base">Salesman / Cashier</Label>
                                <select
                                    className="w-full h-10 sm:h-11 rounded-md border border-input bg-secondary px-3 py-2 text-sm sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                    value={selectedUserId}
                                    onChange={(e) => setSelectedUserId(e.target.value)}
                                >
                                    <option value="">All Users</option>
                                    {users?.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                                onClick={() => {
                                    const t = new Date().toISOString().split('T')[0];
                                    setStartDate(t);
                                    setEndDate(t);
                                }}
                            >
                                Today
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                                onClick={() => {
                                    const t = new Date();
                                    const w = new Date(t.getTime() - 7 * 24 * 60 * 60 * 1000);
                                    setStartDate(w.toISOString().split('T')[0]);
                                    setEndDate(t.toISOString().split('T')[0]);
                                }}
                            >
                                7 Days
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 h-10 sm:h-11 text-sm sm:text-base"
                                onClick={() => {
                                    setStartDate(firstDay.toISOString().split('T')[0]);
                                    setEndDate(today.toISOString().split('T')[0]);
                                    setSelectedUserId('');
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 sm:gap-4">
                <Card className="mobile-card">
                    <CardContent className="p-3 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-green-500/15 flex items-center justify-center text-green-500 font-bold text-base sm:text-xl shrink-0">
                                Br
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Commission</p>
                                <h3 className="text-lg sm:text-2xl font-bold truncate">
                                    {isLoading ? '...' : formatCurrency(report?.summary.totalCommission || 0)}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mobile-card">
                    <CardContent className="p-3 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-500 shrink-0">
                                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Profit</p>
                                <h3 className="text-lg sm:text-2xl font-bold truncate">
                                    {isLoading ? '...' : formatCurrency(report?.summary.totalProfitGenerated || 0)}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mobile-card">
                    <CardContent className="p-3 sm:p-5">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-purple-500/15 flex items-center justify-center text-purple-500 shrink-0">
                                <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">Transactions</p>
                                <h3 className="text-lg sm:text-2xl font-bold">
                                    {isLoading ? '...' : report?.summary.count || 0}
                                </h3>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Per-User Commission Summary */}
            {report?.userStats && report.userStats.length > 0 && (
                <Card className="bg-card border-border/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-500" />
                            Commission by User
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {report.userStats.map((user) => (
                            <div key={user.userId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium text-foreground text-sm sm:text-base truncate">{user.userName}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">
                                        {user.userRole} • {user.count} sale{user.count !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className="font-bold text-green-500 text-sm sm:text-base">{formatCurrency(user.totalCommission)}</p>
                                    <p className="text-xs sm:text-sm text-muted-foreground">Profit: {formatCurrency(user.totalProfit)}</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Detailed Commission Items */}
            <Card className="bg-card border-border/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-base sm:text-lg">Commission Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
                        </div>
                    ) : report?.commissionItems?.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No commission records found for this period.</div>
                    ) : (
                        <>
                            {/* Mobile Card Layout */}
                            <div className="space-y-2 md:hidden">
                                {report?.commissionItems?.map((item) => (
                                    <div key={item.id} className="p-3 bg-secondary/50 rounded-xl">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-foreground text-sm truncate">{item.itemName}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {item.salesman} • {item.receiptNumber}
                                                </p>
                                            </div>
                                            <span className="font-bold text-green-500 text-sm shrink-0 ml-2">
                                                {formatCurrency(item.commission)}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{formatDate(item.date)}</span>
                                            <span>Qty: {item.qty} • {formatCurrency(item.sellingPrice)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-base">
                                    <thead>
                                        <tr className="border-b border-border text-left">
                                            <th className="py-3 px-4 font-semibold text-muted-foreground">Date</th>
                                            <th className="py-3 px-4 font-semibold text-muted-foreground">Receipt</th>
                                            <th className="py-3 px-4 font-semibold text-muted-foreground">Salesman</th>
                                            <th className="py-3 px-4 font-semibold text-muted-foreground">Item Name</th>
                                            <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Qty</th>
                                            <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Selling Price</th>
                                            <th className="py-3 px-4 font-semibold text-muted-foreground text-right">Commission</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report?.commissionItems?.map((item) => (
                                            <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/20">
                                                <td className="py-3 px-4 whitespace-nowrap">{formatDate(item.date)}</td>
                                                <td className="py-3 px-4 font-mono">{item.receiptNumber}</td>
                                                <td className="py-3 px-4">{item.salesman}</td>
                                                <td className="py-3 px-4">{item.itemName}</td>
                                                <td className="py-3 px-4 text-right">{item.qty}</td>
                                                <td className="py-3 px-4 text-right">{formatCurrency(item.sellingPrice)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-green-500">
                                                    {formatCurrency(item.commission)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
