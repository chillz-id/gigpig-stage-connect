import React from 'react';
import { Invoice } from '@/types/invoice';
import { InvoiceTemplateConfig } from '@/types/invoiceTemplate';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MinimalCleanTemplateProps {
  invoice: Invoice;
  config: InvoiceTemplateConfig;
  isPreview?: boolean;
  className?: string;
}

export const MinimalCleanTemplate: React.FC<MinimalCleanTemplateProps> = ({
  invoice,
  config,
  isPreview = false,
  className,
}) => {
  const { branding, customizations } = config;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: customizations.currency,
      minimumFractionDigits: 2,
    }).format(amount);
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
        'invoice-template bg-white text-gray-900 p-12 max-w-4xl mx-auto',
        isPreview && 'scale-75 transform-gpu',
        className
      )}
      style={{
        fontFamily: branding.fonts.body,
        color: branding.colors.text,
        backgroundColor: branding.colors.background,
      }}
    >
      {/* Minimal Header */}
      <div className="invoice-header mb-16">
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div className="flex items-center space-x-6">
            {branding.header.showLogo && branding.logo && (
              <img
                src={branding.logo.url}
                alt="Company Logo"
                className="h-8 w-auto opacity-80"
                style={{
                  maxWidth: branding.logo.maxWidth,
                  maxHeight: branding.logo.maxHeight,
                }}
              />
            )}
            {branding.header.showCompanyInfo && (
              <div>
                <h1 className="text-lg font-medium mb-1" style={{ fontFamily: branding.fonts.heading }}>
                  {invoice.sender_name || 'Stand Up Sydney'}
                </h1>
                <div className="text-xs space-y-0.5 text-gray-500">
                  <p>{invoice.sender_email}</p>
                  {invoice.sender_phone && <p>{invoice.sender_phone}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Title */}
          <div className="text-right">
            <h2 
              className="text-2xl font-light mb-1 tracking-wide"
              style={{ 
                fontFamily: branding.fonts.heading,
                color: branding.colors.primary,
              }}
            >
              Invoice
            </h2>
            <p className="text-sm text-gray-500">{invoice.invoice_number}</p>
          </div>
        </div>
      </div>

      {/* Minimal Invoice Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Bill To */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">Billed To</p>
          {recipient && (
            <div className="space-y-1">
              <p className="font-medium">{recipient.recipient_name}</p>
              <p className="text-sm text-gray-600">{recipient.recipient_email}</p>
              {recipient.recipient_phone && <p className="text-sm text-gray-600">{recipient.recipient_phone}</p>}
              {recipient.recipient_address && <p className="text-sm text-gray-600">{recipient.recipient_address}</p>}
              {recipient.recipient_abn && <p className="text-sm text-gray-600">ABN: {recipient.recipient_abn}</p>}
            </div>
          )}
        </div>

        {/* Invoice Info */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">Invoice Information</p>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Issue Date</span>
              <span className="text-sm font-medium">{formatDate(invoice.issue_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Due Date</span>
              <span className="text-sm font-medium">{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <span className="text-sm font-medium capitalize">{invoice.status}</span>
            </div>
            {invoice.event_date && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Event Date</span>
                <span className="text-sm font-medium">{formatDate(invoice.event_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Minimal Items */}
      <div className="mb-16">
        <div className="border-b border-gray-200 pb-4 mb-8">
          <div className="grid grid-cols-12 gap-4 text-xs uppercase tracking-wide text-gray-400">
            {customizations.showLineNumbers && (
              <div className="col-span-1">#</div>
            )}
            <div className={customizations.showLineNumbers ? "col-span-6" : "col-span-7"}>Description</div>
            <div className="col-span-1 text-center">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-12 gap-4 items-center">
            {customizations.showLineNumbers && (
              <div className="col-span-1 text-sm text-gray-500">1</div>
            )}
            <div className={customizations.showLineNumbers ? "col-span-6" : "col-span-7"}>
              <p className="font-medium">Comedy Performance</p>
              <p className="text-sm text-gray-500">Professional live comedy show</p>
            </div>
            <div className="col-span-1 text-center text-sm">1</div>
            <div className="col-span-2 text-right text-sm">{formatCurrency(invoice.total_amount)}</div>
            <div className="col-span-2 text-right font-medium">{formatCurrency(invoice.total_amount)}</div>
          </div>
        </div>
      </div>

      {/* Minimal Totals */}
      <div className="flex justify-end mb-16">
        <div className="w-full max-w-xs">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
            {customizations.showTaxBreakdown && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">GST (10%)</span>
                <span>{formatCurrency(invoice.total_amount * 0.1)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between">
                <span className="font-medium">Total</span>
                <span className="font-bold text-lg" style={{ color: branding.colors.primary }}>
                  {formatCurrency(invoice.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* Deposit Information */}
          {depositAmount > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">Deposit Required</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Deposit Amount</span>
                  <span className="font-medium">{formatCurrency(depositAmount)}</span>
                </div>
                {invoice.deposit_due_date && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Due Date</span>
                    <span className="font-medium">{formatDate(invoice.deposit_due_date)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="text-gray-600">Remaining Balance</span>
                  <span className="font-medium">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      {customizations.showPaymentTerms && (
        <div className="mb-12">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">Payment Terms</p>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Payment is due within 30 days of invoice date</p>
            <p>Late payments may incur additional fees</p>
            <p>Payment can be made via bank transfer or PayPal</p>
            {depositAmount > 0 && (
              <p>Deposit is required to secure booking</p>
            )}
          </div>
        </div>
      )}

      {/* Notes */}
      {customizations.showNotes && (
        <div className="mb-12">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">Notes</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Thank you for choosing Stand Up Sydney for your comedy entertainment needs. 
            We appreciate your business and look forward to working with you again.
          </p>
        </div>
      )}

      {/* Minimal Footer */}
      {branding.footer.showFooter && (
        <div className="invoice-footer border-t border-gray-200 pt-8 mt-12 text-center">
          <p className="text-xs text-gray-500">{branding.footer.text}</p>
        </div>
      )}
    </div>
  );
};