'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Receipt, Plus, Calendar, Tag, User, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function ExpensesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', page],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '20',
      });
      const res = await fetch(`/api/expenses?${params}`);
      return res.json();
    },
  });

  const expenses = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;
  const totalExpenses = data?.data?.total || 0;

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Expenses</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">{totalExpenses} expense records</p>
        </div>
        <Link href="/expenses/new" className="hidden sm:block">
          <Button className="gradient-primary glow-sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </Link>
      </div>

      {/* Expenses List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="mobile-card">
              <div className="skeleton h-20 rounded-xl" />
            </div>
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <Card className="mobile-card">
          <CardContent className="py-12 text-center">
            <Receipt className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">No expenses found</p>
            <p className="text-muted-foreground text-sm mt-1">Add your first expense</p>
            <Link href="/expenses/new">
              <Button className="mt-4 gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden">
            {expenses.map((expense: any) => (
              <Card key={expense.id} className="mobile-card hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <span className="badge badge-info">{expense.category}</span>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(expense.expenseDate)}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-red-400 text-lg">
                      -{formatCurrency(parseFloat(expense.amount))}
                    </p>
                  </div>
                  
                  {(expense.payee || expense.description) && (
                    <div className="mt-2 pt-2 border-t border-border space-y-1">
                      {expense.payee && (
                        <p className="text-sm text-foreground flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {expense.payee}
                        </p>
                      )}
                      {expense.description && (
                        <p className="text-xs text-muted-foreground truncate">{expense.description}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <Card className="mobile-card hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payee</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground">Description</th>
                      <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense: any) => (
                      <tr key={expense.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-3 px-4 text-foreground">{formatDate(expense.expenseDate)}</td>
                        <td className="py-3 px-4">
                          <span className="badge badge-info">{expense.category}</span>
                        </td>
                        <td className="py-3 px-4 text-foreground">{expense.payee || '-'}</td>
                        <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">{expense.description || '-'}</td>
                        <td className="py-3 px-4 text-right font-bold text-red-400">
                          -{formatCurrency(parseFloat(expense.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-11 touch-target-min"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-11 touch-target-min"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* FAB for mobile */}
      <Link href="/expenses/new" className="fab md:hidden bottom-20 safe-area-bottom">
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  );
}
