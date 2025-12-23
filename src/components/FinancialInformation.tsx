
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { XeroSyncButton } from './XeroSyncButton';
import { formatABN, isValidABNFormat, validateABNChecksum, lookupABN } from '@/utils/abn';
import { supabase } from '@/integrations/supabase/client';
import type { ProfileAwareProps } from '@/types/universalProfile';
import { getProfileConfig } from '@/utils/profileConfig';

interface FinancialInformationProps extends Partial<ProfileAwareProps> {
  user?: any; // Profile data being edited (may differ from logged-in user)
  organizationId?: string; // If editing an organization profile
  onSave?: (data: any) => Promise<void>;
}

export const FinancialInformation: React.FC<FinancialInformationProps> = ({
  profileType = 'comedian',
  config: propConfig,
  user: propUser,
  organizationId,
  onSave,
}) => {
  const { toast } = useToast();
  const { hasRole, user: authUser } = useAuth();

  // Determine which ID and table to use for queries
  // Priority: organizationId > propUser.id > authUser.id
  const profileId = organizationId || propUser?.id || authUser?.id;
  const tableName = organizationId ? 'organization_profiles' : 'profiles';

  // Use provided config or derive from profileType (backwards compatibility)
  const config = propConfig ?? getProfileConfig(profileType);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS (React Rules of Hooks)
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [financialInfo, setFinancialInfo] = useState({
    accountName: '',
    bsb: '',
    accountNumber: '',
    abn: '',
    gstRegistered: false,
    entityName: '',
    entityType: '',
    gstEffectiveDate: '',
    entityAddress: '',
    entityStateCode: '',
    entityPostcode: '',
  });

  const [abnLookupState, setAbnLookupState] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
  }>({
    loading: false,
    success: false,
    error: null,
  });

  const updateFinancialInfo = (field: keyof typeof financialInfo, value: string | boolean) => {
    setFinancialInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Load financial information on mount
  useEffect(() => {
    const loadFinancialInfo = async () => {
      if (!profileId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('abn, account_name, bsb, account_number, gst_registered, entity_name, entity_type, gst_effective_date, entity_address, entity_state_code, entity_postcode')
          .eq('id', profileId)
          .single();

        if (error) throw error;

        if (data) {
          setFinancialInfo({
            abn: data.abn || '',
            accountName: data.account_name || '',
            bsb: data.bsb || '',
            accountNumber: data.account_number || '',
            gstRegistered: data.gst_registered || false,
            entityName: data.entity_name || '',
            entityType: data.entity_type || '',
            gstEffectiveDate: data.gst_effective_date || '',
            entityAddress: data.entity_address || '',
            entityStateCode: data.entity_state_code || '',
            entityPostcode: data.entity_postcode || '',
          });
        }
      } catch (error) {
        console.error('Error loading financial information:', error);
        toast({
          title: 'Error loading financial information',
          description: 'Could not load your financial details.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadFinancialInfo();
  }, [profileId, tableName, toast]);

  // ABN Lookup effect
  useEffect(() => {
    const abnValue = financialInfo.abn;

    // Reset state if ABN is cleared or invalid format
    if (!abnValue || !isValidABNFormat(abnValue)) {
      setAbnLookupState({ loading: false, success: false, error: null });
      return;
    }

    // Validate checksum
    if (!validateABNChecksum(abnValue)) {
      setAbnLookupState({
        loading: false,
        success: false,
        error: 'Invalid ABN checksum',
      });
      return;
    }

    // Perform ABN lookup
    const performLookup = async () => {
      setAbnLookupState({ loading: true, success: false, error: null });

      const result = await lookupABN(abnValue);

      if (result) {
        setAbnLookupState({ loading: false, success: true, error: null });

        // Update all enrichment data from ABN lookup
        const updates: Record<string, any> = {
          gstRegistered: result.gstRegistered,
          entityName: result.entityName || '',
          entityType: result.entityType || '',
          gstEffectiveDate: result.gstEffectiveDate || '',
          entityAddress: result.address || '',
          entityStateCode: result.stateCode || '',
          entityPostcode: result.postcode || '',
        };

        // Auto-fill account name if empty and entity name is available
        if (!financialInfo.accountName && result.entityName) {
          updates.accountName = result.entityName;
        }

        // Apply all updates at once
        setFinancialInfo(prev => ({ ...prev, ...updates }));

        // Auto-save the ABN enrichment data to prevent race condition
        if (profileId) {
          try {
            await supabase
              .from(tableName)
              .update({
                gst_registered: result.gstRegistered,
                entity_name: result.entityName || null,
                entity_type: result.entityType || null,
                gst_effective_date: result.gstEffectiveDate || null,
                entity_address: result.address || null,
                entity_state_code: result.stateCode || null,
                entity_postcode: result.postcode || null,
                ...(updates.accountName && { account_name: updates.accountName }),
              })
              .eq('id', profileId);
          } catch (error) {
            console.error('Error auto-saving ABN enrichment data:', error);
          }
        }

        toast({
          title: 'ABN Verified',
          description: `${result.entityName || 'Entity'} - ${result.gstRegistered ? 'GST Registered' : 'Not GST Registered'}`,
        });
      } else {
        setAbnLookupState({
          loading: false,
          success: false,
          error: 'Unable to verify ABN',
        });
        toast({
          title: 'ABN Lookup Failed',
          description: 'Unable to verify ABN details. Please check the number.',
          variant: 'destructive',
        });
      }
    };

    // Debounce the lookup
    const timeoutId = setTimeout(performLookup, 500);
    return () => clearTimeout(timeoutId);
  }, [financialInfo.abn]);

  // Hide entire section for profile types without financial information (e.g., managers)
  // This check MUST be after all hooks to comply with React Rules of Hooks
  if (!config.fields.hasFinancial) {
    return null;
  }

  const handleSaveFinancialInfo = async () => {
    if (!profileId) {
      toast({
        title: 'Error',
        description: 'Unable to save - no profile ID available.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await supabase
        .from(tableName)
        .update({
          abn: financialInfo.abn || null,
          account_name: financialInfo.accountName || null,
          bsb: financialInfo.bsb || null,
          account_number: financialInfo.accountNumber || null,
          gst_registered: financialInfo.gstRegistered,
          entity_name: financialInfo.entityName || null,
          entity_type: financialInfo.entityType || null,
          gst_effective_date: financialInfo.gstEffectiveDate || null,
          entity_address: financialInfo.entityAddress || null,
          entity_state_code: financialInfo.entityStateCode || null,
          entity_postcode: financialInfo.entityPostcode || null,
        })
        .eq('id', profileId);

      if (error) throw error;

      toast({
        title: 'Financial Information Saved',
        description: 'Your financial details have been updated.',
      });
    } catch (error) {
      console.error('Error saving financial information:', error);
      toast({
        title: 'Error saving financial information',
        description: 'Could not save your financial details. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="p-4 bg-muted/50 rounded-lg mb-4">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> This information is optional and only needed if you plan to generate invoices or receive payments through the platform. You can use all other features without providing these details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountName">Account Name</Label>
            <Input
              id="accountName"
              value={financialInfo.accountName}
              onChange={(e) => updateFinancialInfo('accountName', e.target.value)}
              placeholder="Your full legal name or business name"
            />
          </div>
          <div>
            <Label htmlFor="bsb">BSB</Label>
            <Input
              id="bsb"
              value={financialInfo.bsb}
              onChange={(e) => updateFinancialInfo('bsb', e.target.value)}
              placeholder="123-456"
              maxLength={7}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              value={financialInfo.accountNumber}
              onChange={(e) => updateFinancialInfo('accountNumber', e.target.value)}
              placeholder="Your bank account number"
            />
          </div>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="abn">ABN</Label>
              <div className="relative">
                <Input
                  id="abn"
                  value={financialInfo.abn}
                  onChange={(e) => {
                    const formatted = formatABN(e.target.value);
                    updateFinancialInfo('abn', formatted);
                  }}
                  placeholder="12 345 678 901"
                  maxLength={14}
                  className={abnLookupState.error ? 'border-red-500' : abnLookupState.success ? 'border-green-500' : ''}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {abnLookupState.loading && (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  {abnLookupState.success && !abnLookupState.loading && (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  )}
                  {abnLookupState.error && !abnLookupState.loading && (
                    <AlertCircle className="w-4 h-4 text-red-500" title={abnLookupState.error} />
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 pb-1 whitespace-nowrap">
              <Checkbox
                id="gstRegistered"
                checked={financialInfo.gstRegistered}
                onCheckedChange={(checked) => updateFinancialInfo('gstRegistered', checked as boolean)}
              />
              <Label
                htmlFor="gstRegistered"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                GST Registered
              </Label>
            </div>
          </div>
        </div>

        {/* ABN Enrichment Data - Read-only information from ABR lookup */}
        {financialInfo.entityName && (
          <div className="p-4 bg-muted/30 rounded-lg space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground">ABN Lookup Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Entity Name</Label>
                <p className="font-medium">{financialInfo.entityName}</p>
              </div>
              {financialInfo.entityType && (
                <div>
                  <Label className="text-xs text-muted-foreground">Entity Type</Label>
                  <p className="font-medium">{financialInfo.entityType}</p>
                </div>
              )}
              {financialInfo.gstEffectiveDate && (
                <div>
                  <Label className="text-xs text-muted-foreground">GST Registration Date</Label>
                  <p className="font-medium">{new Date(financialInfo.gstEffectiveDate).toLocaleDateString('en-AU')}</p>
                </div>
              )}
              {financialInfo.entityAddress && (
                <div>
                  <Label className="text-xs text-muted-foreground">Business Address</Label>
                  <p className="font-medium">{financialInfo.entityAddress}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rates Section - For photographers and videographers */}
        {config.fields.hasRates && (
          <div className="pt-6 border-t">
            <h3 className="text-base font-semibold mb-4">Rates & Availability</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate (Optional)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="150"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Your standard hourly rate in AUD</p>
              </div>
              <div>
                <Label htmlFor="dayRate">Day Rate (Optional)</Label>
                <Input
                  id="dayRate"
                  type="number"
                  placeholder="800"
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">Your standard day rate in AUD</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Note:</strong> These rates are optional and for reference only. Final pricing is negotiated per booking.
            </p>
          </div>
        )}

        <Button
          onClick={handleSaveFinancialInfo}
          className="professional-button"
          disabled={saving || loading}
        >
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {saving ? 'Saving...' : 'Save Financial Information'}
        </Button>

      {/* XERO Integration Section - Hidden for comedian_lite */}
      {!hasRole('comedian_lite') && <XeroSyncButton />}
    </div>
  );
};
