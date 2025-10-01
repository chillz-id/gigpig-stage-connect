// Custom hook for invoice form state management
import { useState, useMemo } from 'react';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export interface InvoiceFormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientABN: string;
  issueDate: Date;
  dueDate: Date;
  notes: string;
  taxRate: number;
  status: 'draft' | 'sent' | 'paid';
  // Deposit fields
  requireDeposit: boolean;
  depositType: 'amount' | 'percentage';
  depositAmount: number;
  depositPercentage: number;
  depositDueDaysBeforeEvent: number;
  eventDate?: Date;
}

export const useInvoiceFormState = () => {
  const [invoiceData, setInvoiceData] = useState<InvoiceFormData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientAddress: '',
    clientABN: '',
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    notes: '',
    taxRate: 10,
    status: 'draft',
    // Deposit fields
    requireDeposit: false,
    depositType: 'percentage',
    depositAmount: 0,
    depositPercentage: 30,
    depositDueDaysBeforeEvent: 7,
    eventDate: undefined
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, total: 0 }
  ]);

  const [showDepositSection, setShowDepositSection] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Calculated values
  const subtotal = useMemo(() => 
    items.reduce((sum, item) => sum + item.total, 0), 
    [items]
  );

  const taxAmount = useMemo(() => 
    subtotal * (invoiceData.taxRate / 100), 
    [subtotal, invoiceData.taxRate]
  );

  const total = useMemo(() => 
    subtotal + taxAmount, 
    [subtotal, taxAmount]
  );

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
  const updateInvoiceData = (updates: Partial<InvoiceFormData>) => {
    setInvoiceData(prev => ({ ...prev, ...updates }));
  };

  // Item management functions
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      total: 0
    };
    setItems(prev => [...prev, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(prev => prev.map(item => {
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

  // Validation
  const validateForm = (): { isValid: boolean; errors: string[] } => {
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

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Reset form
  const resetForm = () => {
    setInvoiceData({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientAddress: '',
      clientABN: '',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: '',
      taxRate: 10,
      status: 'draft',
      requireDeposit: false,
      depositType: 'percentage',
      depositAmount: 0,
      depositPercentage: 30,
      depositDueDaysBeforeEvent: 7,
      eventDate: undefined
    });
    setItems([{ id: '1', description: '', quantity: 1, rate: 0, total: 0 }]);
    setShowDepositSection(false);
    setShowPreview(false);
  };

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
  };
};