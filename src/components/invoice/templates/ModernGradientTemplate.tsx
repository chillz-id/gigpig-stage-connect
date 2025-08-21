import React from 'react';
import { Invoice } from '@/types/invoice';
import { InvoiceTemplateConfig } from '@/types/invoiceTemplate';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ModernGradientTemplateProps {
  invoice: Invoice;
  config: InvoiceTemplateConfig;
  isPreview?: boolean;
  className?: string;
}

export const ModernGradientTemplate: React.FC<ModernGradientTemplateProps> = ({
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
        'invoice-template bg-white text-gray-900 max-w-4xl mx-auto overflow-hidden shadow-2xl',
        isPreview && 'scale-75 transform-gpu',
        className
      )}
      style={{
        fontFamily: branding.fonts.body,
        color: branding.colors.text,
      }}
    >
      {/* Modern Gradient Header */}
      <div
        className="invoice-header p-8 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})`,
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full transform -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full transform translate-x-16 translate-y-16"></div>
        </div>

        <div className="relative z-10 flex justify-between items-start">
          {/* Company Info */}
          <div className="flex items-center space-x-4">
            {branding.header.showLogo && branding.logo && (
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                <img
                  src={branding.logo.url}
                  alt="Company Logo"
                  className="h-10 w-auto"
                  style={{
                    maxWidth: branding.logo.maxWidth,
                    maxHeight: branding.logo.maxHeight,
                  }}
                />
              </div>
            )}
            {branding.header.showCompanyInfo && (
              <div>
                <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: branding.fonts.heading }}>
                  {invoice.sender_name || 'Stand Up Sydney'}
                </h1>
                <div className="text-sm space-y-1 opacity-90">
                  <p>{invoice.sender_email}</p>
                  {invoice.sender_phone && <p>{invoice.sender_phone}</p>}
                  {invoice.sender_address && <p>{invoice.sender_address}</p>}
                  {invoice.sender_abn && <p>ABN: {invoice.sender_abn}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Invoice Title with Modern Design */}
          <div className="text-right">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
              <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: branding.fonts.heading }}>
                INVOICE
              </h2>
              <p className="text-xl font-semibold opacity-90">{invoice.invoice_number}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8">
        {/* Invoice Details with Modern Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Bill To Card */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: branding.colors.primary }}>
              <div className="w-3 h-3 bg-current rounded-full mr-3"></div>
              Bill To
            </h3>
            {recipient && (
              <div className="space-y-2">
                <p className="font-medium text-lg">{recipient.recipient_name}</p>
                <p className="text-gray-600">{recipient.recipient_email}</p>
                {recipient.recipient_phone && <p className="text-gray-600">{recipient.recipient_phone}</p>}
                {recipient.recipient_address && <p className="text-gray-600">{recipient.recipient_address}</p>}
                {recipient.recipient_abn && <p className="text-gray-600">ABN: {recipient.recipient_abn}</p>}
              </div>
            )}
          </div>

          {/* Invoice Info Card */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: branding.colors.primary }}>
              <div className="w-3 h-3 bg-current rounded-full mr-3"></div>
              Invoice Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Issue Date:</span>
                <span className="font-medium">{formatDate(invoice.issue_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">{formatDate(invoice.due_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={cn(
                  "font-medium px-2 py-1 rounded-full text-xs",
                  invoice.status === 'paid' && "bg-green-100 text-green-800",
                  invoice.status === 'sent' && "bg-blue-100 text-blue-800",
                  invoice.status === 'draft' && "bg-gray-100 text-gray-800",
                  invoice.status === 'overdue' && "bg-red-100 text-red-800"
                )}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
              {invoice.event_date && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Event Date:</span>
                  <span className="font-medium">{formatDate(invoice.event_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Items Table */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-6 flex items-center" style={{ color: branding.colors.primary }}>
            <div className="w-4 h-4 bg-current rounded-full mr-3"></div>
            Services
          </h3>
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead style={{ backgroundColor: branding.colors.primary }}>
                <tr className="text-white">
                  {customizations.showLineNumbers && (
                    <th className="text-left py-4 px-6 font-semibold">#</th>
                  )}
                  <th className="text-left py-4 px-6 font-semibold">Description</th>
                  <th className="text-center py-4 px-6 font-semibold">Qty</th>
                  <th className="text-right py-4 px-6 font-semibold">Rate</th>
                  <th className="text-right py-4 px-6 font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200">
                  {customizations.showLineNumbers && (
                    <td className="py-4 px-6 text-sm text-gray-600">1</td>
                  )}
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-lg">Comedy Performance</p>
                      <p className="text-sm text-gray-600">Live comedy show performance</p>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-center font-medium">1</td>
                  <td className="py-4 px-6 text-right font-medium">{formatCurrency(invoice.total_amount)}</td>
                  <td className="py-4 px-6 text-right font-bold text-lg">{formatCurrency(invoice.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Modern Totals Card */}
        <div className="flex justify-end mb-8">
          <div className="bg-gray-50 rounded-lg p-6 w-full max-w-md">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {customizations.showTaxBreakdown && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST (10%):</span>
                  <span className="font-medium">{formatCurrency(invoice.total_amount * 0.1)}</span>
                </div>
              )}
              <div 
                className="flex justify-between items-center text-xl font-bold border-t pt-3"
                style={{ borderColor: branding.colors.border }}
              >
                <span>Total:</span>
                <span style={{ color: branding.colors.primary }}>{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>

            {/* Deposit Information */}
            {depositAmount > 0 && (
              <div 
                className="mt-6 p-4 rounded-lg"
                style={{ backgroundColor: branding.colors.primary + '10' }}
              >
                <h4 className="font-semibold mb-3" style={{ color: branding.colors.primary }}>
                  Deposit Required
                </h4>
                <div className="space-y-2 text-sm">
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

        {/* Payment Terms in Modern Style */}
        {customizations.showPaymentTerms && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: branding.colors.primary }}>
              <div className="w-3 h-3 bg-current rounded-full mr-3"></div>
              Payment Terms
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-current rounded-full mr-3" style={{ color: branding.colors.accent }}></div>
                  Payment is due within 30 days of invoice date
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-current rounded-full mr-3" style={{ color: branding.colors.accent }}></div>
                  Late payments may incur additional fees
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-current rounded-full mr-3" style={{ color: branding.colors.accent }}></div>
                  Payment can be made via bank transfer or PayPal
                </div>
                {depositAmount > 0 && (
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-current rounded-full mr-3" style={{ color: branding.colors.accent }}></div>
                    Deposit is required to secure booking
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes in Modern Style */}
        {customizations.showNotes && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: branding.colors.primary }}>
              <div className="w-3 h-3 bg-current rounded-full mr-3"></div>
              Notes
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm leading-relaxed">
                Thank you for choosing Stand Up Sydney for your comedy entertainment needs. 
                We appreciate your business and look forward to working with you again.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modern Footer */}
      {branding.footer.showFooter && (
        <div 
          className="invoice-footer p-6 text-center"
          style={{
            background: `linear-gradient(135deg, ${branding.colors.primary}15, ${branding.colors.secondary}15)`,
            color: branding.footer.textColor,
          }}
        >
          <p className="text-sm font-medium">{branding.footer.text}</p>
        </div>
      )}
    </div>
  );
};