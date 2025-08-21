
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, Plus, Trash2, Save, Send, ArrowLeft, ChevronDown, ChevronUp, Percent, DollarSign, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useInvoiceOperations } from '@/hooks/useInvoiceOperations';
import { supabase } from '@/integrations/supabase/client';
import { InvoicePreview } from '@/components/invoice/InvoicePreview';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

const InvoiceForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const { createInvoice } = useInvoiceOperations();
  
  const [invoiceData, setInvoiceData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientABN: '',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: '',
    taxRate: 10,
    status: 'draft' as 'draft' | 'sent' | 'paid',
    // Deposit fields
    requireDeposit: false,
    depositType: 'percentage' as 'amount' | 'percentage',
    depositAmount: 0,
    depositPercentage: 30,
    depositDueDaysBeforeEvent: 7,
    eventDate: undefined as Date | undefined
  });
  
  const [showDepositSection, setShowDepositSection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, total: 0 }
  ]);

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

  // Prepare preview data
  const getPreviewData = () => {
    return {
      clientName: invoiceData.clientName,
      clientEmail: invoiceData.clientEmail,
      clientPhone: invoiceData.clientPhone,
      clientAddress: invoiceData.clientAddress,
      clientABN: invoiceData.clientABN,
      senderName: user?.email || 'Stand Up Sydney',
      senderEmail: user?.email || 'billing@standupSydney.com',
      senderPhone: '',
      senderAddress: '',
      senderABN: '',
      invoiceNumber: undefined, // Will be generated on save
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      items: items.filter(item => item.description && item.total > 0),
      taxRate: invoiceData.taxRate,
      notes: invoiceData.notes,
      status: invoiceData.status,
      currency: 'AUD',
      requireDeposit: invoiceData.requireDeposit,
      depositType: invoiceData.depositType,
      depositAmount: invoiceData.depositAmount,
      depositPercentage: invoiceData.depositPercentage,
      depositDueDaysBeforeEvent: invoiceData.depositDueDaysBeforeEvent,
      eventDate: invoiceData.eventDate,
    };
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create invoices.",
        variant: "destructive",
      });
      return;
    }

    // Validate form
    if (!invoiceData.clientName || !invoiceData.clientEmail) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Validate items
    const validItems = items.filter(item => item.description && item.total > 0);
    if (validItems.length === 0) {
      toast({
        title: "No Items",
        description: "Please add at least one item to the invoice.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Determine invoice type based on user role
      const invoiceType = hasRole('promoter') ? 'promoter' : 'comedian';
      
      // Get user profile for sender information
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone')
        .eq('id', user.id)
        .single();

      await createInvoice.mutateAsync({
        invoice_type: invoiceType,
        promoter_id: invoiceType === 'promoter' ? user.id : undefined,
        comedian_id: invoiceType === 'comedian' ? user.id : undefined,
        sender_name: profile?.full_name || user.email || '',
        sender_email: profile?.email || user.email || '',
        sender_phone: profile?.phone || '',
        issue_date: invoiceData.issueDate.toISOString(),
        due_date: invoiceData.dueDate.toISOString(),
        currency: 'AUD',
        tax_rate: invoiceData.taxRate,
        tax_treatment: 'inclusive',
        subtotal_amount: subtotal,
        tax_amount: taxAmount,
        total_amount: total,
        notes: invoiceData.notes,
        status: status,
        items: validItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.rate,
          subtotal: item.total,
          tax_amount: item.total * (invoiceData.taxRate / (100 + invoiceData.taxRate)),
          total: item.total
        })),
        recipients: [{
          recipient_name: invoiceData.clientName,
          recipient_email: invoiceData.clientEmail,
          recipient_phone: invoiceData.clientPhone,
          recipient_address: invoiceData.clientAddress,
          recipient_abn: invoiceData.clientABN,
          recipient_type: 'business'
        }],
        // Deposit fields
        deposit_amount: invoiceData.requireDeposit && invoiceData.depositType === 'amount' ? invoiceData.depositAmount : undefined,
        deposit_percentage: invoiceData.requireDeposit && invoiceData.depositType === 'percentage' ? invoiceData.depositPercentage : undefined,
        deposit_due_days_before_event: invoiceData.requireDeposit ? invoiceData.depositDueDaysBeforeEvent : undefined,
        event_date: invoiceData.requireDeposit && invoiceData.eventDate ? invoiceData.eventDate.toISOString() : undefined
      });

      navigate('/profile?tab=invoices');
    } catch (error) {
      console.error('Failed to create invoice:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/invoices')}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Invoice</h1>
          <p className="text-purple-200">Generate professional invoices for your comedy gigs</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Invoice Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Client Information</CardTitle>
                <CardDescription className="text-purple-200">
                  Enter your client's details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="clientName" className="text-white">Client Name</Label>
                    <Input
                      id="clientName"
                      value={invoiceData.clientName}
                      onChange={(e) => setInvoiceData(prev => ({...prev, clientName: e.target.value}))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Comedy Club Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail" className="text-white">Client Email</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={invoiceData.clientEmail}
                      onChange={(e) => setInvoiceData(prev => ({...prev, clientEmail: e.target.value}))}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                      placeholder="booking@comedyclub.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white">Issue Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                            !invoiceData.issueDate && "text-white/50"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceData.issueDate ? format(invoiceData.issueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={invoiceData.issueDate}
                          onSelect={(date) => date && setInvoiceData(prev => ({...prev, issueDate: date}))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-white">Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                            !invoiceData.dueDate && "text-white/50"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {invoiceData.dueDate ? format(invoiceData.dueDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={invoiceData.dueDate}
                          onSelect={(date) => date && setInvoiceData(prev => ({...prev, dueDate: date}))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="taxRate" className="text-white">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      value={invoiceData.taxRate}
                      onChange={(e) => setInvoiceData(prev => ({...prev, taxRate: parseFloat(e.target.value) || 0}))}
                      className="bg-white/5 border-white/20 text-white"
                      placeholder="10"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Settings */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader 
                className="cursor-pointer"
                onClick={() => setShowDepositSection(!showDepositSection)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Deposit Settings</CardTitle>
                    <CardDescription className="text-purple-200">
                      Require an upfront deposit to secure the booking
                    </CardDescription>
                  </div>
                  {showDepositSection ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                </div>
              </CardHeader>
              {showDepositSection && (
                <CardContent className="space-y-4">
                  {/* Deposit Toggle */}
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="requireDeposit"
                      checked={invoiceData.requireDeposit}
                      onChange={(e) => setInvoiceData(prev => ({...prev, requireDeposit: e.target.checked}))}
                      className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                    />
                    <Label htmlFor="requireDeposit" className="text-white cursor-pointer">
                      Require deposit for this invoice
                    </Label>
                  </div>

                  {invoiceData.requireDeposit && (
                    <>
                      {/* Deposit Type and Amount */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Deposit Type</Label>
                          <Select
                            value={invoiceData.depositType}
                            onValueChange={(value: 'amount' | 'percentage') => 
                              setInvoiceData(prev => ({...prev, depositType: value}))
                            }
                          >
                            <SelectTrigger className="bg-white/5 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">
                                <div className="flex items-center">
                                  <Percent className="w-4 h-4 mr-2" />
                                  Percentage
                                </div>
                              </SelectItem>
                              <SelectItem value="amount">
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Fixed Amount
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          {invoiceData.depositType === 'percentage' ? (
                            <>
                              <Label htmlFor="depositPercentage" className="text-white">
                                Deposit Percentage
                              </Label>
                              <div className="relative">
                                <Input
                                  id="depositPercentage"
                                  type="number"
                                  min="1"
                                  max="100"
                                  value={invoiceData.depositPercentage}
                                  onChange={(e) => setInvoiceData(prev => ({
                                    ...prev, 
                                    depositPercentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                                  }))}
                                  className="bg-white/5 border-white/20 text-white pr-10"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50">%</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <Label htmlFor="depositAmount" className="text-white">
                                Deposit Amount
                              </Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">$</span>
                                <Input
                                  id="depositAmount"
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={invoiceData.depositAmount}
                                  onChange={(e) => setInvoiceData(prev => ({
                                    ...prev, 
                                    depositAmount: Math.max(0, parseFloat(e.target.value) || 0)
                                  }))}
                                  className="bg-white/5 border-white/20 text-white pl-8"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Event Date and Due Days */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">Event Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal bg-white/5 border-white/20 text-white hover:bg-white/10",
                                  !invoiceData.eventDate && "text-white/50"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {invoiceData.eventDate ? format(invoiceData.eventDate, "PPP") : "Pick event date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <Calendar
                                mode="single"
                                selected={invoiceData.eventDate}
                                onSelect={(date) => date && setInvoiceData(prev => ({...prev, eventDate: date}))}
                                initialFocus
                                disabled={(date) => date < new Date()}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div>
                          <Label htmlFor="depositDueDays" className="text-white">
                            Due Days Before Event
                          </Label>
                          <Select
                            value={invoiceData.depositDueDaysBeforeEvent.toString()}
                            onValueChange={(value) => 
                              setInvoiceData(prev => ({...prev, depositDueDaysBeforeEvent: parseInt(value)}))
                            }
                          >
                            <SelectTrigger className="bg-white/5 border-white/20 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 days before</SelectItem>
                              <SelectItem value="7">7 days before</SelectItem>
                              <SelectItem value="14">14 days before</SelectItem>
                              <SelectItem value="21">21 days before</SelectItem>
                              <SelectItem value="30">30 days before</SelectItem>
                              <SelectItem value="45">45 days before</SelectItem>
                              <SelectItem value="60">60 days before</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Deposit Summary */}
                      {invoiceData.eventDate && (
                        <div className="p-4 bg-purple-900/30 rounded-lg space-y-2">
                          <div className="flex justify-between text-white">
                            <span>Deposit Amount:</span>
                            <span className="font-medium">${depositAmount.toFixed(2)}</span>
                          </div>
                          {depositDueDate && (
                            <div className="flex justify-between text-white">
                              <span>Deposit Due Date:</span>
                              <span className="font-medium">{format(depositDueDate, "PPP")}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-purple-200 text-sm">
                            <span>Remaining Balance:</span>
                            <span>${remainingAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Invoice Items */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-white">Invoice Items</CardTitle>
                    <CardDescription className="text-purple-200">
                      Add the services or shows you're billing for
                    </CardDescription>
                  </div>
                  <Button
                    onClick={addItem}
                    variant="outline"
                    size="sm"
                    className="bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
                      <div className="col-span-12 md:col-span-5">
                        <Label className="text-white">Description</Label>
                        <Input
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                          placeholder="Comedy Show Performance"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Label className="text-white">Qty</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                          className="bg-white/5 border-white/20 text-white"
                          min="1"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Label className="text-white">Rate ($)</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                          className="bg-white/5 border-white/20 text-white"
                          placeholder="200"
                        />
                      </div>
                      <div className="col-span-3 md:col-span-2">
                        <Label className="text-white">Total</Label>
                        <div className="text-white font-medium py-2">${item.total.toFixed(2)}</div>
                      </div>
                      <div className="col-span-1">
                        {items.length > 1 && (
                          <Button
                            onClick={() => removeItem(item.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Additional Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData(prev => ({...prev, notes: e.target.value}))}
                  className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Thank you for having me perform at your venue..."
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Invoice Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 sticky top-8">
              <CardHeader>
                <CardTitle className="text-white">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-white">
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-white">
                    <span>Tax ({invoiceData.taxRate}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  <Separator className="bg-white/20" />
                  <div className="flex justify-between text-white font-bold text-lg">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Deposit Breakdown */}
                {invoiceData.requireDeposit && depositAmount > 0 && (
                  <div className="space-y-2 pt-4 border-t border-white/20">
                    <div className="text-purple-200 text-sm font-medium mb-2">Deposit Required</div>
                    <div className="flex justify-between text-white">
                      <span>Deposit ({invoiceData.depositType === 'percentage' ? `${invoiceData.depositPercentage}%` : 'Fixed'}):</span>
                      <span className="font-medium">${depositAmount.toFixed(2)}</span>
                    </div>
                    {depositDueDate && (
                      <div className="flex justify-between text-purple-200 text-sm">
                        <span>Due by:</span>
                        <span>{format(depositDueDate, "MMM d, yyyy")}</span>
                      </div>
                    )}
                    <Separator className="bg-white/20" />
                    <div className="flex justify-between text-white">
                      <span>Remaining Balance:</span>
                      <span>${remainingAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-purple-200 text-sm">
                      <span>Final payment due:</span>
                      <span>{format(invoiceData.dueDate, "MMM d, yyyy")}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-4">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview Invoice
                  </Button>
                  <Button
                    onClick={() => handleSave('draft')}
                    variant="outline"
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/10"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save as Draft
                  </Button>
                  <Button
                    onClick={() => handleSave('sent')}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Invoice
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/20">
                  <Badge variant="secondary" className="bg-white/10 text-white">
                    Invoice will be numbered automatically
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Invoice Preview Modal */}
      <InvoicePreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        invoiceData={getPreviewData()}
        onSave={handleSave}
        showActions={true}
      />
    </div>
  );
};

export default InvoiceForm;
