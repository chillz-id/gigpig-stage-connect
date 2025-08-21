// Hook for bulk invoice operations
import { useState, useCallback, useRef } from 'react';
import { bulkInvoiceService } from '@/services/bulkInvoiceService';
import { 
  BulkOperation, 
  BulkOperationProgress, 
  BulkOperationResult,
  BulkExportOptions,
  BulkEmailOptions,
  BatchProcessingOptions,
  DEFAULT_BATCH_OPTIONS
} from '@/types/bulkOperations';
import { InvoiceStatus } from '@/types/invoice';
import { toast } from '@/hooks/use-toast';

export const useBulkInvoiceOperations = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Selection management
  const toggleInvoiceSelection = useCallback((invoiceId: string) => {
    setSelectedInvoiceIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(invoiceId)) {
        newSet.delete(invoiceId);
      } else {
        newSet.add(invoiceId);
      }
      return newSet;
    });
  }, []);

  const selectAllInvoices = useCallback((invoiceIds: string[]) => {
    setSelectedInvoiceIds(new Set(invoiceIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedInvoiceIds(new Set());
  }, []);

  // Progress handling
  const handleProgress = useCallback((progress: BulkOperationProgress) => {
    setProgress(progress);
    
    // Show toast for significant milestones
    if (progress.processed === progress.total) {
      if (progress.failed === 0) {
        toast({
          title: "Bulk operation completed",
          description: `Successfully processed ${progress.succeeded} invoices`
        });
      } else {
        toast({
          title: "Bulk operation completed with errors",
          description: `Processed ${progress.succeeded} successfully, ${progress.failed} failed`,
          variant: "destructive"
        });
      }
    }
  }, []);

  // Bulk operations
  const bulkSendEmails = useCallback(async (
    options?: BulkEmailOptions,
    batchOptions?: BatchProcessingOptions
  ): Promise<BulkOperationResult> => {
    if (selectedInvoiceIds.size === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select invoices to send",
        variant: "destructive"
      });
      throw new Error("No invoices selected");
    }

    setIsProcessing(true);
    try {
      const result = await bulkInvoiceService.bulkSendEmails(
        Array.from(selectedInvoiceIds),
        options,
        batchOptions || DEFAULT_BATCH_OPTIONS,
        handleProgress
      );
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedInvoiceIds, handleProgress]);

  const bulkMarkAsPaid = useCallback(async (
    batchOptions?: BatchProcessingOptions
  ): Promise<BulkOperationResult> => {
    if (selectedInvoiceIds.size === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select invoices to mark as paid",
        variant: "destructive"
      });
      throw new Error("No invoices selected");
    }

    setIsProcessing(true);
    try {
      const result = await bulkInvoiceService.bulkMarkAsPaid(
        Array.from(selectedInvoiceIds),
        batchOptions || DEFAULT_BATCH_OPTIONS,
        handleProgress
      );
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedInvoiceIds, handleProgress]);

  const bulkMarkAsUnpaid = useCallback(async (
    batchOptions?: BatchProcessingOptions
  ): Promise<BulkOperationResult> => {
    if (selectedInvoiceIds.size === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select invoices to mark as unpaid",
        variant: "destructive"
      });
      throw new Error("No invoices selected");
    }

    setIsProcessing(true);
    try {
      const result = await bulkInvoiceService.bulkMarkAsUnpaid(
        Array.from(selectedInvoiceIds),
        batchOptions || DEFAULT_BATCH_OPTIONS,
        handleProgress
      );
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedInvoiceIds, handleProgress]);

  const bulkUpdateStatus = useCallback(async (
    newStatus: InvoiceStatus,
    batchOptions?: BatchProcessingOptions
  ): Promise<BulkOperationResult> => {
    if (selectedInvoiceIds.size === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select invoices to update",
        variant: "destructive"
      });
      throw new Error("No invoices selected");
    }

    setIsProcessing(true);
    try {
      const result = await bulkInvoiceService.bulkUpdateStatus(
        Array.from(selectedInvoiceIds),
        newStatus,
        batchOptions || DEFAULT_BATCH_OPTIONS,
        handleProgress
      );
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedInvoiceIds, handleProgress]);

  const bulkDeleteDrafts = useCallback(async (
    batchOptions?: BatchProcessingOptions
  ): Promise<BulkOperationResult> => {
    if (selectedInvoiceIds.size === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select draft invoices to delete",
        variant: "destructive"
      });
      throw new Error("No invoices selected");
    }

    if (!confirm(`Are you sure you want to delete ${selectedInvoiceIds.size} draft invoices? This action cannot be undone.`)) {
      throw new Error("Operation cancelled");
    }

    setIsProcessing(true);
    try {
      const result = await bulkInvoiceService.bulkDeleteDrafts(
        Array.from(selectedInvoiceIds),
        batchOptions || DEFAULT_BATCH_OPTIONS,
        handleProgress
      );
      
      if (result.succeeded > 0) {
        clearSelection();
      }
      
      return result;
    } finally {
      setIsProcessing(false);
    }
  }, [selectedInvoiceIds, handleProgress, clearSelection]);

  const bulkExportCSV = useCallback(async (
    options?: BulkExportOptions
  ): Promise<void> => {
    if (selectedInvoiceIds.size === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select invoices to export",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const csvContent = await bulkInvoiceService.bulkExportCSV(
        Array.from(selectedInvoiceIds),
        options,
        handleProgress
      );

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `Exported ${selectedInvoiceIds.size} invoices to CSV`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export invoices",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedInvoiceIds, handleProgress]);

  const bulkExportPDF = useCallback(async (
    options?: BulkExportOptions
  ): Promise<void> => {
    if (selectedInvoiceIds.size === 0) {
      toast({
        title: "No invoices selected",
        description: "Please select invoices to export",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const pdfBlob = await bulkInvoiceService.bulkExportPDF(
        Array.from(selectedInvoiceIds),
        options,
        handleProgress
      );

      // Create and download PDF file
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoices_export_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export completed",
        description: `Exported ${selectedInvoiceIds.size} invoices to PDF`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to export invoices",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedInvoiceIds, handleProgress]);

  const cancelOperation = useCallback(() => {
    bulkInvoiceService.cancelCurrentOperation();
    setIsProcessing(false);
    toast({
      title: "Operation cancelled",
      description: "The bulk operation has been cancelled"
    });
  }, []);

  return {
    // Selection state
    selectedInvoiceIds,
    selectedCount: selectedInvoiceIds.size,
    isProcessing,
    progress,

    // Selection actions
    toggleInvoiceSelection,
    selectAllInvoices,
    clearSelection,

    // Bulk operations
    bulkSendEmails,
    bulkMarkAsPaid,
    bulkMarkAsUnpaid,
    bulkUpdateStatus,
    bulkDeleteDrafts,
    bulkExportCSV,
    bulkExportPDF,
    cancelOperation
  };
};