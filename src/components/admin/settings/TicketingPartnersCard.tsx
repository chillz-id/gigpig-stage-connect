import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Ticket, Plus, Pencil, Trash2, Lock, ExternalLink } from 'lucide-react';
import { useTicketingPartners, TicketingPartner, TicketingPartnerInsert, TicketingPartnerUpdate } from '@/hooks/useTicketingPartners';
import LoadingSpinner from '@/components/LoadingSpinner';

interface PartnerFormData {
  name: string;
  slug: string;
  website_url: string;
  commission_rate: string;
  is_active: boolean;
  notes: string;
}

const emptyFormData: PartnerFormData = {
  name: '',
  slug: '',
  website_url: '',
  commission_rate: '',
  is_active: true,
  notes: '',
};

export function TicketingPartnersCard() {
  const {
    partners,
    isLoading,
    createPartner,
    updatePartner,
    deletePartner,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTicketingPartners();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingPartner, setEditingPartner] = useState<TicketingPartner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<TicketingPartner | null>(null);
  const [formData, setFormData] = useState<PartnerFormData>(emptyFormData);

  const handleOpenAdd = () => {
    setFormData(emptyFormData);
    setShowAddDialog(true);
  };

  const handleOpenEdit = (partner: TicketingPartner) => {
    setFormData({
      name: partner.name,
      slug: partner.slug,
      website_url: partner.website_url || '',
      commission_rate: partner.commission_rate.toString(),
      is_active: partner.is_active,
      notes: partner.notes || '',
    });
    setEditingPartner(partner);
  };

  const handleCloseDialogs = () => {
    setShowAddDialog(false);
    setEditingPartner(null);
    setFormData(emptyFormData);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name),
    }));
  };

  const handleSubmit = () => {
    const commissionRate = parseFloat(formData.commission_rate);
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return;
    }

    if (editingPartner) {
      const updateData: TicketingPartnerUpdate = {
        name: formData.name,
        slug: formData.slug,
        website_url: formData.website_url || null,
        commission_rate: commissionRate,
        is_active: formData.is_active,
        notes: formData.notes || null,
      };
      updatePartner({ id: editingPartner.id, data: updateData }, {
        onSuccess: handleCloseDialogs,
      });
    } else {
      const insertData: TicketingPartnerInsert = {
        name: formData.name,
        slug: formData.slug,
        website_url: formData.website_url || null,
        commission_rate: commissionRate,
        is_active: formData.is_active,
        notes: formData.notes || null,
      };
      createPartner(insertData, {
        onSuccess: handleCloseDialogs,
      });
    }
  };

  const handleDelete = () => {
    if (deletingPartner) {
      deletePartner(deletingPartner.id, {
        onSuccess: () => setDeletingPartner(null),
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Ticket className="w-5 h-5" />
            Ticketing Partners
          </CardTitle>
          <Button
            onClick={handleOpenAdd}
            size="sm"
            className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Partner
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {partners.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              No ticketing partners configured yet
            </div>
          ) : (
            partners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{partner.name}</span>
                      {partner.is_system && (
                        <Lock className="w-3 h-3 text-white/40" title="System partner" />
                      )}
                      {!partner.is_active && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <span>{partner.commission_rate}% commission</span>
                      {partner.website_url && (
                        <a
                          href={partner.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:text-white/80"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(partner)}
                    className="text-white/70 hover:text-white hover:bg-white/10"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {!partner.is_system && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingPartner(partner)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          <p className="text-white/50 text-sm pt-2">
            Configure commission rates for ticketing platforms. System partners cannot be deleted.
          </p>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog || !!editingPartner} onOpenChange={(open) => {
        if (!open) handleCloseDialogs();
      }}>
        <DialogContent className="bg-gray-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Edit Ticketing Partner' : 'Add Ticketing Partner'}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {editingPartner
                ? 'Update the ticketing partner details.'
                : 'Add a new ticketing partner with their commission rate.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">Partner Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={handleNameChange}
                placeholder="e.g., Ticketmaster"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug" className="text-white">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., ticketmaster"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="commission_rate" className="text-white">Commission Rate (%)</Label>
              <div className="relative">
                <Input
                  id="commission_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.commission_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, commission_rate: e.target.value }))}
                  placeholder="e.g., 20"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url" className="text-white">Website URL (optional)</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData(prev => ({ ...prev, website_url: e.target.value }))}
                placeholder="https://example.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white">Notes (optional)</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-white">Active</Label>
                <p className="text-white/60 text-sm">Partner can be used for ticket entries</p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={handleCloseDialogs}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name || !formData.slug || !formData.commission_rate || isCreating || isUpdating}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
            >
              {(isCreating || isUpdating) ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {editingPartner ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingPartner ? 'Update Partner' : 'Add Partner'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPartner} onOpenChange={(open) => !open && setDeletingPartner(null)}>
        <AlertDialogContent className="bg-gray-900 border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Partner</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              Are you sure you want to delete "{deletingPartner?.name}"? This action cannot be undone.
              Any manual ticket entries using this partner will need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
