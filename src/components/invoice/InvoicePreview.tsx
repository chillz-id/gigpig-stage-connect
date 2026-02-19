import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import {
  Printer,
  Download,
  Edit,
  Send,
  Save,
  Eye,
  FileText,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Hash,
  Clock,
  Percent,
  Receipt,
  Building2,
  CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
  isDeduction?: boolean;
  gstTreatment?: 'gst_included' | 'gst_excluded' | 'no_gst';
}

interface InvoicePreviewData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientABN?: string;
  clientAvatarUrl?: string | null;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  senderAddress?: string;
  senderABN?: string;
  senderAvatarUrl?: string | null;
  // Bank details for payment
  senderBankName?: string;
  senderBankBsb?: string;
  senderBankAccount?: string;
  invoiceNumber?: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  taxRate: number;
  notes?: string;
  status: 'draft' | 'sent' | 'paid';
  currency?: string;
  // Deposit fields
  requireDeposit: boolean;
  depositType: 'amount' | 'percentage';
  depositAmount: number;
  depositPercentage: number;
  depositDueDaysBeforeEvent: number;
  eventDate?: Date;
}

interface InvoicePreviewProps {
  open: boolean;
  onClose: () => void;
  invoiceData: InvoicePreviewData;
  onEdit?: () => void;
  onSave?: (status: 'draft' | 'sent') => void;
  onPrint?: () => void;
  onDownload?: () => void;
  isEditing?: boolean;
  showActions?: boolean;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  open,
  onClose,
  invoiceData,
  onEdit,
  onSave,
  onPrint,
  onDownload,
  isEditing = false,
  showActions = true
}) => {
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Calculate totals (accounting for deductions as negative amounts)
  const subtotal = invoiceData.items.reduce((sum, item) => {
    const amount = item.isDeduction ? -Math.abs(item.total) : item.total;
    return sum + amount;
  }, 0);
  const taxAmount = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + taxAmount;
  
  // Calculate deposit amount
  const calculateDepositAmount = () => {
    if (!invoiceData.requireDeposit) return 0;
    if (invoiceData.depositType === 'amount') {
      return invoiceData.depositAmount;
    } else {
      return total * (invoiceData.depositPercentage / 100);
    }
  };
  
  const depositAmount = calculateDepositAmount();
  const remainingAmount = total - depositAmount;
  
  // Calculate deposit due date
  const calculateDepositDueDate = () => {
    if (!invoiceData.eventDate || !invoiceData.depositDueDaysBeforeEvent) return null;
    const dueDate = new Date(invoiceData.eventDate);
    dueDate.setDate(dueDate.getDate() - invoiceData.depositDueDaysBeforeEvent);
    return dueDate;
  };
  
  const depositDueDate = calculateDepositDueDate();

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
    onPrint?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const invoiceContent = (
    <div className={cn(
      "max-w-4xl mx-auto bg-white",
      isPrintMode ? "print:shadow-none" : "shadow-lg"
    )}>
      {/* Header */}
      <div className="p-8 border-b border-gray-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              GigPigs
            </h1>
            <p className="text-gray-600">Invoice</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span className="text-lg font-semibold text-gray-900">INVOICE</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Hash className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">
                {invoiceData.invoiceNumber || 'Draft Invoice'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-between items-center">
          <Badge className={cn("px-3 py-1 text-sm font-medium", getStatusColor(invoiceData.status))}>
            {invoiceData.status.toUpperCase()}
          </Badge>
          <div className="text-right text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Issue Date: {format(invoiceData.issueDate, 'MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-4 h-4" />
              <span>Due Date: {format(invoiceData.dueDate, 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill To / From */}
      <div className="p-8 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Bill From */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill From</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {invoiceData.senderAvatarUrl && (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={invoiceData.senderAvatarUrl} alt={invoiceData.senderName} />
                    <AvatarFallback>{invoiceData.senderName?.slice(0, 2).toUpperCase() || '?'}</AvatarFallback>
                  </Avatar>
                )}
                {invoiceData.senderName && (
                  <div className="font-medium text-gray-900">
                    {invoiceData.senderName}
                  </div>
                )}
              </div>
              {invoiceData.senderEmail && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{invoiceData.senderEmail}</span>
                </div>
              )}
              {invoiceData.senderPhone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{invoiceData.senderPhone}</span>
                </div>
              )}
              {invoiceData.senderAddress && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{invoiceData.senderAddress}</span>
                </div>
              )}
              {invoiceData.senderABN && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="w-4 h-4" />
                  <span>ABN: {invoiceData.senderABN}</span>
                </div>
              )}
              {!invoiceData.senderName && !invoiceData.senderPhone && !invoiceData.senderAddress && !invoiceData.senderABN && (
                <p className="text-sm text-gray-500 italic">
                  Add your details in your profile settings
                </p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Bill To</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {invoiceData.clientAvatarUrl && (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={invoiceData.clientAvatarUrl} alt={invoiceData.clientName} />
                    <AvatarFallback>{invoiceData.clientName.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                )}
                <div className="font-medium text-gray-900">
                  {invoiceData.clientName}
                </div>
              </div>
              {invoiceData.clientEmail && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{invoiceData.clientEmail}</span>
                </div>
              )}
              {invoiceData.clientPhone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-4 h-4" />
                  <span>{invoiceData.clientPhone}</span>
                </div>
              )}
              {invoiceData.clientAddress && (
                <div className="flex items-start gap-2 text-gray-600">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>{invoiceData.clientAddress}</span>
                </div>
              )}
              {invoiceData.clientABN && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Hash className="w-4 h-4" />
                  <span>ABN: {invoiceData.clientABN}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-sm font-medium text-gray-900">Description</th>
                <th className="text-right py-3 text-sm font-medium text-gray-900">Qty</th>
                <th className="text-right py-3 text-sm font-medium text-gray-900">Rate</th>
                <th className="text-right py-3 text-sm font-medium text-gray-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.map((item) => {
                const displayTotal = item.isDeduction ? -Math.abs(item.total) : item.total;
                const displayRate = item.isDeduction ? -Math.abs(item.rate) : item.rate;
                return (
                  <tr key={item.id} className={cn("border-b border-gray-100", item.isDeduction && "bg-red-50")}>
                    <td className={cn("py-3 text-sm", item.isDeduction ? "text-red-700" : "text-gray-900")}>
                      {item.description}
                      {item.isDeduction && <span className="ml-2 text-xs text-red-500">(Deduction)</span>}
                    </td>
                    <td className={cn("py-3 text-sm text-right", item.isDeduction ? "text-red-600" : "text-gray-600")}>
                      {item.quantity}
                    </td>
                    <td className={cn("py-3 text-sm text-right", item.isDeduction ? "text-red-600" : "text-gray-600")}>
                      {displayRate < 0 ? '-' : ''}${Math.abs(displayRate).toFixed(2)}
                    </td>
                    <td className={cn("py-3 text-sm text-right font-medium", item.isDeduction ? "text-red-700" : "text-gray-900")}>
                      {displayTotal < 0 ? '-' : ''}${Math.abs(displayTotal).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="p-8 border-b border-gray-200">
        <div className="max-w-sm ml-auto space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax ({invoiceData.taxRate}%):</span>
            <span>${taxAmount.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-lg font-semibold text-gray-900">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Deposit Information */}
      {invoiceData.requireDeposit && depositAmount > 0 && (
        <div className="p-8 border-b border-gray-200">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Deposit Required</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-blue-700">
                  Deposit ({invoiceData.depositType === 'percentage' ? `${invoiceData.depositPercentage}%` : 'Fixed Amount'}):
                </span>
                <span className="font-semibold text-blue-900">${depositAmount.toFixed(2)}</span>
              </div>
              {depositDueDate && (
                <div className="flex justify-between">
                  <span className="text-blue-700">Due by:</span>
                  <span className="font-medium text-blue-900">{format(depositDueDate, 'MMM d, yyyy')}</span>
                </div>
              )}
              <Separator className="bg-blue-200" />
              <div className="flex justify-between">
                <span className="text-blue-700">Remaining Balance:</span>
                <span className="font-semibold text-blue-900">${remainingAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-600">Final payment due:</span>
                <span className="text-blue-800">{format(invoiceData.dueDate, 'MMM d, yyyy')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Details */}
      {(invoiceData.senderBankName || invoiceData.senderBankBsb || invoiceData.senderBankAccount || invoiceData.senderABN) && (
        <div className="p-8 border-b border-gray-200">
          <div className="bg-emerald-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-semibold text-emerald-900">Payment Details</h3>
            </div>
            <div className="space-y-3">
              {invoiceData.senderBankName && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">Account Name:</span>
                  <span className="font-medium text-emerald-900">{invoiceData.senderBankName}</span>
                </div>
              )}
              {invoiceData.senderBankBsb && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">BSB:</span>
                  <span className="font-medium text-emerald-900">{invoiceData.senderBankBsb}</span>
                </div>
              )}
              {invoiceData.senderBankAccount && (
                <div className="flex justify-between">
                  <span className="text-emerald-700">Account Number:</span>
                  <span className="font-medium text-emerald-900">{invoiceData.senderBankAccount}</span>
                </div>
              )}
              {invoiceData.senderABN && (
                <>
                  <Separator className="bg-emerald-200" />
                  <div className="flex justify-between">
                    <span className="text-emerald-700">ABN:</span>
                    <span className="font-medium text-emerald-900">{invoiceData.senderABN}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {invoiceData.notes && (
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
          <p className="text-gray-600 whitespace-pre-wrap">{invoiceData.notes}</p>
        </div>
      )}

      {/* Footer */}
      <div className="p-8 text-center text-gray-500">
        <p className="text-sm">
          Thank you for your business! For questions, contact us at invoices@gigpigs.app
        </p>
      </div>
    </div>
  );

  if (isPrintMode) {
    return (
      <div className="print:block hidden">
        <style jsx>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print\\:block * {
              visibility: visible;
            }
            .print\\:block {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
        {invoiceContent}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Invoice Preview
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 py-4">
          {invoiceContent}
        </div>

        {showActions && (
          <DialogFooter className="px-6 py-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2 justify-between w-full">
              <div className="flex gap-2">
                <Button
                  className="professional-button flex items-center gap-2"
                  onClick={handlePrint}
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                {onDownload && (
                  <Button
                    className="professional-button flex items-center gap-2"
                    onClick={onDownload}
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                )}
              </div>
              
              <div className="flex gap-2">
                {onEdit && (
                  <Button
                    className="professional-button flex items-center gap-2"
                    onClick={onEdit}
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                )}
                {onSave && (
                  <>
                    <Button
                      className="professional-button flex items-center gap-2"
                      onClick={() => onSave('draft')}
                    >
                      <Save className="w-4 h-4" />
                      Save Draft
                    </Button>
                    <Button
                      onClick={() => onSave('sent')}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      <Send className="w-4 h-4" />
                      Send Invoice
                    </Button>
                  </>
                )}
                <Button className="professional-button" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreview;