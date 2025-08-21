import React from 'react';
import { Invoice, InvoiceRecipient } from '@/types/invoice';
import { InvoiceTemplateConfig } from '@/types/invoiceTemplate';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BaseInvoiceTemplateProps {
  invoice: Invoice;
  config: InvoiceTemplateConfig;
  isPreview?: boolean;
  className?: string;
}

export const BaseInvoiceTemplate: React.FC<BaseInvoiceTemplateProps> = ({
  invoice,
  config,
  isPreview = false,
  className,
}) => {
  const { template, branding, customizations } = config;
  
  const formatCurrency = (amount: number) => {
    const currencySymbol = customizations.currency === 'AUD' ? '$' : customizations.currency;
    const formatted = new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: customizations.currency,
      minimumFractionDigits: 2,
    }).format(amount);
    
    return formatted;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    switch (customizations.dateFormat) {
      case 'DD/MM/YYYY':
        return format(date, 'dd/MM/yyyy');
      case 'MM/DD/YYYY':
        return format(date, 'MM/dd/yyyy');
      case 'YYYY-MM-DD':
        return format(date, 'yyyy-MM-dd');
      default:
        return format(date, 'dd/MM/yyyy');
    }
  };

  const recipient = invoice.invoice_recipients?.[0];
  const depositAmount = invoice.deposit_amount || 
    (invoice.deposit_percentage && invoice.total_amount 
      ? (invoice.total_amount * invoice.deposit_percentage / 100) 
      : 0);
  
  const remainingAmount = invoice.total_amount - depositAmount;

  return (
    <div
      className={cn(
        'invoice-template bg-white text-gray-900 p-8 max-w-4xl mx-auto',
        isPreview && 'scale-75 transform-gpu',
        className
      )}
      style={{
        fontFamily: branding.fonts.body,
        color: branding.colors.text,
        backgroundColor: branding.colors.background,
      }}
    >
      {/* Header */}
      <div
        className="invoice-header border-b-2 pb-6 mb-8"
        style={{
          backgroundColor: branding.header.backgroundColor,
          color: branding.header.textColor,
          borderColor: branding.header.borderColor,
        }}
      >
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div className="flex items-center space-x-4">
            {branding.header.showLogo && branding.logo && (
              <img
                src={branding.logo.url}
                alt="Company Logo"
                className="h-12 w-auto"
                style={{
                  maxWidth: branding.logo.maxWidth,
                  maxHeight: branding.logo.maxHeight,
                }}
              />
            )}
            {branding.header.showCompanyInfo && (
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: branding.fonts.heading }}>
                  {invoice.sender_name || 'Stand Up Sydney'}
                </h1>
                <div className="text-sm space-y-1 opacity-80">
                  <p>{invoice.sender_email}</p>
                  {invoice.sender_phone && <p>{invoice.sender_phone}</p>}
                  {invoice.sender_address && <p>{invoice.sender_address}</p>}
                  {invoice.sender_abn && <p>ABN: {invoice.sender_abn}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Title */}
          <div className="text-right">
            <h2 
              className="text-3xl font-bold mb-2"
              style={{ 
                fontFamily: branding.fonts.heading,
                color: branding.colors.primary,
              }}
            >
              INVOICE
            </h2>
            <p className="text-lg font-semibold">{invoice.invoice_number}</p>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: branding.colors.primary }}>
            Bill To
          </h3>
          {recipient && (
            <div className="space-y-1">
              <p className="font-medium">{recipient.recipient_name}</p>
              <p>{recipient.recipient_email}</p>
              {recipient.recipient_phone && <p>{recipient.recipient_phone}</p>}
              {recipient.recipient_address && <p>{recipient.recipient_address}</p>}
              {recipient.recipient_abn && <p>ABN: {recipient.recipient_abn}</p>}
            </div>
          )}
        </div>

        {/* Invoice Info */}
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color: branding.colors.primary }}>
            Invoice Details
          </h3>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Issue Date:</span>
              <span className="font-medium">{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Due Date:</span>
              <span className="font-medium">{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="font-medium capitalize">{invoice.status}</span>
            </div>
            {invoice.event_date && (
              <div className="flex justify-between">
                <span>Event Date:</span>
                <span className="font-medium">{formatDate(invoice.event_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4" style={{ color: branding.colors.primary }}>
          Services
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2" style={{ borderColor: branding.colors.border }}>
                {customizations.showLineNumbers && (
                  <th className="text-left py-2 px-3 font-semibold">#</th>
                )}
                <th className="text-left py-2 px-3 font-semibold">Description</th>
                <th className="text-center py-2 px-3 font-semibold">Qty</th>
                <th className="text-right py-2 px-3 font-semibold">Rate</th>
                <th className="text-right py-2 px-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Mock invoice items since we don't have the actual items structure */}
              <tr className="border-b" style={{ borderColor: branding.colors.border }}>
                {customizations.showLineNumbers && (
                  <td className="py-3 px-3 text-sm">1</td>
                )}
                <td className="py-3 px-3">
                  <div>
                    <p className="font-medium">Comedy Performance</p>
                    <p className="text-sm text-gray-600">Live comedy show performance</p>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">1</td>
                <td className="py-3 px-3 text-right">{formatCurrency(invoice.total_amount)}</td>
                <td className="py-3 px-3 text-right font-medium">{formatCurrency(invoice.total_amount)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-md">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
            {customizations.showTaxBreakdown && (
              <div className="flex justify-between">
                <span>GST (10%):</span>
                <span>{formatCurrency(invoice.total_amount * 0.1)}</span>
              </div>
            )}
            <div 
              className="flex justify-between text-lg font-bold border-t pt-2"
              style={{ borderColor: branding.colors.border }}
            >
              <span>Total:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>

          {/* Deposit Information */}
          {depositAmount > 0 && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2" style={{ color: branding.colors.primary }}>
                Deposit Required
              </h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Deposit Amount:</span>
                  <span className="font-medium">{formatCurrency(depositAmount)}</span>
                </div>
                {invoice.deposit_due_date && (
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span className="font-medium">{formatDate(invoice.deposit_due_date)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span>Remaining Balance:</span>
                  <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      {customizations.showPaymentTerms && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3" style={{ color: branding.colors.primary }}>
            Payment Terms
          </h3>
          <div className="text-sm space-y-2">
            <p>• Payment is due within 30 days of invoice date</p>
            <p>• Late payments may incur additional fees</p>
            <p>• Payment can be made via bank transfer or PayPal</p>
            {depositAmount > 0 && (
              <p>• Deposit is required to secure booking</p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {customizations.showNotes && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3" style={{ color: branding.colors.primary }}>
            Notes
          </h3>
          <div className="text-sm">
            <p>Thank you for choosing Stand Up Sydney for your comedy entertainment needs. We appreciate your business and look forward to working with you again.</p>
          </div>
        </div>
      )}

      {/* Footer */}
      {branding.footer.showFooter && (
        <div 
          className="invoice-footer border-t pt-6 mt-8 text-center"
          style={{
            backgroundColor: branding.footer.backgroundColor,
            color: branding.footer.textColor,
            borderColor: branding.footer.borderColor,
          }}
        >
          <p className="text-sm">{branding.footer.text}</p>
        </div>
      )}
    </div>
  );
};