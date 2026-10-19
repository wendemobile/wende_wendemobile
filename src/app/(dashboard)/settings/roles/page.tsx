'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Shield, Edit, Trash2, X, Check, Users } from 'lucide-react';
import Link from 'next/link';

const ALL_PERMISSIONS = [
  { key: 'pos.access', label: 'POS Access', group: 'Sales' },
  { key: 'pos.discount', label: 'Apply Discounts', group: 'Sales' },
  { key: 'pos.void', label: 'Void Sales', group: 'Sales' },
  { key: 'inventory.view', label: 'View Inventory', group: 'Inventory' },
  { key: 'inventory.create', label: 'Add Items', group: 'Inventory' },
  { key: 'inventory.edit', label: 'Edit Items', group: 'Inventory' },
  { key: 'inventory.delete', label: 'Delete Items', group: 'Inventory' },
  { key: 'inventory.adjust', label: 'Adjust Stock', group: 'Inventory' },
  { key: 'transfers.view', label: 'View Transfers', group: 'Transfers' },
  { key: 'transfers.create', label: 'Create Transfers', group: 'Transfers' },
  { key: 'transfers.approve', label: 'Approve Transfers', group: 'Transfers' },
  { key: 'customers.view', label: 'View Customers', group: 'Customers' },
  { key: 'customers.manage', label: 'Manage Customers', group: 'Customers' },
  { key: 'credits.view', label: 'View Credits', group: 'Credits' },
  { key: 'credits.manage', label: 'Manage Credits', group: 'Credits' },
  { key: 'expenses.view', label: 'View Expenses', group: 'Finance' },
  { key: 'expenses.create', label: 'Create Expenses', group: 'Finance' },
  { key: 'reports.view', label: 'View Reports', group: 'Reports' },
  { key: 'reports.export', label: 'Export Reports', group: 'Reports' },
  { key: 'settings.view', label: 'View Settings', group: 'Admin' },
  { key: 'settings.manage', label: 'Manage Settings', group: 'Admin' },
  { key: 'users.manage', label: 'Manage Users', group: 'Admin' },
];

export default function RolesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', permissions: [] as string[] });
  const [expandedRole, setExpandedRole] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles');
      const data = await res.json();
      return data.data || [];
    },
  });

  const createRole = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, permissions: JSON.stringify(data.permissions) }),
      });
      if (!res.ok) throw new Error('Failed to create role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/roles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, permissions: JSON.stringify(data.permissions) }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      resetForm();
    },
  });

  const deleteRole = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete role');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roles'] }),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', description: '', permissions: [] });
  };

  const handleEdit = (role: any) => {
    const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
    setEditingId(role.id);
    setFormData({ name: role.name, description: role.description || '', permissions: perms || [] });
    setShowForm(true);
  };

  const togglePermission = (key: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateRole.mutate({ id: editingId, data: formData });
    } else {
      createRole.mutate(formData);
    }
  };

  const groupedPermissions = ALL_PERMISSIONS.reduce((acc, perm) => {
    if (!acc[perm.group]) acc[perm.group] = [];
    acc[perm.group].push(perm);
    return acc;
  }, {} as Record<string, typeof ALL_PERMISSIONS>);

  return (
    <div className="space-y-4 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Roles & Permissions</h1>
          <p className="text-sm text-muted-foreground">Configure access control</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gradient-primary">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Add Role</span>
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 sticky top-0 bg-card z-10">
              <CardTitle className="text-lg">{editingId ? 'Edit Role' : 'New Role'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Role Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Store Manager"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Role description"
                  />
                </div>
                <div className="space-y-3">
                  <Label>Permissions</Label>
                  {Object.entries(groupedPermissions).map(([group, perms]) => (
                    <div key={group} className="bg-secondary/50 rounded-xl p-3">
                      <p className="text-sm font-medium text-foreground mb-2">{group}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {perms.map((perm) => (
                          <button
                            key={perm.key}
                            type="button"
                            onClick={() => togglePermission(perm.key)}
                            className={`flex items-center gap-2 p-2 rounded-lg text-left text-xs transition-all ${
                              formData.permissions.includes(perm.key)
                                ? 'bg-primary/20 text-primary'
                                : 'bg-background hover:bg-background/80 text-muted-foreground'
                            }`}
                          >
                            <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                              formData.permissions.includes(perm.key) ? 'bg-primary border-primary' : 'border-border'
                            }`}>
                              {formData.permissions.includes(perm.key) && <Check className="h-3 w-3 text-white" />}
                            </div>
                            {perm.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={createRole.isPending || updateRole.isPending}>
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Roles List */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roles?.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No roles configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {roles?.map((role: any) => {
                const perms = typeof role.permissions === 'string' ? JSON.parse(role.permissions || '[]') : (role.permissions || []);
                const isExpanded = expandedRole === role.id;
                return (
                  <div key={role.id} className="bg-secondary/50 rounded-xl overflow-hidden">
                    <div className="flex items-center gap-3 p-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                        <Shield className="h-5 w-5 text-amber-500" />
                      </div>
                      <div className="flex-1 min-w-0" onClick={() => setExpandedRole(isExpanded ? null : role.id)}>
                        <p className="font-medium text-foreground">{role.name}</p>
                        <p className="text-xs text-muted-foreground">{perms.length} permissions</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
                              deleteRole.mutate(role.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {isExpanded && perms.length > 0 && (
                      <div className="px-3 pb-3">
                        <div className="flex flex-wrap gap-1">
                          {perms.map((p: string) => (
                            <span key={p} className="badge badge-info">{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
