import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Plus, Trash2, Save, Eye, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { InvoicePreview } from './InvoicePreview';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

interface EditableInvoice {
  id: string;
  invoice_number: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientABN?: string;
  issue_date: string;
  due_date: string;
  status: 'draft' | 'sent' | 'paid';
  total_amount: number;
  tax_rate: number;
  notes?: string;
  items?: InvoiceItem[];
  // Deposit fields
  deposit_amount?: number;
  deposit_percentage?: number;
  deposit_due_days_before_event?: number;
  event_date?: string;
}

interface InvoiceEditProps {
  open: boolean;
  onClose: () => void;
  invoice: EditableInvoice | null;
  onSave?: (invoice: EditableInvoice) => Promise<void>;
}

export const InvoiceEdit: React.FC<InvoiceEditProps> = ({
  open,
  onClose,
  invoice,
  onSave
}) => {
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editData, setEditData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientABN: '',
    issueDate: new Date(),
    dueDate: new Date(),
    notes: '',
    taxRate: 10,
    status: 'draft' as 'draft' | 'sent' | 'paid',
    requireDeposit: false,
    depositType: 'percentage' as 'amount' | 'percentage',
    depositAmount: 0,
    depositPercentage: 30,
    depositDueDaysBeforeEvent: 7,
    eventDate: undefined as Date | undefined
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, total: 0 }
  ]);

  // Load invoice data when dialog opens
  useEffect(() => {
    if (invoice && open) {
      setEditData({
        clientName: invoice.clientName || '',
        clientEmail: invoice.clientEmail || '',
        clientPhone: invoice.clientPhone || '',
        clientAddress: invoice.clientAddress || '',
        clientABN: invoice.clientABN || '',
        issueDate: new Date(invoice.issue_date),
        dueDate: new Date(invoice.due_date),
        notes: invoice.notes || '',
        taxRate: invoice.tax_rate || 10,
        status: invoice.status,
        requireDeposit: !!(invoice.deposit_amount || invoice.deposit_percentage),
        depositType: invoice.deposit_percentage ? 'percentage' : 'amount',
        depositAmount: invoice.deposit_amount || 0,
        depositPercentage: invoice.deposit_percentage || 30,
        depositDueDaysBeforeEvent: invoice.deposit_due_days_before_event || 7,
        eventDate: invoice.event_date ? new Date(invoice.event_date) : undefined
      });

      if (invoice.items && invoice.items.length > 0) {
        setItems(invoice.items);
      }
    }
  }, [invoice, open]);

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      total: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.total = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (editData.taxRate / 100);
  const total = subtotal + taxAmount;

  const getPreviewData = () => {
    return {
      clientName: editData.clientName,
      clientEmail: editData.clientEmail,
      clientPhone: editData.clientPhone,
      clientAddress: editData.clientAddress,
      clientABN: editData.clientABN,
      senderName: 'Stand Up Sydney',
      senderEmail: 'billing@standupSydney.com',
      senderPhone: '+61 2 9876 5432',
      senderAddress: '123 Comedy St, Sydney NSW 2000',
      senderABN: '12 345 678 901',
      invoiceNumber: invoice?.invoice_number,
      issueDate: editData.issueDate,
      dueDate: editData.dueDate,
      items: items.filter(item => item.description && item.total > 0),
      taxRate: editData.taxRate,
      notes: editData.notes,
      status: editData.status,
      currency: 'AUD',
      requireDeposit: editData.requireDeposit,
      depositType: editData.depositType,
      depositAmount: editData.depositAmount,
      depositPercentage: editData.depositPercentage,
      depositDueDaysBeforeEvent: editData.depositDueDaysBeforeEvent,
      eventDate: editData.eventDate,
    };
  };

  const handleSave = async () => {
    if (!invoice) return;

    // Validate form
    if (!editData.clientName || !editData.clientEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(item => item.description && item.total > 0);
    if (validItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the invoice.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update the invoice in the database
      const { error } = await supabase
        .from('invoices')
        .update({
          issue_date: editData.issueDate.toISOString(),
          due_date: editData.dueDate.toISOString(),
          tax_rate: editData.taxRate,
          subtotal: subtotal, // Database column is 'subtotal', not 'subtotal_amount'
          tax_amount: taxAmount,
          total_amount: total,
          notes: editData.notes,
          status: editData.status,
          // Deposit fields
          deposit_amount: editData.requireDeposit && editData.depositType === 'amount' ? editData.depositAmount : null,
          deposit_percentage: editData.requireDeposit && editData.depositType === 'percentage' ? editData.depositPercentage : null,
          deposit_due_days_before_event: editData.requireDeposit ? editData.depositDueDaysBeforeEvent : null,
          event_date: editData.requireDeposit && editData.eventDate ? editData.eventDate.toISOString() : null,
        })
        .eq('id', invoice.id);

      if (error) throw error;

      // Update invoice recipients
      const { error: recipientError } = await supabase
        .from('invoice_recipients')
        .update({
          recipient_name: editData.clientName,
          recipient_email: editData.clientEmail,
          recipient_phone: editData.clientPhone,
          recipient_address: editData.clientAddress,
          recipient_abn: editData.clientABN,
        })
        .eq('invoice_id', invoice.id);

      if (recipientError) throw recipientError;

      // Update invoice items
      // First delete existing items
      const { error: deleteError } = await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);

      if (deleteError) throw deleteError;

      // Insert updated items
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(
          validItems.map(item => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.rate,
            subtotal: item.total,
            tax_amount: item.total * (editData.taxRate / (100 + editData.taxRate)),
            total_price: item.total // Database column is 'total_price', not 'total'
          }))
        );

      if (itemsError) throw itemsError;

      toast({
        title: "Invoice Updated",
        description: "Invoice has been updated successfully.",
      });

      onClose();
    } catch (error) {
      console.error('Failed to update invoice:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  if (!invoice) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice {invoice.invoice_number}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Client Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={editData.clientName}
                  onChange={(e) => setEditData(prev => ({...prev, clientName: e.target.value}))}
                  placeholder="Comedy Club Name"
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email *</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={editData.clientEmail}
                  onChange={(e) => setEditData(prev => ({...prev, clientEmail: e.target.value}))}
                  placeholder="booking@comedyclub.com"
                />
              </div>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editData.issueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.issueDate ? format(editData.issueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editData.issueDate}
                      onSelect={(date) => date && setEditData(prev => ({...prev, issueDate: date}))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !editData.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {editData.dueDate ? format(editData.dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={editData.dueDate}
                      onSelect={(date) => date && setEditData(prev => ({...prev, dueDate: date}))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  value={editData.taxRate}
                  onChange={(e) => setEditData(prev => ({...prev, taxRate: parseFloat(e.target.value) || 0}))}
                  placeholder="10"
                />
              </div>
            </div>

            {/* Invoice Items */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <Label className="text-base font-medium">Invoice Items</Label>
                <Button
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-5">
                      <Label>Description</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        placeholder="Comedy Show Performance"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label>Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="col-span-4 md:col-span-2">
                      <Label>Rate ($)</Label>
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="200"
                      />
                    </div>
                    <div className="col-span-3 md:col-span-2">
                      <Label>Total</Label>
                      <div className="font-medium py-2">${item.total.toFixed(2)}</div>
                    </div>
                    <div className="col-span-1">
                      {items.length > 1 && (
                        <Button
                          onClick={() => removeItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="max-w-sm ml-auto space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({editData.taxRate}%):</span>
                <span>${taxAmount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({...prev, notes: e.target.value}))}
                placeholder="Additional notes for the invoice..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreview}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <InvoicePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        invoiceData={getPreviewData()}
        showActions={false}
      />
    </>
  );
};

export default InvoiceEdit;