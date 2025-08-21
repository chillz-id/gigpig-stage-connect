import React from 'react';
import { Invoice } from '@/types/invoice';
import { InvoiceTemplateConfig } from '@/types/invoiceTemplate';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface StandUpSydneyTemplateProps {
  invoice: Invoice;
  config: InvoiceTemplateConfig;
  isPreview?: boolean;
  className?: string;
}

export const StandUpSydneyTemplate: React.FC<StandUpSydneyTemplateProps> = ({
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
        'invoice-template bg-white text-gray-900 max-w-4xl mx-auto overflow-hidden shadow-lg',
        isPreview && 'scale-75 transform-gpu',
        className
      )}
      style={{
        fontFamily: branding.fonts.body,
        color: branding.colors.text,
        backgroundColor: branding.colors.background,
      }}
    >
      {/* Stand Up Sydney Branded Header */}
      <div
        className="invoice-header p-8 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})`,
        }}
      >
        {/* Comedy-themed decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-4 border-white transform rotate-12"></div>
          <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full border-4 border-white transform -rotate-12"></div>
          <div className="absolute top-1/2 left-1/4 w-8 h-8 rounded-full bg-white transform -translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex justify-between items-start">
            {/* Company Branding */}
            <div className="flex items-center space-x-6">
              {branding.header.showLogo && branding.logo && (
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                  <img
                    src={branding.logo.url}
                    alt="Stand Up Sydney Logo"
                    className="h-12 w-auto"
                    style={{
                      maxWidth: branding.logo.maxWidth,
                      maxHeight: branding.logo.maxHeight,
                    }}
                  />
                </div>
              )}
              {branding.header.showCompanyInfo && (
                <div>
                  <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: branding.fonts.heading }}>
                    Stand Up Sydney
                  </h1>
                  <p className="text-lg opacity-90 mb-2">Comedy Entertainment</p>
                  <div className="text-sm space-y-0.5 opacity-80">
                    <p>{invoice.sender_email}</p>
                    {invoice.sender_phone && <p>{invoice.sender_phone}</p>}
                    {invoice.sender_address && <p>{invoice.sender_address}</p>}
                    {invoice.sender_abn && <p>ABN: {invoice.sender_abn}</p>}
                  </div>
                </div>
              )}
            </div>

            {/* Invoice Title with Brand Accent */}
            <div className="text-right">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg p-6">
                <h2 className="text-4xl font-bold mb-2" style={{ fontFamily: branding.fonts.heading }}>
                  INVOICE
                </h2>
                <p className="text-xl font-semibold opacity-90">{invoice.invoice_number}</p>
                <div className="mt-3 flex items-center justify-end space-x-2">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-8">
        {/* Two-column layout for branding */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Bill To Section */}
          <div>
            <div className="bg-gradient-to-r from-red-50 to-purple-50 rounded-lg p-6 border border-red-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-red-700">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                Bill To
              </h3>
              {recipient && (
                <div className="space-y-2">
                  <p className="font-bold text-lg text-gray-800">{recipient.recipient_name}</p>
                  <p className="text-gray-600">{recipient.recipient_email}</p>
                  {recipient.recipient_phone && <p className="text-gray-600">{recipient.recipient_phone}</p>}
                  {recipient.recipient_address && <p className="text-gray-600">{recipient.recipient_address}</p>}
                  {recipient.recipient_abn && <p className="text-gray-600">ABN: {recipient.recipient_abn}</p>}
                </div>
              )}
            </div>
          </div>

          {/* Invoice Details Section */}
          <div>
            <div className="bg-gradient-to-r from-purple-50 to-red-50 rounded-lg p-6 border border-purple-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-purple-700">
                <div className="w-4 h-4 bg-purple-500 rounded-full mr-3"></div>
                Invoice Details
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Issue Date:</span>
                  <span className="font-semibold">{formatDate(invoice.issue_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="font-semibold">{formatDate(invoice.due_date)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status:</span>
                  <span className={cn(
                    "font-semibold px-3 py-1 rounded-full text-sm",
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
                    <span className="font-semibold">{formatDate(invoice.event_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Comedy-themed Services Table */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-6 flex items-center text-gray-800">
            <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-purple-500 rounded-full mr-3"></div>
            Comedy Services
          </h3>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-purple-500 text-white">
              <div className="grid grid-cols-12 gap-4 p-4">
                {customizations.showLineNumbers && (
                  <div className="col-span-1 font-bold text-sm">#</div>
                )}
                <div className={customizations.showLineNumbers ? "col-span-6" : "col-span-7"}>
                  <div className="font-bold text-sm">Service Description</div>
                </div>
                <div className="col-span-1 text-center font-bold text-sm">Qty</div>
                <div className="col-span-2 text-right font-bold text-sm">Rate</div>
                <div className="col-span-2 text-right font-bold text-sm">Total</div>
              </div>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-12 gap-4 items-center">
                {customizations.showLineNumbers && (
                  <div className="col-span-1 text-gray-600 text-sm">1</div>
                )}
                <div className={customizations.showLineNumbers ? "col-span-6" : "col-span-7"}>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-red-400 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">😂</span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">Comedy Performance</p>
                      <p className="text-sm text-gray-600">Professional live comedy entertainment</p>
                    </div>
                  </div>
                </div>
                <div className="col-span-1 text-center font-semibold">1</div>
                <div className="col-span-2 text-right font-semibold">{formatCurrency(invoice.total_amount)}</div>
                <div className="col-span-2 text-right font-bold text-lg text-red-600">{formatCurrency(invoice.total_amount)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Branded Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="bg-gradient-to-br from-gray-50 to-red-50 rounded-lg p-6 w-full max-w-md border border-gray-200">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatCurrency(invoice.total_amount)}</span>
              </div>
              {customizations.showTaxBreakdown && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">GST (10%):</span>
                  <span className="font-semibold">{formatCurrency(invoice.total_amount * 0.1)}</span>
                </div>
              )}
              <div className="border-t-2 border-red-200 pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span className="text-gray-800">Total:</span>
                  <span className="text-red-600">{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
            </div>

            {/* Deposit Information */}
            {depositAmount > 0 && (
              <div className="mt-6 p-4 bg-gradient-to-r from-purple-100 to-red-100 rounded-lg border border-purple-200">
                <h4 className="font-bold mb-3 text-purple-700 flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                  Deposit Required
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Deposit Amount:</span>
                    <span className="font-semibold">{formatCurrency(depositAmount)}</span>
                  </div>
                  {invoice.deposit_due_date && (
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span className="font-semibold">{formatDate(invoice.deposit_due_date)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-purple-200">
                    <span>Remaining Balance:</span>
                    <span className="font-semibold">{formatCurrency(remainingAmount)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Branded Payment Terms */}
        {customizations.showPaymentTerms && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-purple-500 rounded-full mr-3"></div>
              Payment Terms
            </h3>
            <div className="bg-gradient-to-r from-red-50 to-purple-50 rounded-lg p-6 border border-red-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                  <span>Payment is due within 30 days of invoice date</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <span>Late payments may incur additional fees</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <span>Payment can be made via bank transfer or PayPal</span>
                </div>
                {depositAmount > 0 && (
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <span>Deposit is required to secure booking</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Branded Notes */}
        {customizations.showNotes && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
              <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-purple-500 rounded-full mr-3"></div>
              Notes
            </h3>
            <div className="bg-gradient-to-r from-red-50 to-purple-50 rounded-lg p-6 border border-red-200">
              <p className="text-sm leading-relaxed text-gray-700">
                🎭 Thank you for choosing Stand Up Sydney for your comedy entertainment needs! 
                We're excited to bring laughter to your event and appreciate your business. 
                If you have any questions about this invoice or need to discuss your event details, 
                please don't hesitate to reach out. We look forward to delivering an unforgettable comedy experience!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Stand Up Sydney Branded Footer */}
      {branding.footer.showFooter && (
        <div 
          className="invoice-footer p-6 text-center text-white"
          style={{
            background: `linear-gradient(135deg, ${branding.colors.primary}, ${branding.colors.secondary})`,
          }}
        >
          <div className="flex items-center justify-center space-x-4">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <p className="text-sm font-semibold">Stand Up Sydney - Making Sydney Laugh Since Day One!</p>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};