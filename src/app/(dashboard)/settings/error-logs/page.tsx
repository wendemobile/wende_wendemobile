'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, AlertTriangle, Info, Bug, CheckCircle, Clock, Filter, RefreshCw, X
} from 'lucide-react';

type ErrorSeverity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface ErrorLog {
  id: string;
  code: string;
  message: string;
  stackTrace?: string;
  context?: string;
  userId?: string;
  requestId?: string;
  severity: ErrorSeverity;
  component?: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  user?: { id: string; fullName: string };
  resolvedBy?: { id: string; fullName: string };
}

interface ErrorStats {
  total: number;
  bySeverity: Record<string, number>;
  byComponent: Record<string, number>;
  resolved: number;
  unresolved: number;
}

export default function ErrorLogsPage() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ErrorLog | null>(null);
  const [filters, setFilters] = useState({ severity: '', resolved: '', component: '' });

  useEffect(() => { fetchData(); }, [filters]);

  async function fetchData() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.severity) params.set('severity', filters.severity);
      if (filters.resolved) params.set('resolved', filters.resolved);
      if (filters.component) params.set('component', filters.component);

      const [logsRes, statsRes] = await Promise.all([
        fetch(`/api/error-logs?${params.toString()}`),
        fetch('/api/error-logs/stats'),
      ]);

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        if (logsData.success) setLogs(logsData.data);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      }
    } catch (err) {
      console.error('Error fetching error logs:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleResolve(id: string) {
    try {
      const response = await fetch(`/api/error-logs/${id}`, { method: 'PATCH' });
      if (response.ok) { fetchData(); setSelectedLog(null); }
    } catch (err) { console.error('Error resolving error:', err); }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function getSeverityIcon(severity: ErrorSeverity) {
    switch (severity) {
      case 'DEBUG': return <Bug className="h-4 w-4 text-muted-foreground" />;
      case 'INFO': return <Info className="h-4 w-4 text-blue-400" />;
      case 'WARNING': return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'ERROR': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'CRITICAL': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  }

  function getSeverityBadge(severity: ErrorSeverity) {
    switch (severity) {
      case 'DEBUG': return 'bg-secondary text-muted-foreground';
      case 'INFO': return 'badge-info';
      case 'WARNING': return 'badge-warning';
      case 'ERROR': return 'badge-error';
      case 'CRITICAL': return 'bg-red-600/30 text-red-300 border border-red-500/50';
    }
  }

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Error Logs</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage system errors</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="bg-card border-border/50">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Errors</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-3">
              <p className="text-xs text-red-400">Critical/Error</p>
              <p className="text-2xl font-bold text-red-400">
                {(stats.bySeverity['CRITICAL'] || 0) + (stats.bySeverity['ERROR'] || 0)}
              </p>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-3">
              <p className="text-xs text-emerald-400">Resolved</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.resolved}</p>
              <p className="text-xs text-muted-foreground">Fixed issues</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border/50">
            <CardContent className="p-3">
              <p className="text-xs text-amber-400">Unresolved</p>
              <p className="text-2xl font-bold text-amber-400">{stats.unresolved}</p>
              <p className="text-xs text-muted-foreground">Pending review</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Severity</label>
              <select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                className="w-full mt-1 h-10 rounded-xl border border-border bg-secondary/50 px-3 text-sm text-foreground"
              >
                <option value="">All</option>
                <option value="CRITICAL">Critical</option>
                <option value="ERROR">Error</option>
                <option value="WARNING">Warning</option>
                <option value="INFO">Info</option>
                <option value="DEBUG">Debug</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Status</label>
              <select
                value={filters.resolved}
                onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
                className="w-full mt-1 h-10 rounded-xl border border-border bg-secondary/50 px-3 text-sm text-foreground"
              >
                <option value="">All</option>
                <option value="false">Unresolved</option>
                <option value="true">Resolved</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Component</label>
              <input
                type="text"
                value={filters.component}
                onChange={(e) => setFilters({ ...filters, component: e.target.value })}
                className="w-full mt-1 h-10 rounded-xl border border-border bg-secondary/50 px-3 text-sm text-foreground placeholder:text-muted-foreground"
                placeholder="Filter by component"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Logs List */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base">Error Logs</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No error logs found</div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className={`p-3 rounded-xl bg-secondary/50 border border-border/50 cursor-pointer transition-colors hover:bg-secondary ${log.resolved ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(log.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`badge ${getSeverityBadge(log.severity)}`}>{log.severity}</span>
                        <span className="text-xs font-mono text-muted-foreground">{log.code}</span>
                        {log.resolved && (
                          <span className="flex items-center gap-1 text-xs text-emerald-400">
                            <CheckCircle className="h-3 w-3" /> Resolved
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground truncate">{log.message}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {formatDate(log.createdAt)}
                        </span>
                        {log.component && <span>Component: {log.component}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-border">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Error Details</h2>
                <button onClick={() => setSelectedLog(null)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {getSeverityIcon(selectedLog.severity)}
                  <span className={`badge ${getSeverityBadge(selectedLog.severity)}`}>{selectedLog.severity}</span>
                  <span className="font-mono text-sm text-muted-foreground">{selectedLog.code}</span>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground">Message</label>
                  <p className="mt-1 text-foreground">{selectedLog.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground">Request ID</label>
                    <p className="mt-1 font-mono text-sm text-foreground">{selectedLog.requestId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Component</label>
                    <p className="mt-1 text-foreground">{selectedLog.component || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">User</label>
                    <p className="mt-1 text-foreground">{selectedLog.user?.fullName || 'System'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Created At</label>
                    <p className="mt-1 text-foreground">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                </div>

                {selectedLog.stackTrace && (
                  <div>
                    <label className="text-xs text-muted-foreground">Stack Trace</label>
                    <pre className="mt-1 p-3 bg-secondary rounded-xl text-xs overflow-x-auto text-muted-foreground">
                      {selectedLog.stackTrace}
                    </pre>
                  </div>
                )}

                {selectedLog.context && (
                  <div>
                    <label className="text-xs text-muted-foreground">Context</label>
                    <pre className="mt-1 p-3 bg-secondary rounded-xl text-xs overflow-x-auto text-muted-foreground">
                      {(() => {
                        try {
                          return JSON.stringify(JSON.parse(selectedLog.context), null, 2);
                        } catch {
                          return selectedLog.context;
                        }
                      })()}
                    </pre>
                  </div>
                )}

                {selectedLog.resolved ? (
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
                    <p className="text-sm text-emerald-400">
                      Resolved by {selectedLog.resolvedBy?.fullName || 'Unknown'} on{' '}
                      {selectedLog.resolvedAt ? formatDate(selectedLog.resolvedAt) : 'N/A'}
                    </p>
                  </div>
                ) : (
                  <Button onClick={() => handleResolve(selectedLog.id)} className="w-full gradient-primary">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
