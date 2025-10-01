// Refactored Invoice Form - Uses extracted hooks and sub-components
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Save, Send, ArrowLeft, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { useInvoiceFormState } from '@/hooks/useInvoiceFormState';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';
import { InvoiceItemsList } from '@/components/invoice/InvoiceItemsList';
import { DepositCalculator } from '@/components/invoice/DepositCalculator';

const RefactoredInvoiceForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { createInvoice } = useInvoiceOperations();
  
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
    
    // Actions
    updateInvoiceData,
    addItem,
    removeItem,
    updateItem,
    setShowDepositSection,
    setShowPreview,
    
    // Utilities
    validateForm,
    resetForm
  } = useInvoiceFormState();

  const handleSubmit = async (status: 'draft' | 'sent') => {
    const validation = validateForm();
    if (!validation.isValid) {
      toast({
        title: "Validation Error",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    try {
      const invoicePayload = {
        ...invoiceData,
        status,
        items,
        subtotal,
        tax_amount: taxAmount,
        total,
        deposit_amount: depositAmount,
        remaining_amount: remainingAmount,
        user_id: user?.id
      };

      await createInvoice(invoicePayload);
      
      toast({
        title: status === 'draft' ? "Invoice Saved" : "Invoice Sent",
        description: `Invoice has been ${status === 'draft' ? 'saved as draft' : 'sent to client'} successfully.`
      });
      
      navigate('/invoices');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `Failed to ${status === 'draft' ? 'save' : 'send'} invoice.`,
        variant: "destructive"
      });
    }
  };

  if (showPreview) {
    return (
      <InvoicePreview
        invoiceData={{
          ...invoiceData,
          items,
          subtotal,
          tax_amount: taxAmount,
          total,
          deposit_amount: depositAmount,
          remaining_amount: remainingAmount
        }}
        onBack={() => setShowPreview(false)}
        onSave={() => handleSubmit('draft')}
        onSend={() => handleSubmit('sent')}
      />
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/invoices')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Create New Invoice</h1>
            <p className="text-gray-600">Fill in the details to create a new invoice</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        </div>
      </div>

      <form className="space-y-6">
        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Enter your client's details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div className="space-y-2">
              <Label htmlFor="clientABN">ABN</Label>
              <Input
                id="clientABN"
                value={invoiceData.clientABN}
                onChange={(e) => updateInvoiceData({ clientABN: e.target.value })}
                placeholder="Enter ABN"
              />
            </div>
            
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="clientAddress">Address</Label>
              <Textarea
                id="clientAddress"
                value={invoiceData.clientAddress}
                onChange={(e) => updateInvoiceData({ clientAddress: e.target.value })}
                placeholder="Enter client address"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Details */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>Set invoice dates and terms</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !invoiceData.issueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceData.issueDate ? format(invoiceData.issueDate, "PPP") : "Select date"}
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
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !invoiceData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {invoiceData.dueDate ? format(invoiceData.dueDate, "PPP") : "Select date"}
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
            
            <div className="space-y-2">
              <Label htmlFor="taxRate">Tax Rate (%)</Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={invoiceData.taxRate}
                onChange={(e) => updateInvoiceData({ taxRate: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Invoice Items */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Items</CardTitle>
            <CardDescription>Add items and services to your invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <InvoiceItemsList
              items={items}
              onAddItem={addItem}
              onRemoveItem={removeItem}
              onUpdateItem={updateItem}
              subtotal={subtotal}
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
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax ({invoiceData.taxRate}%):</span>
                  <span>${taxAmount.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${total.toFixed(2)}</span>
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
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset Form
          </Button>
          <Button type="button" variant="outline" onClick={() => handleSubmit('draft')}>
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button type="button" onClick={() => handleSubmit('sent')}>
            <Send className="h-4 w-4 mr-2" />
            Send Invoice
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RefactoredInvoiceForm;