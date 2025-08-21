import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Invoice, InvoiceItem } from '@/types/invoice';
import { pdfService } from '@/services/pdfService';

interface UsePDFGenerationReturn {
  isGenerating: boolean;
  error: string | null;
  generatePDF: (invoice: Invoice, items?: InvoiceItem[]) => Promise<void>;
  generatePDFBlob: (invoice: Invoice, items?: InvoiceItem[]) => Promise<Blob | null>;
  generatePDFURL: (invoice: Invoice, items?: InvoiceItem[]) => Promise<string | null>;
  clearError: () => void;
}

export const usePDFGeneration = (): UsePDFGenerationReturn => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const generatePDF = useCallback(async (invoice: Invoice, items: InvoiceItem[] = []) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Validate invoice data
      pdfService.validateInvoiceData(invoice);
      
      // Generate custom filename
      const filename = pdfService.formatFilename(invoice);
      
      // Generate and download PDF
      await pdfService.generateInvoicePDF(invoice, items, {
        filename,
        download: true,
      });
      
      toast.success('PDF generated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generatePDFBlob = useCallback(async (invoice: Invoice, items: InvoiceItem[] = []) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Validate invoice data
      pdfService.validateInvoiceData(invoice);
      
      // Generate PDF blob
      const blob = await pdfService.generateInvoicePDF(invoice, items, {
        download: false,
        returnBlob: true,
      });
      
      return blob || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generatePDFURL = useCallback(async (invoice: Invoice, items: InvoiceItem[] = []) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Validate invoice data
      pdfService.validateInvoiceData(invoice);
      
      // Generate PDF URL
      const url = await pdfService.generateInvoicePDFURL(invoice, items);
      
      return url;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    isGenerating,
    error,
    generatePDF,
    generatePDFBlob,
    generatePDFURL,
    clearError,
  };
};