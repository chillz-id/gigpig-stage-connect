import React from 'react';
import { Invoice } from '@/types/invoice';
import { InvoiceTemplateConfig } from '@/types/invoiceTemplate';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ClassicProfessionalTemplateProps {
  invoice: Invoice;
  config: InvoiceTemplateConfig;
  isPreview?: boolean;
  className?: string;
}

export const ClassicProfessionalTemplate: React.FC<ClassicProfessionalTemplateProps> = ({
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
        'invoice-template bg-white text-gray-900 p-8 max-w-4xl mx-auto border border-gray-300',
        isPreview && 'scale-75 transform-gpu',
        className
      )}
      style={{
        fontFamily: branding.fonts.body,
        color: branding.colors.text,
        backgroundColor: branding.colors.background,
      }}
    >
      {/* Classic Header */}
      <div className="invoice-header border-b-2 border-gray-800 pb-6 mb-8">
        <div className="flex justify-between items-start">
          {/* Company Info */}
          <div className="flex items-start space-x-4">
            {branding.header.showLogo && branding.logo && (
              <img
                src={branding.logo.url}
                alt="Company Logo"
                className="h-16 w-auto"
                style={{
                  maxWidth: branding.logo.maxWidth,
                  maxHeight: branding.logo.maxHeight,
                }}
              />
            )}
            {branding.header.showCompanyInfo && (
              <div>
                <h1 className="text-2xl font-bold mb-2 tracking-wide" style={{ fontFamily: branding.fonts.heading }}>
                  {invoice.sender_name || 'Stand Up Sydney'}
                </h1>
                <div className="text-sm space-y-1 text-gray-700">
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
              className="text-3xl font-bold mb-2 tracking-wider"
              style={{ 
                fontFamily: branding.fonts.heading,
                color: branding.colors.primary,
              }}
            >
              INVOICE
            </h2>
            <div className="text-right">
              <p className="text-lg font-semibold">{invoice.invoice_number}</p>
              <p className="text-sm text-gray-600 mt-1">Original</p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Information Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Bill To */}
        <div>
          <div className="bg-gray-50 border border-gray-300 p-4">
            <h3 className="text-sm font-bold mb-3 text-gray-700 uppercase tracking-wide">
              Bill To
            </h3>
            {recipient && (
              <div className="space-y-1">
                <p className="font-bold text-lg">{recipient.recipient_name}</p>
                <p className="text-sm">{recipient.recipient_email}</p>
                {recipient.recipient_phone && <p className="text-sm">{recipient.recipient_phone}</p>}
                {recipient.recipient_address && <p className="text-sm">{recipient.recipient_address}</p>}
                {recipient.recipient_abn && <p className="text-sm">ABN: {recipient.recipient_abn}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details */}
        <div>
          <div className="bg-gray-50 border border-gray-300">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100">Issue Date</td>
                  <td className="py-2 px-4 text-sm">{formatDate(invoice.issue_date)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100">Due Date</td>
                  <td className="py-2 px-4 text-sm">{formatDate(invoice.due_date)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100">Status</td>
                  <td className="py-2 px-4 text-sm font-bold uppercase">{invoice.status}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100">Currency</td>
                  <td className="py-2 px-4 text-sm">{customizations.currency}</td>
                </tr>
                {invoice.event_date && (
                  <tr>
                    <td className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100">Event Date</td>
                    <td className="py-2 px-4 text-sm">{formatDate(invoice.event_date)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Classic Items Table */}
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-gray-700 uppercase tracking-wide">
          Description of Services
        </h3>
        <div className="border border-gray-300">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                {customizations.showLineNumbers && (
                  <th className="border-b border-gray-300 py-3 px-4 text-left text-sm font-bold text-gray-700">Item</th>
                )}
                <th className="border-b border-gray-300 py-3 px-4 text-left text-sm font-bold text-gray-700">Description</th>
                <th className="border-b border-gray-300 py-3 px-4 text-center text-sm font-bold text-gray-700">Quantity</th>
                <th className="border-b border-gray-300 py-3 px-4 text-right text-sm font-bold text-gray-700">Unit Price</th>
                <th className="border-b border-gray-300 py-3 px-4 text-right text-sm font-bold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {customizations.showLineNumbers && (
                  <td className="border-b border-gray-300 py-4 px-4 text-sm font-medium">1</td>
                )}
                <td className="border-b border-gray-300 py-4 px-4">
                  <div>
                    <p className="font-semibold">Comedy Performance</p>
                    <p className="text-sm text-gray-600">Professional live comedy show performance</p>
                  </div>
                </td>
                <td className="border-b border-gray-300 py-4 px-4 text-center font-medium">1</td>
                <td className="border-b border-gray-300 py-4 px-4 text-right font-medium">{formatCurrency(invoice.total_amount)}</td>
                <td className="border-b border-gray-300 py-4 px-4 text-right font-bold">{formatCurrency(invoice.total_amount)}</td>
              </tr>
              {/* Empty rows for classic invoice look */}
              {[...Array(3)].map((_, index) => (
                <tr key={index}>
                  {customizations.showLineNumbers && (
                    <td className="border-b border-gray-300 py-4 px-4 text-sm">&nbsp;</td>
                  )}
                  <td className="border-b border-gray-300 py-4 px-4">&nbsp;</td>
                  <td className="border-b border-gray-300 py-4 px-4 text-center">&nbsp;</td>
                  <td className="border-b border-gray-300 py-4 px-4 text-right">&nbsp;</td>
                  <td className="border-b border-gray-300 py-4 px-4 text-right">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Classic Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-sm">
          <div className="border border-gray-300">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100">Subtotal</td>
                  <td className="py-2 px-4 text-sm text-right">{formatCurrency(invoice.total_amount)}</td>
                </tr>
                {customizations.showTaxBreakdown && (
                  <tr className="border-b border-gray-300">
                    <td className="py-2 px-4 text-sm font-semibold text-gray-700 bg-gray-100">GST (10%)</td>
                    <td className="py-2 px-4 text-sm text-right">{formatCurrency(invoice.total_amount * 0.1)}</td>
                  </tr>
                )}
                <tr className="bg-gray-700 text-white">
                  <td className="py-3 px-4 text-sm font-bold">TOTAL</td>
                  <td className="py-3 px-4 text-right font-bold text-lg">{formatCurrency(invoice.total_amount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Deposit Information */}
          {depositAmount > 0 && (
            <div className="mt-6 border border-gray-300 bg-gray-50 p-4">
              <h4 className="font-bold mb-3 text-gray-700 uppercase tracking-wide text-sm">
                Deposit Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Deposit Required:</span>
                  <span className="font-semibold">{formatCurrency(depositAmount)}</span>
                </div>
                {invoice.deposit_due_date && (
                  <div className="flex justify-between">
                    <span>Due Date:</span>
                    <span className="font-semibold">{formatDate(invoice.deposit_due_date)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span>Remaining Balance:</span>
                  <span className="font-semibold">{formatCurrency(remainingAmount)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Terms */}
      {customizations.showPaymentTerms && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-700 uppercase tracking-wide">
            Terms and Conditions
          </h3>
          <div className="border border-gray-300 bg-gray-50 p-4">
            <div className="text-sm space-y-2">
              <p><strong>1.</strong> Payment is due within 30 days of invoice date</p>
              <p><strong>2.</strong> Late payments may incur additional fees</p>
              <p><strong>3.</strong> Payment can be made via bank transfer or PayPal</p>
              {depositAmount > 0 && (
                <p><strong>4.</strong> Deposit is required to secure booking</p>
              )}
              <p><strong>5.</strong> All services are subject to availability</p>
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {customizations.showNotes && (
        <div className="mb-8">
          <h3 className="text-lg font-bold mb-4 text-gray-700 uppercase tracking-wide">
            Additional Notes
          </h3>
          <div className="border border-gray-300 bg-gray-50 p-4">
            <p className="text-sm leading-relaxed">
              Thank you for choosing Stand Up Sydney for your comedy entertainment needs. 
              We appreciate your business and look forward to working with you again. 
              Please do not hesitate to contact us if you have any questions regarding this invoice.
            </p>
          </div>
        </div>
      )}

      {/* Classic Footer */}
      {branding.footer.showFooter && (
        <div className="invoice-footer border-t-2 border-gray-800 pt-6 mt-8 text-center">
          <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            {branding.footer.text}
          </p>
        </div>
      )}
    </div>
  );
};