'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Users, User, Mail, Lock, Shield, Pencil, Trash2, X, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  roleId: string;
  defaultLocation: string | null;
  defaultLocationId: string | null;
  isActive: boolean;
  commissionRate: number;
}

export default function UsersSettingsPage() {
  const { data: session } = useSession();
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    roleId: '',
    defaultLocationId: '',
    isActive: true,
    commissionRate: '0',
  });
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles');
      const data = await res.json();
      return data.data || [];
    },
  });

  const { data: locations } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      return data.data || [];
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, commissionRate: Number(data.commissionRate) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
  });

  const updateUser = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, commissionRate: Number(data.commissionRate) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      resetForm();
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete user');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirm(null);
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      fullName: '',
      password: '',
      roleId: '',
      defaultLocationId: '',
      isActive: true,
      commissionRate: '0',
    });
  };

  const handleEdit = (user: UserData) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: '',
      roleId: user.roleId,
      defaultLocationId: user.defaultLocationId || '',
      isActive: user.isActive,
      commissionRate: String(user.commissionRate || 0),
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      // Update existing user
      const updateData: any = {
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        roleId: formData.roleId,
        defaultLocationId: formData.defaultLocationId || null,
        isActive: formData.isActive,
        commissionRate: formData.commissionRate,
      };
      // Only include password if it's been changed
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      updateUser.mutate({ id: editingUser.id, data: updateData });
    } else {
      // Create new user
      createUser.mutate(formData);
    }
  };

  const isCurrentUser = (userId: string) => session?.user?.id === userId;

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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage system users and roles</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm" className="gradient-primary">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Add User</span>
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="bg-card border-border/50">
          <CardHeader className="px-4 pt-4 pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                {editingUser ? 'Edit User' : 'New User'}
              </span>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    Username *
                  </Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Enter username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    Email *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                    Password {editingUser ? '(leave blank to keep)' : '*'}
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                    required={!editingUser}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    Role *
                  </Label>
                  <select
                    className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.roleId}
                    onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                    required
                  >
                    <option value="">Select role</option>
                    {Array.isArray(roles) && roles.map((role: any) => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Default Location</Label>
                  <select
                    className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={formData.defaultLocationId}
                    onChange={(e) => setFormData({ ...formData, defaultLocationId: e.target.value })}
                  >
                    <option value="">No default location</option>
                    {Array.isArray(locations) && locations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) => setFormData({ ...formData, commissionRate: e.target.value })}
                    placeholder="e.g. 5.0"
                  />
                </div>
                {editingUser && (
                  <div className="flex items-center gap-3 sm:pt-7">
                    <Label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="h-4 w-4 rounded border-border"
                      />
                      Active
                    </Label>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={createUser.isPending || updateUser.isPending}
                  className="gradient-primary"
                >
                  {createUser.isPending || updateUser.isPending
                    ? (editingUser ? 'Updating...' : 'Creating...')
                    : (editingUser ? 'Update User' : 'Create User')}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
              {(createUser.isError || updateUser.isError) && (
                <p className="text-sm text-red-500">
                  {(createUser.error as Error)?.message || (updateUser.error as Error)?.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-red-500">
                <AlertTriangle className="h-5 w-5" />
                Delete User
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this user? If the user has related records (sales, expenses, transfers),
                they will be deactivated instead of deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteUser.mutate(deleteConfirm)}
                  disabled={deleteUser.isPending}
                >
                  {deleteUser.isPending ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
              {deleteUser.isError && (
                <p className="text-sm text-red-500">{(deleteUser.error as Error)?.message}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No users found</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="md:hidden space-y-2">
                {users?.map((user: UserData) => (
                  <div key={user.id} className="bg-secondary/50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{user.fullName}</p>
                          <p className="text-xs text-muted-foreground font-mono">@{user.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(user)}
                        >
                          <Pencil className="h-4 w-4 text-blue-500" />
                        </Button>
                        {!isCurrentUser(user.id) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setDeleteConfirm(user.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground truncate mr-2">{user.email}</span>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="badge badge-info">{user.role}</span>
                        <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Commission Rate</span>
                      <span className="font-semibold text-primary">{Number(user.commissionRate || 0)}%</span>
                    </div>
                    {isCurrentUser(user.id) && (
                      <p className="text-xs text-primary">(You)</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 text-sm text-muted-foreground font-medium">Username</th>
                      <th className="text-left py-3 text-sm text-muted-foreground font-medium">Full Name</th>
                      <th className="text-left py-3 text-sm text-muted-foreground font-medium">Email</th>
                      <th className="text-left py-3 text-sm text-muted-foreground font-medium">Role</th>
                      <th className="text-right py-3 text-sm text-muted-foreground font-medium">Comm. %</th>
                      <th className="text-center py-3 text-sm text-muted-foreground font-medium">Status</th>
                      <th className="text-center py-3 text-sm text-muted-foreground font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users?.map((user: UserData) => (
                      <tr key={user.id} className="border-b border-border/50">
                        <td className="py-3 font-mono text-sm">
                          {user.username}
                          {isCurrentUser(user.id) && (
                            <span className="ml-2 text-xs text-primary">(You)</span>
                          )}
                        </td>
                        <td className="py-3 text-sm">{user.fullName}</td>
                        <td className="py-3 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-3"><span className="badge badge-info">{user.role}</span></td>
                        <td className="py-3 text-right text-sm">{Number(user.commissionRate || 0)}%</td>
                        <td className="py-3 text-center">
                          <span className={`badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(user)}
                            >
                              <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            {!isCurrentUser(user.id) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteConfirm(user.id)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            )}
                          </div>
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
