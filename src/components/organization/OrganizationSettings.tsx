import { useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Shield, Users, Plug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ALL_ORG_FEATURES, FEATURE_LABELS, FEATURE_DESCRIPTIONS, OrgFeature } from '@/config/organizationTypes';
import { OrgXeroSettingsSection } from './OrgXeroSettingsSection';

/**
 * Organization Settings Component
 *
 * Settings tab for organizations with:
 * - Feature toggles (enable/disable organizational features)
 * - Privacy settings (placeholder for future)
 * - Team management (link to team page)
 */
export default function OrganizationSettings() {
  const { organization, refetch, isOwner, isAdmin } = useOrganization();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const canEdit = isOwner || isAdmin;

  // Initialize enabled features from organization data
  const [enabledFeatures, setEnabledFeatures] = useState<Record<string, boolean>>(
    organization?.enabled_features || {}
  );

  const handleFeatureToggle = (feature: OrgFeature) => {
    setEnabledFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  const handleSave = async () => {
    if (!organization) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('organization_profiles')
        .update({ enabled_features: enabledFeatures })
        .eq('id', organization.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Settings updated successfully',
      });

      await refetch();
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEnabledFeatures(organization?.enabled_features || {});
  };

  // Check if settings have changed
  const hasChanges = JSON.stringify(enabledFeatures) !== JSON.stringify(organization?.enabled_features || {});

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Organization Settings
          </CardTitle>
          <CardDescription>
            Configure features and preferences for your organization
          </CardDescription>
        </CardHeader>
      </Card>

      <Accordion type="multiple" defaultValue={['features', 'integrations', 'privacy', 'team']}>
        {/* Feature Toggles */}
        <AccordionItem value="features">
          <AccordionTrigger>Feature Toggles</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <p className="text-sm text-muted-foreground mb-4">
                Enable or disable features for your organization. Disabled features will be hidden from your organization profile.
              </p>

              <div className="space-y-4">
                {ALL_ORG_FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start justify-between gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor={feature} className="text-base font-medium cursor-pointer">
                        {FEATURE_LABELS[feature]}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {FEATURE_DESCRIPTIONS[feature]}
                      </p>
                    </div>
                    <Switch
                      id={feature}
                      checked={enabledFeatures[feature] || false}
                      onCheckedChange={() => handleFeatureToggle(feature)}
                      disabled={!canEdit}
                    />
                  </div>
                ))}
              </div>

              {canEdit && hasChanges && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="secondary" onClick={handleReset} disabled={isSaving}>
                    Reset
                  </Button>
                </div>
              )}

              {!canEdit && (
                <p className="text-sm text-muted-foreground pt-4 border-t">
                  Only organization owners and admins can change feature settings.
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Integrations */}
        <AccordionItem value="integrations">
          <AccordionTrigger>
            <div className="flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Integrations
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4">
              <OrgXeroSettingsSection />
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Privacy Settings */}
        <AccordionItem value="privacy">
          <AccordionTrigger>Privacy & Visibility</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-5 w-5" />
                <p className="text-sm">Privacy settings will be available in a future update.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Planned features: public profile visibility, contact information privacy, member list visibility
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Team Management */}
        <AccordionItem value="team">
          <AccordionTrigger>Team Management</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5" />
                <p className="text-sm">Team member management will be available in a future update.</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Planned features: invite team members, manage roles (owner, admin, member), permissions
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
