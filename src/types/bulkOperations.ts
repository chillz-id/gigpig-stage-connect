// Bulk operations types for invoice management
export type BulkOperation = 
  | 'send-email'
  | 'mark-paid'
  | 'mark-unpaid'
  | 'delete-draft'
  | 'export-csv'
  | 'export-pdf'
  | 'update-status';

export interface BulkOperationProgress {
  operation: BulkOperation;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  errors: Array<{
    invoiceId: string;
    invoiceNumber: string;
    error: string;
  }>;
  status: 'idle' | 'processing' | 'completed' | 'cancelled' | 'error';
  startedAt?: Date;
  completedAt?: Date;
}

export interface BulkOperationResult {
  operation: BulkOperation;
  success: boolean;
  processed: number;
  succeeded: number;
  failed: number;
  errors?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    error: string;
  }>;
}

export interface BulkExportOptions {
  format: 'csv' | 'pdf';
  includeItems?: boolean;
  includePayments?: boolean;
  groupByStatus?: boolean;
}

export interface BulkEmailOptions {
  subject?: string;
  message?: string;
  attachPdf?: boolean;
  cc?: string[];
  bcc?: string[];
}

export interface BatchProcessingOptions {
  batchSize: number;
  delayBetweenBatches: number;
  maxRetries: number;
  continueOnError: boolean;
}

export const DEFAULT_BATCH_OPTIONS: BatchProcessingOptions = {
  batchSize: 10,
  delayBetweenBatches: 1000, // 1 second
  maxRetries: 3,
  continueOnError: true
};