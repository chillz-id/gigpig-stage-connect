/**
 * Invoice Form - Create and edit invoices
 *
 * Features:
 * - Client selection with search across profile tables
 * - ABN with auto GST lookup
 * - Per-item GST treatment
 * - Deductions support
 * - CC/BCC email recipients
 * - Deposit configuration
 * - Preview before sending
 */

import React, { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Save, Send, ArrowLeft, Eye, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { useInvoiceFormState } from '@/hooks/useInvoiceFormState';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { InvoiceItemsList } from '@/components/invoice/InvoiceItemsList';
import { DepositCalculator } from '@/components/invoice/DepositCalculator';
import { ClientSelector } from '@/components/invoice/ClientSelector';
import { AddClientDialog } from '@/components/invoice/AddClientDialog';
import { ABNWithGstInput } from '@/components/invoice/ABNWithGstInput';
import { EmailRecipientsInput } from '@/components/invoice/EmailRecipientsInput';
import type { InvoiceClient } from '@/hooks/useClientSearch';

const RefactoredInvoiceForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const { user } = useAuth();

  const isEditMode = !!invoiceId;

  // Get the return path from location state, or default to going back
  const returnPath = (location.state as { from?: string })?.from;
  const { createInvoice, updateInvoice, sendInvoiceEmail } = useInvoiceOperations();

  // Fetch current user's profile for "Bill From" details
  const { data: senderProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, stage_name, display_name, email, phone, location, abn, gst_registered, entity_name, entity_address, entity_state_code, entity_postcode, avatar_url, account_name, bsb, account_number')
        .eq('id', user.id)
        .single();
      if (error) {
        console.error('Failed to fetch sender profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!user?.id,
  });

  // Add client dialog state
  const [showAddClientDialog, setShowAddClientDialog] = useState(false);

  const {
    // State
    invoiceData,
    items,
    showDepositSection,
    showPreview,

    // Calculated values
    subtotal,
    taxAmount,
    total,
    depositAmount,
    remainingAmount,
    defaultGstTreatment,

    // Actions
    updateInvoiceData,
    selectClient,
    updateCcEmails,
    updateBccEmails,
    addItem,
    addDeduction,
    removeItem,
    updateItem,
    setShowDepositSection,
    setShowPreview,

    // Utilities
    validateForm,
    resetForm,
    loadInvoice,
  } = useInvoiceFormState();

  // Fetch existing invoice data when in edit mode
  const { data: existingInvoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) return null;
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_recipients (*),
          invoice_items (*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) {
        console.error('Failed to fetch invoice:', error);
        throw error;
      }
      return data;
    },
    enabled: !!invoiceId,
  });

  // Load invoice data when fetched
  React.useEffect(() => {
    if (existingInvoice && isEditMode) {
      loadInvoice(existingInvoice);
    }
  }, [existingInvoice, isEditMode, loadInvoice]);

  // Fetch client avatar when no client object but have email (edit mode)
  const { data: clientAvatar } = useQuery({
    queryKey: ['client-avatar', invoiceData.clientEmail, invoiceData.clientName],
    queryFn: async () => {
      if (!invoiceData.clientEmail && !invoiceData.clientName) return null;

      // Try organization_profiles first (has the actual logos)
      if (invoiceData.clientEmail) {
        const { data: orgProfileByEmail } = await supabase
          .from('organization_profiles')
          .select('logo_url, organization_name')
          .eq('contact_email', invoiceData.clientEmail)
          .limit(1)
          .maybeSingle();
        if (orgProfileByEmail?.logo_url) return orgProfileByEmail.logo_url;
      }

      if (invoiceData.clientName) {
        const { data: orgProfileByName } = await supabase
          .from('organization_profiles')
          .select('logo_url, organization_name')
          .ilike('organization_name', `%${invoiceData.clientName}%`)
          .limit(1)
          .maybeSingle();
        if (orgProfileByName?.logo_url) return orgProfileByName.logo_url;
      }

      // Try profile by email
      if (invoiceData.clientEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('email', invoiceData.clientEmail)
          .limit(1)
          .maybeSingle();
        if (profile?.avatar_url) return profile.avatar_url;
      }

      return null;
    },
    enabled: !invoiceData.client && (!!invoiceData.clientEmail || !!invoiceData.clientName),
  });

  const handleSubmit = async (status: 'draft' | 'sent') => {
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: 'Validation Error',
        description: validation.errors.join(', '),
        variant: 'destructive',
      });
      return;
    }

    try {
      // Build sender name from profile
      const senderName = senderProfile?.stage_name
        || senderProfile?.display_name
        || (senderProfile?.first_name && senderProfile?.last_name
            ? `${senderProfile.first_name} ${senderProfile.last_name}`
            : senderProfile?.first_name)
        || user?.email?.split('@')[0]
        || '';

      // Build sender address
      const senderAddress = senderProfile?.entity_address
        ? [senderProfile.entity_address, senderProfile.entity_state_code, senderProfile.entity_postcode]
            .filter(Boolean).join(', ')
        : senderProfile?.location || undefined;

      const invoicePayload = {
        // Invoice type: 'receivable' for invoices you send to clients (you're owed money)
        invoice_type: 'receivable' as const,
        status,

        // Sender info (from profiles table)
        sender_name: senderName,
        sender_email: senderProfile?.email || user?.email || '',
        sender_phone: senderProfile?.phone || undefined,
        sender_address: senderAddress,
        sender_abn: senderProfile?.abn || undefined,
        // Bank details for payment
        sender_bank_name: senderProfile?.account_name || undefined,
        sender_bank_bsb: senderProfile?.bsb || undefined,
        sender_bank_account: senderProfile?.account_number || undefined,

        // Dates as ISO strings
        issue_date: invoiceData.issueDate.toISOString(),
        due_date: invoiceData.dueDate.toISOString(),

        // Currency and tax
        currency: 'AUD',
        tax_rate: 10,
        tax_treatment: 'inclusive' as const,

        // Totals
        subtotal_amount: subtotal,
        tax_amount: taxAmount,
        total_amount: total,

        // Notes
        notes: invoiceData.notes,

        // Items
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.rate,
          subtotal: item.quantity * item.rate * (item.isDeduction ? -1 : 1),
          tax_amount: 0, // Calculated per item in service
          total: item.total * (item.isDeduction ? -1 : 1),
          gst_treatment: item.gstTreatment,
          is_deduction: item.isDeduction,
        })),

        // Recipients (client)
        recipients: [{
          recipient_name: invoiceData.clientName,
          recipient_email: invoiceData.clientEmail,
          recipient_phone: invoiceData.clientPhone || undefined,
          recipient_address: invoiceData.clientAddress || undefined,
          recipient_abn: invoiceData.clientABN || undefined,
          recipient_type: invoiceData.client?.type === 'organization' ? 'company' as const : 'individual' as const,
        }],

        // Deposit config
        deposit_amount: invoiceData.requireDeposit ? depositAmount : undefined,
        event_date: invoiceData.eventDate?.toISOString(),
        deposit_due_days_before_event: invoiceData.requireDeposit ? invoiceData.depositDueDaysBeforeEvent : undefined,
      };

      console.log('Invoice payload:', JSON.stringify(invoicePayload, null, 2));

      if (isEditMode && invoiceId) {
        // Update existing invoice
        // Also update invoice_type to 'receivable' to fix any legacy 'other' invoices
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            invoice_type: 'receivable',
            status,
            sender_name: invoicePayload.sender_name,
            sender_email: invoicePayload.sender_email,
            sender_phone: invoicePayload.sender_phone,
            sender_address: invoicePayload.sender_address,
            sender_abn: invoicePayload.sender_abn,
            sender_bank_name: invoicePayload.sender_bank_name,
            sender_bank_bsb: invoicePayload.sender_bank_bsb,
            sender_bank_account: invoicePayload.sender_bank_account,
            issue_date: invoicePayload.issue_date,
            due_date: invoicePayload.due_date,
            subtotal: invoicePayload.subtotal_amount,
            tax_amount: invoicePayload.tax_amount,
            total_amount: invoicePayload.total_amount,
            notes: invoicePayload.notes,
            deposit_amount: invoicePayload.deposit_amount,
            event_date: invoicePayload.event_date,
            deposit_due_days_before_event: invoicePayload.deposit_due_days_before_event,
            updated_at: new Date().toISOString(),
          })
          .eq('id', invoiceId);

        if (updateError) throw updateError;

        // Delete existing items and recipients, then re-insert
        await supabase.from('invoice_items').delete().eq('invoice_id', invoiceId);
        await supabase.from('invoice_recipients').delete().eq('invoice_id', invoiceId);

        // Insert new items
        // Note: is_deduction column doesn't exist in DB yet - deductions tracked by negative values
        if (invoicePayload.items.length > 0) {
          const { error: itemsError } = await supabase
            .from('invoice_items')
            .insert(invoicePayload.items.map(item => ({
              invoice_id: invoiceId,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
              subtotal: item.subtotal,
              tax_amount: item.tax_amount,
              total_price: item.total,
            })));
          if (itemsError) throw itemsError;
        }

        // Insert new recipients
        const { error: recipientsError } = await supabase
          .from('invoice_recipients')
          .insert(invoicePayload.recipients.map(r => ({
            invoice_id: invoiceId,
            recipient_name: r.recipient_name,
            recipient_email: r.recipient_email,
            recipient_phone: r.recipient_phone,
            recipient_address: r.recipient_address,
            recipient_abn: r.recipient_abn,
            recipient_type: r.recipient_type,
          })));
        if (recipientsError) throw recipientsError;
      } else {
        // Create new invoice
        const newInvoice = await createInvoice.mutateAsync(invoicePayload);

        // If status is 'sent', send the email
        if (status === 'sent' && newInvoice?.id) {
          try {
            await sendInvoiceEmail.mutateAsync({
              invoiceId: newInvoice.id,
              attachPdf: true,
            });
          } catch (emailError) {
            console.error('Failed to send invoice email:', emailError);
            // Continue even if email fails - invoice is saved
            toast({
              title: 'Invoice Saved',
              description: 'Invoice was saved but email delivery failed. You can resend from the invoice details.',
              variant: 'destructive',
            });
            if (returnPath) {
              navigate(returnPath);
            } else {
              navigate(-1);
            }
            return;
          }
        }
      }

      // For edit mode with 'sent' status, send the email
      if (isEditMode && invoiceId && status === 'sent') {
        try {
          await sendInvoiceEmail.mutateAsync({
            invoiceId,
            attachPdf: true,
          });
        } catch (emailError) {
          console.error('Failed to send invoice email:', emailError);
          toast({
            title: 'Invoice Saved',
            description: 'Invoice was saved but email delivery failed. You can resend from the invoice details.',
            variant: 'destructive',
          });
          if (returnPath) {
            navigate(returnPath);
          } else {
            navigate(-1);
          }
          return;
        }
      }

      toast({
        title: isEditMode ? 'Invoice Updated' : (status === 'draft' ? 'Invoice Saved' : 'Invoice Sent'),
        description: isEditMode
          ? 'Invoice has been updated successfully.'
          : `Invoice has been ${status === 'draft' ? 'saved as draft' : 'sent to the client'}.`,
      });

      // Navigate back to where user came from, or go back in history
      if (returnPath) {
        navigate(returnPath);
      } else {
        navigate(-1);
      }
    } catch (error: unknown) {
      console.error('Invoice save error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Error Saving Invoice',
        description: errorMessage || `Failed to ${status === 'draft' ? 'save' : 'send'} invoice.`,
        variant: 'destructive',
      });
    }
  };

  const handleClientCreated = useCallback((client: InvoiceClient) => {
    selectClient(client);
    setShowAddClientDialog(false);
  }, [selectClient]);

  const handleABNChange = useCallback((abn: string) => {
    updateInvoiceData({ clientABN: abn });
  }, [updateInvoiceData]);

  const handleGstChange = useCallback((gstRegistered: boolean) => {
    updateInvoiceData({ clientGstRegistered: gstRegistered });
  }, [updateInvoiceData]);

  // Render preview dialog
  const renderPreview = () => {
    // Build sender name from profile data
    const senderName = senderProfile?.stage_name
      || senderProfile?.display_name
      || (senderProfile?.first_name && senderProfile?.last_name
          ? `${senderProfile.first_name} ${senderProfile.last_name}`
          : senderProfile?.first_name)
      || user?.email?.split('@')[0]
      || 'Your Name';

    // Build sender address from entity fields
    const senderAddress = senderProfile?.entity_address
      ? [senderProfile.entity_address, senderProfile.entity_state_code, senderProfile.entity_postcode]
          .filter(Boolean).join(', ')
      : senderProfile?.location || undefined;

    return (
      <InvoicePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        invoiceData={{
          // Client (Bill To)
          clientName: invoiceData.clientName,
          clientEmail: invoiceData.clientEmail,
          clientPhone: invoiceData.clientPhone,
          clientAddress: invoiceData.clientAddress,
          clientABN: invoiceData.clientABN,
          clientAvatarUrl: invoiceData.client?.avatarUrl || clientAvatar || undefined,
          // Sender (Bill From) - from profiles table
          senderName: senderName,
          senderEmail: senderProfile?.email || user?.email || '',
          senderPhone: senderProfile?.phone || undefined,
          senderAddress: senderAddress,
          senderABN: senderProfile?.abn || undefined,
          senderAvatarUrl: senderProfile?.avatar_url,
          // Bank details for payment
          senderBankName: senderProfile?.account_name || undefined,
          senderBankBsb: senderProfile?.bsb || undefined,
          senderBankAccount: senderProfile?.account_number || undefined,
          // Invoice details
          issueDate: invoiceData.issueDate,
          dueDate: invoiceData.dueDate,
          items: items.map(item => ({
            id: item.id,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            total: item.total,
            isDeduction: item.isDeduction,
            gstTreatment: item.gstTreatment,
          })),
          taxRate: 10, // Default GST rate
          notes: invoiceData.notes,
          status: invoiceData.status,
          requireDeposit: invoiceData.requireDeposit,
          depositType: invoiceData.depositType,
          depositAmount: invoiceData.depositAmount,
          depositPercentage: invoiceData.depositPercentage,
          depositDueDaysBeforeEvent: invoiceData.depositDueDaysBeforeEvent,
          eventDate: invoiceData.eventDate,
        }}
        onSave={(status) => handleSubmit(status)}
      />
    );
  };

  // Show loading state while fetching existing invoice
  if (isEditMode && invoiceLoading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => returnPath ? navigate(returnPath) : navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{isEditMode ? 'Edit Invoice' : 'Create New Invoice'}</h1>
            <p className="text-gray-600">
              {isEditMode ? 'Update the invoice details' : 'Fill in the details to create a new invoice'}
            </p>
          </div>
        </div>
      </div>

      <form className="space-y-6">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Client</CardTitle>
            <CardDescription>Select an existing client or add a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <ClientSelector
                value={invoiceData.client}
                onSelect={selectClient}
                onAddNewClient={() => setShowAddClientDialog(true)}
                placeholder="Search for a client..."
              />
            </div>

            {/* Manual client details (editable even when client selected) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={invoiceData.clientName}
                  onChange={(e) => updateInvoiceData({ clientName: e.target.value })}
                  placeholder="Enter client name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email Address *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={invoiceData.clientEmail}
                  onChange={(e) => updateInvoiceData({ clientEmail: e.target.value })}
                  placeholder="client@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientPhone">Phone Number</Label>
                <Input
                  id="clientPhone"
                  value={invoiceData.clientPhone}
                  onChange={(e) => updateInvoiceData({ clientPhone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>

              {/* ABN with GST Lookup */}
              <ABNWithGstInput
                value={invoiceData.clientABN}
                onChange={handleABNChange}
                gstRegistered={invoiceData.clientGstRegistered}
                onGstChange={handleGstChange}
              />

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="clientAddress">Address</Label>
                <Textarea
                  id="clientAddress"
                  value={invoiceData.clientAddress}
                  onChange={(e) => updateInvoiceData({ clientAddress: e.target.value })}
                  placeholder="Enter client address"
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Recipients (CC/BCC) */}
        <Card>
          <CardHeader>
            <CardTitle>Email Recipients</CardTitle>
            <CardDescription>Configure who receives the invoice email</CardDescription>
          </CardHeader>
          <CardContent>
            <EmailRecipientsInput
              primaryEmail={invoiceData.clientEmail}
              ccEmails={invoiceData.emailRecipients.ccEmails}
              bccEmails={invoiceData.emailRecipients.bccEmails}
              onCcChange={updateCcEmails}
              onBccChange={updateBccEmails}
            />
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Set invoice dates</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'professional-button w-full justify-start text-left font-normal',
                      !invoiceData.issueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceData.issueDate ? format(invoiceData.issueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={invoiceData.issueDate}
                    onSelect={(date) => date && updateInvoiceData({ issueDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    className={cn(
                      'professional-button w-full justify-start text-left font-normal',
                      !invoiceData.dueDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceData.dueDate ? format(invoiceData.dueDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={invoiceData.dueDate}
                    onSelect={(date) => date && updateInvoiceData({ dueDate: date })}
                    disabled={(date) => date < invoiceData.issueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
            <CardDescription>Add items and services. GST is calculated per line item.</CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceItemsList
              items={items}
              onAddItem={addItem}
              onAddDeduction={addDeduction}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
              subtotal={subtotal}
              defaultGstTreatment={defaultGstTreatment}
            />
          </CardContent>
        </Card>

        {/* Deposit Calculator */}
        <DepositCalculator
          invoiceData={invoiceData}
          onUpdateInvoiceData={updateInvoiceData}
          total={total}
          depositAmount={depositAmount}
          remainingAmount={remainingAmount}
          showDepositSection={showDepositSection}
          onToggleDepositSection={setShowDepositSection}
        />

        {/* Total Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-end">
              <div className="w-72 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span className={cn(subtotal < 0 && 'text-red-600')}>
                    {subtotal < 0 ? '-' : ''}${Math.abs(subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>GST:</span>
                  <span className={cn(taxAmount < 0 && 'text-red-600')}>
                    {taxAmount < 0 ? '-' : ''}${Math.abs(taxAmount).toFixed(2)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span className={cn(total < 0 && 'text-red-600')}>
                    {total < 0 ? '-' : ''}${Math.abs(total).toFixed(2)}
                  </span>
                </div>
                {invoiceData.requireDeposit && (
                  <>
                    <div className="flex justify-between text-sm text-blue-600">
                      <span>Deposit Required:</span>
                      <span>${depositAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Remaining Balance:</span>
                      <span>${remainingAmount.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
            <CardDescription>Add any additional information or terms</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={invoiceData.notes}
              onChange={(e) => updateInvoiceData({ notes: e.target.value })}
              placeholder="Enter any additional notes or terms..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={resetForm}>
            Reset Form
          </Button>
          <Button type="button" variant="secondary" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('draft')}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button type="button" onClick={() => handleSubmit('sent')}>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        </div>
      </form>

      {/* Add Client Dialog */}
      <AddClientDialog
        open={showAddClientDialog}
        onOpenChange={setShowAddClientDialog}
        onClientCreated={handleClientCreated}
      />

      {/* Invoice Preview Dialog */}
      {renderPreview()}
    </div>
  );
};

export default RefactoredInvoiceForm;
