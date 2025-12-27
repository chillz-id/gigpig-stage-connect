import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Financial Details Component (Placeholder - expand as needed)
 *
 * Manages organization financial information:
 * - ABN (11 digits, required)
 * - ACN (9 digits, optional)
 * - Banking details
 * - Tax settings
 */
export default function FinancialDetails() {
  const { organization, refetch, isOwner, isAdmin } = useOrganization();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isOwner || isAdmin;

  const [formData, setFormData] = useState({
    abn: organization?.abn || '',
    acn: organization?.acn || '',
  });

  const handleSave = async () => {
    if (!organization) return;

    // Validate ABN (11 digits)
    const abnClean = formData.abn.replace(/\s/g, '');
    if (abnClean && !/^\d{11}$/.test(abnClean)) {
      toast({
        title: 'Validation Error',
        description: 'ABN must be 11 digits',
        variant: 'destructive',
      });
      return;
    }

    // Validate ACN (9 digits if provided)
    const acnClean = formData.acn.replace(/\s/g, '');
    if (acnClean && !/^\d{9}$/.test(acnClean)) {
      toast({
        title: 'Validation Error',
        description: 'ACN must be 9 digits',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organization_profiles')
        .update({ abn: abnClean, acn: acnClean })
        .eq('id', organization.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Financial details updated' });
      await refetch();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating financial details:', error);
      toast({
        title: 'Error',
        description: 'Failed to update financial details',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Financial Information
          </CardTitle>
          <CardDescription>
            Secure storage of business registration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">ABN (Australian Business Number) *</label>
            <Input
              value={formData.abn}
              onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
              disabled={!isEditing}
              placeholder="12 345 678 901"
              maxLength={14}
            />
            <p className="text-xs text-gray-500 mt-1">11 digits required</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">ACN (Australian Company Number)</label>
            <Input
              value={formData.acn}
              onChange={(e) => setFormData({ ...formData, acn: e.target.value })}
              disabled={!isEditing}
              placeholder="123 456 789"
              maxLength={11}
            />
            <p className="text-xs text-gray-500 mt-1">9 digits (optional)</p>
          </div>
        </CardContent>
      </Card>

      {canEdit && (
        <div className="flex gap-3">
          {isEditing ? (
            <>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>Edit Financial Details</Button>
          )}
        </div>
      )}
    </div>
  );
}
