'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, User, Package, MessageSquare, Plus, X, Check, Play, Truck, ArrowDownToLine, UserCheck } from 'lucide-react';
import Link from 'next/link';
import { VendorSelectionModal } from '@/components/defects/vendor-selection-modal';
import { VendorMoveHistory } from '@/components/defects/vendor-move-history';
import { getWorkflowActions, getStatusBadgeStyle, formatStatus, type DefectStatus } from '@/lib/defect-workflow';

export default function DefectDetailPage({ params }: { params: { id: string } }) {
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receiveNotes, setReceiveNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: defect, isLoading } = useQuery({
    queryKey: ['defect', params.id],
    queryFn: async () => {
      const res = await fetch(`/api/defects/${params.id}`);
      const data = await res.json();
      return data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/defects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['defect', params.id] }),
  });

  const sendToVendor = useMutation({
    mutationFn: async ({ vendorId, notes }: { vendorId: string; notes?: string }) => {
      const res = await fetch(`/api/defects/${params.id}/vendor-moves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, notes }),
      });
      if (!res.ok) throw new Error('Failed to send to vendor');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', params.id] });
      setShowVendorModal(false);
    },
  });

  const receiveFromVendor = useMutation({
    mutationFn: async ({ moveId, notes }: { moveId: string; notes?: string }) => {
      const res = await fetch(`/api/defects/${params.id}/vendor-moves/${moveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error('Failed to receive from vendor');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', params.id] });
      setShowReceiveModal(false);
      setReceiveNotes('');
    },
  });

  const addNote = useMutation({
    mutationFn: async (note: string) => {
      const res = await fetch(`/api/defects/${params.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['defect', params.id] });
      setShowNote(false);
      setNoteText('');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!defect) {
    return <div className="text-center py-12 text-muted-foreground">Defect not found</div>;
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-secondary text-muted-foreground';
      case 'NORMAL': return 'badge-info';
      case 'HIGH': return 'badge-warning';
      case 'URGENT': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const workflowActions = getWorkflowActions(defect.status as DefectStatus);
  const activeVendorMove = defect.vendorMoves?.find((m: any) => !m.receivedAt);

  const handleWorkflowAction = (actionType: string) => {
    switch (actionType) {
      case 'START_WORKING':
        updateStatus.mutate('DIAGNOSED');
        break;
      case 'SEND_TO_VENDOR':
        setShowVendorModal(true);
        break;
      case 'RECEIVE_FROM_VENDOR':
        setShowReceiveModal(true);
        break;
      case 'TRANSFER_TO_CUSTOMER':
        updateStatus.mutate('COMPLETED');
        break;
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'START_WORKING': return <Play className="h-4 w-4 mr-2" />;
      case 'SEND_TO_VENDOR': return <Truck className="h-4 w-4 mr-2" />;
      case 'RECEIVE_FROM_VENDOR': return <ArrowDownToLine className="h-4 w-4 mr-2" />;
      case 'TRANSFER_TO_CUSTOMER': return <UserCheck className="h-4 w-4 mr-2" />;
      default: return null;
    }
  };

  const getActionButtonClass = (variant: string) => {
    switch (variant) {
      case 'primary': return 'gradient-primary';
      case 'success': return 'bg-green-600 hover:bg-green-700 text-white';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white';
      default: return 'gradient-primary';
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/defects">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{defect.defectNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatDate(defect.intakeDate)}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeStyle(defect.status)}`}>
          {formatStatus(defect.status)}
        </span>
      </div>

      {/* Workflow Actions */}
      {workflowActions.length > 0 && (
        <Card className="bg-card border-border/50 border-2 border-primary/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {workflowActions.map((action) => (
                <Button
                  key={action.type}
                  onClick={() => handleWorkflowAction(action.type)}
                  disabled={updateStatus.isPending || sendToVendor.isPending || receiveFromVendor.isPending}
                  className={`flex-1 h-12 text-base ${getActionButtonClass(action.variant)}`}
                >
                  {getActionIcon(action.type)}
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Info */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            Item Details
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Item Name</span>
            <span className="font-medium text-foreground">{defect.itemName}</span>
          </div>
          {defect.serialNumber && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serial Number</span>
              <span className="font-mono text-foreground">{defect.serialNumber}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Priority</span>
            <span className={`badge ${getPriorityBadge(defect.priority)}`}>{defect.priority}</span>
          </div>
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="text-foreground">{defect.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Customer */}
      {defect.customer && (
        <Card className="bg-card border-border/50">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Customer
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="font-medium text-foreground">{defect.customer.name}</p>
            <p className="text-sm text-muted-foreground">{defect.customer.phone || 'No phone'}</p>
          </CardContent>
        </Card>
      )}

      {/* Vendor Move History */}
      {defect.vendorMoves && defect.vendorMoves.length > 0 && (
        <VendorMoveHistory vendorMoves={defect.vendorMoves} currentStatus={defect.status} />
      )}

      {/* Notes */}
      <Card className="bg-card border-border/50">
        <CardHeader className="px-4 pt-4 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            Notes
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setShowNote(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          {defect.notes && defect.notes.length > 0 ? (
            <div className="space-y-2">
              {defect.notes.map((note: any) => (
                <div key={note.id} className="p-3 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-foreground">{note.note}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(note.createdAt)}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No notes yet</p>
          )}
        </CardContent>
      </Card>

      {/* Completed Status */}
      {defect.status === 'COMPLETED' && defect.completedAt && (
        <Card className="bg-green-500/10 border-green-500/30">
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="h-6 w-6 text-green-500" />
            <div>
              <p className="font-medium text-green-400">Defect Completed</p>
              <p className="text-sm text-muted-foreground">Completed on {formatDate(defect.completedAt)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendor Selection Modal */}
      <VendorSelectionModal
        isOpen={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onConfirm={(vendorId, notes) => sendToVendor.mutate({ vendorId, notes })}
        isLoading={sendToVendor.isPending}
      />

      {/* Receive from Vendor Modal */}
      {showReceiveModal && activeVendorMove && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowDownToLine className="h-5 w-5 text-primary" />
                Receive from Vendor
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowReceiveModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-secondary/50 rounded-xl">
                  <p className="text-sm text-muted-foreground">Receiving from:</p>
                  <p className="font-medium text-foreground">{activeVendorMove.vendor.name}</p>
                  <p className="text-xs text-muted-foreground">Sent: {formatDate(activeVendorMove.sentAt)}</p>
                </div>
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <textarea
                    value={receiveNotes}
                    onChange={(e) => setReceiveNotes(e.target.value)}
                    placeholder="Add notes about the repair..."
                    className="w-full h-24 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowReceiveModal(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => receiveFromVendor.mutate({ moveId: activeVendorMove.id, notes: receiveNotes || undefined })}
                    disabled={receiveFromVendor.isPending}
                    className="flex-1 gradient-primary"
                  >
                    {receiveFromVendor.isPending ? 'Receiving...' : 'Confirm Receive'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Note Modal */}
      {showNote && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Add Note</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowNote(false)}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Note</Label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter note..."
                    className="w-full h-24 rounded-xl border border-border bg-secondary/50 px-4 py-3 text-sm resize-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setShowNote(false)} className="flex-1">Cancel</Button>
                  <Button onClick={() => addNote.mutate(noteText)} disabled={!noteText || addNote.isPending} className="flex-1 gradient-primary">
                    {addNote.isPending ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
