/**
 * useInvoiceFormState - Invoice form state management hook
 *
 * Features:
 * - Client selection with profile reference
 * - Per-item GST treatment (gst_included, gst_excluded, no_gst)
 * - Deductions support (negative line items)
 * - CC/BCC email recipients
 * - Deposit configuration
 */

import { useState, useMemo, useCallback } from 'react';
import type { InvoiceClient } from '@/hooks/useClientSearch';

export type GstTreatment = 'gst_included' | 'gst_excluded' | 'no_gst';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
  gstTreatment: GstTreatment;
  isDeduction: boolean;
}

export interface EmailRecipients {
  ccEmails: string[];
  bccEmails: string[];
}

export interface InvoiceFormData {
  // Client (selected from search or manually entered)
  client: InvoiceClient | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientABN: string;
  clientGstRegistered: boolean;

  // Invoice details
  issueDate: Date;
  dueDate: Date;
  notes: string;
  status: 'draft' | 'sent' | 'paid';

  // Email recipients
  emailRecipients: EmailRecipients;

  // Deposit fields
  requireDeposit: boolean;
  depositType: 'amount' | 'percentage';
  depositAmount: number;
  depositPercentage: number;
  depositDueDaysBeforeEvent: number;
  eventDate?: Date;
}

// Calculate GST amount for a single item
function calculateItemGst(item: InvoiceItem): number {
  const baseAmount = item.quantity * item.rate;
  const amount = item.isDeduction ? -Math.abs(baseAmount) : baseAmount;

  switch (item.gstTreatment) {
    case 'gst_included':
      // GST is already in the price, extract it: amount - (amount / 1.1)
      return amount - (amount / 1.1);
    case 'gst_excluded':
      // GST is added on top: amount * 0.1
      return amount * 0.1;
    case 'no_gst':
    default:
      return 0;
  }
}

// Calculate the total including GST for a single item
function calculateItemTotal(item: InvoiceItem): number {
  const baseAmount = item.quantity * item.rate;
  const amount = item.isDeduction ? -Math.abs(baseAmount) : baseAmount;

  switch (item.gstTreatment) {
    case 'gst_included':
      // Total is the base amount (GST already included)
      return amount;
    case 'gst_excluded':
      // Add GST on top
      return amount * 1.1;
    case 'no_gst':
    default:
      return amount;
  }
}

const createDefaultItem = (gstTreatment: GstTreatment = 'no_gst'): InvoiceItem => ({
  id: Date.now().toString(),
  description: '',
  quantity: 1,
  rate: 0,
  total: 0,
  gstTreatment,
  isDeduction: false,
});

const createDeduction = (gstTreatment: GstTreatment = 'no_gst'): InvoiceItem => ({
  id: Date.now().toString(),
  description: '',
  quantity: 1,
  rate: 0,
  total: 0,
  gstTreatment,
  isDeduction: true,
});

export const useInvoiceFormState = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    client: null,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientABN: '',
    clientGstRegistered: false,
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: '',
    status: 'draft',
    emailRecipients: {
      ccEmails: [],
      bccEmails: [],
    },
    requireDeposit: false,
    depositType: 'percentage',
    depositAmount: 0,
    depositPercentage: 30,
    depositDueDaysBeforeEvent: 7,
    eventDate: undefined,
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    createDefaultItem(),
  ]);

  const [showDepositSection, setShowDepositSection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Default GST treatment based on client's GST registration
  const defaultGstTreatment = useMemo<GstTreatment>(() => {
    return invoiceData.clientGstRegistered ? 'gst_excluded' : 'no_gst';
  }, [invoiceData.clientGstRegistered]);

  // Calculate subtotal (sum of all items including deductions, before GST adjustments)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const baseAmount = item.quantity * item.rate;
      const amount = item.isDeduction ? -Math.abs(baseAmount) : baseAmount;
      return sum + amount;
    }, 0);
  }, [items]);

  // Calculate total GST amount from all items
  const taxAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + calculateItemGst(item);
    }, 0);
  }, [items]);

  // Calculate grand total (subtotal + all GST adjustments)
  const total = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + calculateItemTotal(item);
    }, 0);
  }, [items]);

  // Calculate deposit amount
  const calculateDepositAmount = useMemo(() => {
    if (!invoiceData.requireDeposit) return 0;
    if (invoiceData.depositType === 'amount') {
      return invoiceData.depositAmount;
    } else {
      return total * (invoiceData.depositPercentage / 100);
    }
  }, [invoiceData.requireDeposit, invoiceData.depositType, invoiceData.depositAmount, total, invoiceData.depositPercentage]);

  const remainingAmount = useMemo(() =>
    total - calculateDepositAmount,
    [total, calculateDepositAmount]
  );

  // Update invoice data
  const updateInvoiceData = useCallback((updates: Partial<InvoiceFormData>) => {
    setInvoiceData(prev => ({ ...prev, ...updates }));
  }, []);

  // Select a client from search results
  const selectClient = useCallback((client: InvoiceClient | null) => {
    if (client) {
      setInvoiceData(prev => ({
        ...prev,
        client,
        clientName: client.name,
        clientEmail: client.email || '',
        clientPhone: client.phone || '',
        clientAddress: client.address || '',
        clientABN: client.abn || '',
        clientGstRegistered: client.gstRegistered,
      }));

      // Update existing items to use client's GST preference
      const newDefaultGst: GstTreatment = client.gstRegistered ? 'gst_excluded' : 'no_gst';
      setItems(prevItems => prevItems.map(item => ({
        ...item,
        gstTreatment: item.gstTreatment === 'no_gst' ? newDefaultGst : item.gstTreatment,
      })));
    } else {
      setInvoiceData(prev => ({
        ...prev,
        client: null,
      }));
    }
  }, []);

  // Update CC emails
  const updateCcEmails = useCallback((ccEmails: string[]) => {
    setInvoiceData(prev => ({
      ...prev,
      emailRecipients: {
        ...prev.emailRecipients,
        ccEmails,
      },
    }));
  }, []);

  // Update BCC emails
  const updateBccEmails = useCallback((bccEmails: string[]) => {
    setInvoiceData(prev => ({
      ...prev,
      emailRecipients: {
        ...prev.emailRecipients,
        bccEmails,
      },
    }));
  }, []);

  // Item management functions
  const addItem = useCallback(() => {
    const newItem = createDefaultItem(defaultGstTreatment);
    setItems(prev => [...prev, newItem]);
  }, [defaultGstTreatment]);

  const addDeduction = useCallback(() => {
    const newDeduction = createDeduction(defaultGstTreatment);
    setItems(prev => [...prev, newDeduction]);
  }, [defaultGstTreatment]);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateItem = useCallback((id: string, field: keyof InvoiceItem, value: string | number | boolean) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };

        // Recalculate total when quantity, rate, or GST treatment changes
        if (field === 'quantity' || field === 'rate' || field === 'gstTreatment') {
          const baseAmount = updatedItem.quantity * updatedItem.rate;
          const amount = updatedItem.isDeduction ? -Math.abs(baseAmount) : baseAmount;

          // For display purposes, store the base total (before GST adjustment)
          // The actual total with GST is calculated separately
          updatedItem.total = Math.abs(baseAmount);
        }

        return updatedItem;
      }
      return item;
    }));
  }, []);

  // Validation
  const validateForm = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!invoiceData.clientName.trim()) {
      errors.push('Client name is required');
    }

    if (!invoiceData.clientEmail.trim()) {
      errors.push('Client email is required');
    } else if (!/\S+@\S+\.\S+/.test(invoiceData.clientEmail)) {
      errors.push('Client email is invalid');
    }

    if (items.length === 0) {
      errors.push('At least one item is required');
    }

    const hasEmptyItems = items.some(item => !item.description.trim() || item.rate <= 0);
    if (hasEmptyItems) {
      errors.push('All items must have a description and rate greater than 0');
    }

    if (invoiceData.dueDate < invoiceData.issueDate) {
      errors.push('Due date must be after issue date');
    }

    if (invoiceData.requireDeposit) {
      if (invoiceData.depositType === 'amount' && invoiceData.depositAmount <= 0) {
        errors.push('Deposit amount must be greater than 0');
      }
      if (invoiceData.depositType === 'percentage' && (invoiceData.depositPercentage <= 0 || invoiceData.depositPercentage > 100)) {
        errors.push('Deposit percentage must be between 1 and 100');
      }
      if (!invoiceData.eventDate) {
        errors.push('Event date is required when deposit is enabled');
      }
    }

    // Validate CC/BCC emails
    const emailRegex = /\S+@\S+\.\S+/;
    const invalidCc = invoiceData.emailRecipients.ccEmails.filter(email => !emailRegex.test(email));
    const invalidBcc = invoiceData.emailRecipients.bccEmails.filter(email => !emailRegex.test(email));

    if (invalidCc.length > 0) {
      errors.push(`Invalid CC email(s): ${invalidCc.join(', ')}`);
    }
    if (invalidBcc.length > 0) {
      errors.push(`Invalid BCC email(s): ${invalidBcc.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [invoiceData, items]);

  // Reset form
  const resetForm = useCallback(() => {
    setInvoiceData({
      client: null,
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      clientABN: '',
      clientGstRegistered: false,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: '',
      status: 'draft',
      emailRecipients: {
        ccEmails: [],
        bccEmails: [],
      },
      requireDeposit: false,
      depositType: 'percentage',
      depositAmount: 0,
      depositPercentage: 30,
      depositDueDaysBeforeEvent: 7,
      eventDate: undefined,
    });
    setItems([createDefaultItem()]);
    setShowDepositSection(false);
    setShowPreview(false);
  }, []);

  // Load existing invoice for editing
  const loadInvoice = useCallback((invoice: {
    invoice_number?: string;
    issue_date: string;
    due_date: string;
    status: string;
    notes?: string;
    invoice_recipients?: Array<{
      recipient_name: string;
      recipient_email: string;
      recipient_phone?: string;
      recipient_address?: string;
      recipient_abn?: string;
    }>;
    invoice_items?: Array<{
      id: string;
      description: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      gst_treatment?: string;
      is_deduction?: boolean;
    }>;
    deposit_amount?: number;
    deposit_percentage?: number;
    deposit_due_days_before_event?: number;
    event_date?: string;
  }) => {
    const recipient = invoice.invoice_recipients?.[0];
    const hasDeposit = !!(invoice.deposit_amount || invoice.deposit_percentage);

    setInvoiceData({
      client: null,
      clientName: recipient?.recipient_name || '',
      clientEmail: recipient?.recipient_email || '',
      clientPhone: recipient?.recipient_phone || '',
      clientAddress: recipient?.recipient_address || '',
      clientABN: recipient?.recipient_abn || '',
      clientGstRegistered: false, // Would need to look this up
      issueDate: new Date(invoice.issue_date),
      dueDate: new Date(invoice.due_date),
      notes: invoice.notes || '',
      status: invoice.status as 'draft' | 'sent' | 'paid',
      emailRecipients: {
        ccEmails: [],
        bccEmails: [],
      },
      requireDeposit: hasDeposit,
      depositType: invoice.deposit_percentage ? 'percentage' : 'amount',
      depositAmount: invoice.deposit_amount || 0,
      depositPercentage: invoice.deposit_percentage || 30,
      depositDueDaysBeforeEvent: invoice.deposit_due_days_before_event || 7,
      eventDate: invoice.event_date ? new Date(invoice.event_date) : undefined,
    });

    // Load items
    // Note: is_deduction column may not exist - detect by negative total_price
    if (invoice.invoice_items && invoice.invoice_items.length > 0) {
      setItems(invoice.invoice_items.map(item => {
        const isDeduction = item.is_deduction || item.total_price < 0 || item.subtotal < 0;
        return {
          id: item.id,
          description: item.description,
          quantity: item.quantity,
          rate: Math.abs(item.unit_price), // Store as positive
          total: Math.abs(item.total_price), // Store as positive, isDeduction flag handles sign
          gstTreatment: (item.gst_treatment as GstTreatment) || 'no_gst',
          isDeduction,
        };
      }));
    }

    if (hasDeposit) {
      setShowDepositSection(true);
    }
  }, []);

  return {
    // State
    invoiceData,
    items,
    showDepositSection,
    showPreview,

    // Calculated values
    subtotal,
    taxAmount,
    total,
    depositAmount: calculateDepositAmount,
    remainingAmount,
    defaultGstTreatment,

    // Actions
    updateInvoiceData,
    selectClient,
    updateCcEmails,
    updateBccEmails,
    addItem,
    addDeduction,
    removeItem,
    updateItem,
    setShowDepositSection,
    setShowPreview,

    // Utilities
    validateForm,
    resetForm,
    loadInvoice,
  };
};

export default useInvoiceFormState;
