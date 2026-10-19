'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, MapPin, Building2, Warehouse, Store, Edit, Trash2, X } from 'lucide-react';
import Link from 'next/link';

const LOCATION_TYPES = [
  { value: 'STORE', label: 'Store', icon: Store },
  { value: 'WAREHOUSE', label: 'Warehouse', icon: Warehouse },
  { value: 'BASEMENT', label: 'Basement', icon: Building2 },
];

export default function LocationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', type: 'STORE', description: '' });
  const queryClient = useQueryClient();

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => {
      const res = await fetch('/api/locations');
      const data = await res.json();
      return Array.isArray(data.data) ? data.data : [];
    },
  });

  const createLocation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create location');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      resetForm();
    },
  });

  const updateLocation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await fetch(`/api/locations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update location');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      resetForm();
    },
  });

  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/locations/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete location');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', type: 'STORE', description: '' });
  };

  const handleEdit = (location: any) => {
    setEditingId(location.id);
    setFormData({ name: location.name, type: location.type, description: location.description || '' });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateLocation.mutate({ id: editingId, data: formData });
    } else {
      createLocation.mutate(formData);
    }
  };

  const getTypeIcon = (type: string) => {
    const t = LOCATION_TYPES.find(lt => lt.value === type);
    return t ? t.icon : MapPin;
  };

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
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Locations</h1>
          <p className="text-sm text-muted-foreground">Manage store and warehouse locations</p>
        </div>
        <Button onClick={() => setShowForm(true)} size="sm" className="gradient-primary">
          <Plus className="h-4 w-4 mr-1" />
          <span className="hidden sm:inline">Add</span>
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{editingId ? 'Edit Location' : 'New Location'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Main Store"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOCATION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: type.value })}
                        className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${formData.type === type.value
                            ? 'bg-primary/20 border-2 border-primary text-primary'
                            : 'bg-secondary border-2 border-transparent hover:border-border'
                          }`}
                      >
                        <type.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary" disabled={createLocation.isPending || updateLocation.isPending}>
                    {editingId ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Locations List */}
      <Card className="bg-card border-border/50">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : locations?.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No locations configured</p>
              <Button onClick={() => setShowForm(true)} className="mt-4 gradient-primary">
                <Plus className="h-4 w-4 mr-2" /> Add First Location
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {locations?.map((location: any) => {
                const TypeIcon = getTypeIcon(location.type);
                return (
                  <div key={location.id} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                    <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <TypeIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{location.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="badge badge-info">{location.type}</span>
                        {location.description && (
                          <span className="text-xs text-muted-foreground truncate">{location.description}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(location)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete the location "${location.name}"? This action cannot be undone.`)) {
                            deleteLocation.mutate(location.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
