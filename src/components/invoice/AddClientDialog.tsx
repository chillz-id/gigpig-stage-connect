/**
 * AddClientDialog - Create a new directory profile entry for invoicing
 *
 * Creates a directory_profile with:
 * - Name, email, phone, address, ABN
 * - Client type selection
 * - Optional "Send invite email" checkbox (placeholder for future)
 */

import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatABN, isValidABNFormat } from '@/utils/abn';
import type { InvoiceClient, ClientType } from '@/hooks/useClientSearch';

interface AddClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClientCreated: (client: InvoiceClient) => void;
  initialName?: string;
}

const clientTypes: { value: ClientType; label: string }[] = [
  { value: 'comedian', label: 'Comedian' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'videographer', label: 'Videographer' },
  { value: 'manager', label: 'Manager' },
  { value: 'organization', label: 'Organization' },
  { value: 'venue', label: 'Venue' },
  { value: 'custom', label: 'Other / Custom' },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  abn: string;
  clientType: ClientType;
  gstRegistered: boolean;
  sendInvite: boolean;
}

const initialFormData: FormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  abn: '',
  clientType: 'custom',
  gstRegistered: false,
  sendInvite: false,
};

export function AddClientDialog({
  open,
  onOpenChange,
  onClientCreated,
  initialName = '',
}: AddClientDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>({
    ...initialFormData,
    name: initialName,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const createClientMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { data: profile, error } = await supabase
        .from('directory_profiles')
        .insert({
          stage_name: data.name,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          abn: data.abn ? data.abn.replace(/\s/g, '') : null,
          gst_registered: data.gstRegistered,
          profile_type: data.clientType === 'custom' ? null : data.clientType,
          source: 'manual' as const,
          metadata: {
            created_for: 'invoice',
            client_type: data.clientType,
          },
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return profile;
    },
    onSuccess: (profile) => {
      // Invalidate client search cache
      queryClient.invalidateQueries({ queryKey: ['client-search'] });

      // Create InvoiceClient from the new profile
      const client: InvoiceClient = {
        id: profile.id,
        type: formData.clientType,
        name: profile.stage_name,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        abn: profile.abn,
        gstRegistered: profile.gst_registered ?? false,
        avatarUrl: profile.primary_headshot_url,
        subtitle: formData.clientType === 'custom' ? 'Custom Client' : clientTypes.find(t => t.value === formData.clientType)?.label,
      };

      onClientCreated(client);
      resetForm();

      toast({
        title: 'Client created',
        description: `${profile.stage_name} has been added to your contacts.`,
      });

      // TODO: If sendInvite is true, trigger invite email
      if (formData.sendInvite && formData.email) {
        console.log('TODO: Send invite email to', formData.email);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create client',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onOpenChange(false);
  }, [onOpenChange, resetForm]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.abn && !isValidABNFormat(formData.abn)) {
      newErrors.abn = 'ABN must be 11 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createClientMutation.mutate(formData);
  }, [formData, validateForm, createClientMutation]);

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  const handleABNChange = useCallback((value: string) => {
    // Only allow digits and spaces
    const cleaned = value.replace(/[^\d\s]/g, '');
    // Format as XX XXX XXX XXX
    const formatted = formatABN(cleaned.replace(/\s/g, ''));
    updateField('abn', formatted);
  }, [updateField]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Create a new client contact for invoicing. They can claim their profile later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Client Type */}
            <div className="grid gap-2">
              <Label htmlFor="clientType">Client Type</Label>
              <Select
                value={formData.clientType}
                onValueChange={(value: ClientType) => updateField('clientType', value)}
              >
                <SelectTrigger id="clientType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {clientTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">
                {formData.clientType === 'organization' || formData.clientType === 'venue'
                  ? 'Business Name'
                  : 'Name / Stage Name'} *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder={
                  formData.clientType === 'organization' || formData.clientType === 'venue'
                    ? 'Company Pty Ltd'
                    : 'John Smith'
                }
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="client@example.com"
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="0400 000 000"
              />
            </div>

            {/* Address */}
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="123 Main Street&#10;Sydney NSW 2000"
                rows={2}
              />
            </div>

            {/* ABN */}
            <div className="grid gap-2">
              <Label htmlFor="abn">ABN</Label>
              <Input
                id="abn"
                value={formData.abn}
                onChange={(e) => handleABNChange(e.target.value)}
                placeholder="XX XXX XXX XXX"
                maxLength={14}
                className={errors.abn ? 'border-destructive' : ''}
              />
              {errors.abn && <p className="text-sm text-destructive">{errors.abn}</p>}
            </div>

            {/* GST Registered */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="gstRegistered"
                checked={formData.gstRegistered}
                onCheckedChange={(checked) => updateField('gstRegistered', checked === true)}
              />
              <Label htmlFor="gstRegistered" className="font-normal cursor-pointer">
                GST Registered
              </Label>
            </div>

            {/* Send Invite Email (placeholder for future) */}
            {formData.email && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendInvite"
                  checked={formData.sendInvite}
                  onCheckedChange={(checked) => updateField('sendInvite', checked === true)}
                />
                <Label htmlFor="sendInvite" className="font-normal cursor-pointer">
                  Send invite email to join GigPigs
                </Label>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createClientMutation.isPending}>
              {createClientMutation.isPending ? 'Creating...' : 'Create Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddClientDialog;
