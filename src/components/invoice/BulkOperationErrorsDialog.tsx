import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Download } from 'lucide-react';
import { BulkOperationProgress } from '@/types/bulkOperations';

interface BulkOperationErrorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  progress: BulkOperationProgress | null;
}

export const BulkOperationErrorsDialog: React.FC<BulkOperationErrorsDialogProps> = ({
  isOpen,
  onClose,
  progress
}) => {
  if (!progress || progress.errors.length === 0) {
    return null;
  }

  const downloadErrorReport = () => {
    const errorReport = [
      `Bulk Operation Error Report`,
      `Operation: ${progress.operation}`,
      `Date: ${new Date().toLocaleString()}`,
      `Total Processed: ${progress.processed}`,
      `Succeeded: ${progress.succeeded}`,
      `Failed: ${progress.failed}`,
      ``,
      `Error Details:`,
      `Invoice Number,Error Message`,
      ...progress.errors.map(error => 
        `"${error.invoiceNumber}","${error.error}"`
      )
    ].join('\n');

    const blob = new Blob([errorReport], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_operation_errors_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            Bulk Operation Errors
          </DialogTitle>
          <DialogDescription>
            {progress.failed} invoice{progress.failed !== 1 ? 's' : ''} failed during the {progress.operation.replace('-', ' ')} operation
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3">
            {progress.errors.map((error, index) => (
              <div
                key={index}
                className="p-3 border rounded-lg bg-red-50 border-red-200"
              >
                <div className="font-medium text-sm text-red-900">
                  Invoice {error.invoiceNumber}
                </div>
                <div className="text-sm text-red-700 mt-1">
                  {error.error}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={downloadErrorReport}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};