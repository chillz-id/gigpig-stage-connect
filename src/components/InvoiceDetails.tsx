
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, CreditCard, Download, Send, Loader2, Mail, Phone, Hash, Building2, User, RefreshCw } from 'lucide-react';
import { usePDFGeneration } from '@/hooks/usePDFGeneration';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  subtotal: number | null;
  tax_amount: number | null;
  total_price: number;
}

interface Invoice {
  id: string;
  number: string;
  clientName: string;
  amount: number;
  status: string;
  dueDate: string;
  createdDate: string;
  clientEmail?: string;
  clientAddress?: string;
  description?: string;
  // Additional fields from DB
  invoice_number?: string;
  sender_name?: string;
  sender_email?: string;
  sender_phone?: string;
  sender_address?: string;
  sender_abn?: string;
  created_by?: string;
  invoice_recipients?: Array<{
    recipient_name: string;
    recipient_email: string;
    recipient_phone?: string;
    recipient_address?: string;
    recipient_abn?: string;
    avatar_url?: string;
  }>;
  subtotal?: number;
  tax_amount?: number;
  total_amount?: number;
  notes?: string;
}

interface InvoiceDetailsProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  isOpen,
  onClose
}) => {
  const { isGenerating, generatePDF } = usePDFGeneration();
  const { sendInvoiceReminder, resendInvoice } = useInvoiceOperations();
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Fetch real invoice items from database
  const { data: invoiceItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['invoice-items', invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return [];
      const { data, error } = await supabase
        .from('invoice_items')
        .select('id, description, quantity, unit_price, subtotal, tax_amount, total_price')
        .eq('invoice_id', invoice.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching invoice items:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!invoice?.id && isOpen,
  });

  // Fetch sender's profile for avatar
  const { data: senderProfile } = useQuery({
    queryKey: ['sender-profile', invoice?.created_by],
    queryFn: async () => {
      if (!invoice?.created_by) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, first_name, last_name')
        .eq('id', invoice.created_by)
        .single();

      if (error) {
        console.error('Error fetching sender profile:', error);
        return null;
      }
      return data;
    },
    enabled: !!invoice?.created_by && isOpen,
  });

  // Fetch recipient's avatar/logo - try organization_profiles first (has actual logos)
  const recipientEmail = invoice?.invoice_recipients?.[0]?.recipient_email;
  const recipientName = invoice?.invoice_recipients?.[0]?.recipient_name;
  const { data: recipientAvatar } = useQuery({
    queryKey: ['recipient-avatar', recipientEmail, recipientName],
    queryFn: async () => {
      if (!recipientEmail && !recipientName) return null;

      // Try organization_profiles first (has the actual logos)
      if (recipientEmail) {
        const { data: orgProfileByEmail } = await supabase
          .from('organization_profiles')
          .select('logo_url, organization_name')
          .eq('contact_email', recipientEmail)
          .limit(1)
          .maybeSingle();
        if (orgProfileByEmail?.logo_url) return { avatar_url: orgProfileByEmail.logo_url };
      }

      if (recipientName) {
        const { data: orgProfileByName } = await supabase
          .from('organization_profiles')
          .select('logo_url, organization_name')
          .ilike('organization_name', `%${recipientName}%`)
          .limit(1)
          .maybeSingle();
        if (orgProfileByName?.logo_url) return { avatar_url: orgProfileByName.logo_url };
      }

      // Try profile by email
      if (recipientEmail) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('email', recipientEmail)
          .limit(1)
          .maybeSingle();
        if (profile?.avatar_url) return { avatar_url: profile.avatar_url };
      }

      return null;
    },
    enabled: (!!recipientEmail || !!recipientName) && isOpen,
  });

  // Helper to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!invoice) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleDownloadPDF = async () => {
    // Get recipient info from invoice
    const recipient = invoice.invoice_recipients?.[0];

    // Calculate totals from items
    const calcSubtotal = invoice.subtotal ?? invoiceItems.reduce((sum, item) => sum + (item.subtotal || item.quantity * item.unit_price), 0);
    const calcTax = invoice.tax_amount ?? invoiceItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
    const calcTotal = invoice.total_amount || invoice.amount;

    // Format items for PDF
    const pdfItems = invoiceItems.map(item => ({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal || item.quantity * item.unit_price,
      tax_amount: item.tax_amount || 0,
      total: item.total_price,
    }));

    // Convert invoice format for PDF generation
    const formattedInvoice = {
      id: invoice.id,
      invoice_number: invoice.invoice_number || invoice.number,
      issue_date: invoice.createdDate,
      due_date: invoice.dueDate,
      status: invoice.status,
      total_amount: calcTotal,
      subtotal: calcSubtotal,
      tax_amount: calcTax,
      tax_rate: 10,
      currency: 'AUD',
      sender_name: invoice.sender_name || 'GigPigs',
      sender_email: invoice.sender_email || '',
      sender_phone: invoice.sender_phone || '',
      sender_address: invoice.sender_address || '',
      sender_abn: invoice.sender_abn || '',
      // Bank details for Payment Details section
      sender_bank_name: invoice.sender_bank_name || '',
      sender_bank_bsb: invoice.sender_bank_bsb || '',
      sender_bank_account: invoice.sender_bank_account || '',
      invoice_items: pdfItems,
      invoice_recipients: invoice.invoice_recipients || [{
        recipient_name: invoice.clientName,
        recipient_email: invoice.clientEmail || '',
        recipient_phone: undefined,
      }],
      notes: invoice.notes || invoice.description || '',
    };

    await generatePDF(formattedInvoice as any, pdfItems);
  };

  // Calculate totals from real items - use invoice values if available, otherwise calculate from items
  const subtotal = invoice.subtotal ?? invoiceItems.reduce((sum, item) => sum + (item.subtotal || item.quantity * item.unit_price), 0);
  const tax = invoice.tax_amount ?? invoiceItems.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const total = invoice.total_amount || invoice.amount;

  // Get recipient info for display
  const recipient = invoice.invoice_recipients?.[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Invoice {invoice.invoice_number || invoice.number}</span>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Invoice details and payment information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Bill From / Bill To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bill From */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Bill From:
              </h4>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={senderProfile?.avatar_url || undefined} alt={invoice.sender_name || 'Sender'} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(invoice.sender_name || 'GP')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{invoice.sender_name || 'GigPigs'}</p>
                  {invoice.sender_email && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{invoice.sender_email}</span>
                    </p>
                  )}
                  {invoice.sender_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 shrink-0" />
                      {invoice.sender_phone}
                    </p>
                  )}
                  {invoice.sender_address && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{invoice.sender_address}</span>
                    </p>
                  )}
                  {invoice.sender_abn && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3 shrink-0" />
                      ABN: {invoice.sender_abn}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Bill To:
              </h4>
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage
                    src={recipientAvatar?.avatar_url || recipient?.avatar_url || undefined}
                    alt={recipient?.recipient_name || invoice.clientName}
                  />
                  <AvatarFallback className="bg-secondary/50">
                    {getInitials(recipient?.recipient_name || invoice.clientName || 'NA')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{recipient?.recipient_name || invoice.clientName}</p>
                  {(recipient?.recipient_email || invoice.clientEmail) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{recipient?.recipient_email || invoice.clientEmail}</span>
                    </p>
                  )}
                  {recipient?.recipient_phone && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3 shrink-0" />
                      {recipient.recipient_phone}
                    </p>
                  )}
                  {(recipient?.recipient_address || invoice.clientAddress) && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{recipient?.recipient_address || invoice.clientAddress}</span>
                    </p>
                  )}
                  {recipient?.recipient_abn && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hash className="w-3 h-3 shrink-0" />
                      ABN: {recipient.recipient_abn}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Invoice Info */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Created: {invoice.createdDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Due: {invoice.dueDate}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Amount</div>
              <div className="text-2xl font-bold">${total.toFixed(2)}</div>
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <h4 className="font-semibold mb-3">Items</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Description</th>
                    <th className="text-center p-3">Qty</th>
                    <th className="text-right p-3">Rate</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {itemsLoading ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Loading items...
                      </td>
                    </tr>
                  ) : invoiceItems.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-muted-foreground">
                        No items found
                      </td>
                    </tr>
                  ) : (
                    invoiceItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3">{item.description}</td>
                        <td className="text-center p-3">{item.quantity}</td>
                        <td className="text-right p-3">${item.unit_price.toFixed(2)}</td>
                        <td className="text-right p-3">${item.total_price.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between">
                  <span>GST (10%):</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <div className="space-x-2">
              <Button
                className="professional-button flex items-center gap-2"
                onClick={handleDownloadPDF}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isGenerating ? 'Generating...' : 'Download PDF'}
              </Button>
              {invoice.status === 'sent' || invoice.status === 'overdue' ? (
                <Button
                  className="professional-button flex items-center gap-2"
                  onClick={async () => {
                    if (!invoice.id) return;
                    setIsSendingReminder(true);
                    try {
                      await sendInvoiceReminder.mutateAsync({ invoiceId: invoice.id });
                    } finally {
                      setIsSendingReminder(false);
                    }
                  }}
                  disabled={isSendingReminder}
                >
                  {isSendingReminder ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isSendingReminder ? 'Sending...' : 'Send Reminder'}
                </Button>
              ) : invoice.status === 'draft' ? (
                <Button
                  className="professional-button flex items-center gap-2"
                  onClick={async () => {
                    if (!invoice.id) return;
                    setIsResending(true);
                    try {
                      await resendInvoice.mutateAsync({ invoiceId: invoice.id, attachPdf: true });
                    } finally {
                      setIsResending(false);
                    }
                  }}
                  disabled={isResending}
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isResending ? 'Sending...' : 'Send Invoice'}
                </Button>
              ) : null}
              {invoice.status === 'sent' && (
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={async () => {
                    if (!invoice.id) return;
                    setIsResending(true);
                    try {
                      await resendInvoice.mutateAsync({ invoiceId: invoice.id, attachPdf: true });
                    } finally {
                      setIsResending(false);
                    }
                  }}
                  disabled={isResending}
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isResending ? 'Resending...' : 'Resend'}
                </Button>
              )}
            </div>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
