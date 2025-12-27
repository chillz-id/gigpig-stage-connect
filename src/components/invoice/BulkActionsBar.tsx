import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mail, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  FileDown, 
  ChevronDown,
  X,
  AlertCircle
} from 'lucide-react';
import { BulkOperationProgress } from '@/types/bulkOperations';
import { InvoiceStatus } from '@/types/invoice';
import { BulkOperationErrorsDialog } from './BulkOperationErrorsDialog';

interface BulkActionsBarProps {
  selectedCount: number;
  isProcessing: boolean;
  progress: BulkOperationProgress | null;
  onSendEmails: () => Promise<void>;
  onMarkPaid: () => Promise<void>;
  onMarkUnpaid: () => Promise<void>;
  onUpdateStatus: (status: InvoiceStatus) => Promise<void>;
  onDeleteDrafts: () => Promise<void>;
  onExportCSV: () => Promise<void>;
  onExportPDF: () => Promise<void>;
  onClearSelection: () => void;
  onCancel: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  isProcessing,
  progress,
  onSendEmails,
  onMarkPaid,
  onMarkUnpaid,
  onUpdateStatus,
  onDeleteDrafts,
  onExportCSV,
  onExportPDF,
  onClearSelection,
  onCancel
}) => {
  const [showProgress, setShowProgress] = useState(true);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  if (selectedCount === 0 && !isProcessing) {
    return null;
  }

  const progressPercentage = progress 
    ? (progress.processed / progress.total) * 100 
    : 0;

  return (
    <div className="sticky top-0 z-10 bg-background border-b shadow-sm">
      <div className="p-4 space-y-3">
        {/* Selection and actions bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">
              {selectedCount} invoice{selectedCount !== 1 ? 's' : ''} selected
            </span>
            
            {!isProcessing && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearSelection}
                >
                  Clear selection
                </Button>

                <div className="flex items-center gap-2">
                  {/* Email action */}
                  <Button
                    className="professional-button"
                    size="sm"
                    onClick={onSendEmails}
                    disabled={selectedCount === 0}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Emails
                  </Button>

                  {/* Status actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="professional-button" size="sm">
                        Update Status
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onMarkPaid}>
                        <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                        Mark as Paid
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onMarkUnpaid}>
                        <XCircle className="w-4 h-4 mr-2 text-amber-600" />
                        Mark as Unpaid
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onUpdateStatus('sent')}>
                        Update to Sent
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus('overdue')}>
                        Update to Overdue
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUpdateStatus('cancelled')}>
                        Update to Cancelled
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Export actions dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button className="professional-button" size="sm">
                        <FileDown className="w-4 h-4 mr-2" />
                        Export
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={onExportCSV}>
                        Export as CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={onExportPDF}>
                        Export as PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Delete action */}
                  <Button
                    className="professional-button text-red-600 hover:text-red-700"
                    size="sm"
                    onClick={onDeleteDrafts}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Drafts
                  </Button>
                </div>
              </>
            )}
          </div>

          {isProcessing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>

        {/* Progress indicator */}
        {isProcessing && progress && showProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Processing {progress.operation.replace('-', ' ')}...
              </span>
              <span className="font-medium">
                {progress.processed} / {progress.total}
              </span>
            </div>
            
            <Progress value={progressPercentage} className="h-2" />
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {progress.succeeded} succeeded, {progress.failed} failed
              </span>
              {progress.failed > 0 && (
                <Button
                  variant="link"
                  size="sm"
                  className="text-xs h-auto p-0"
                  onClick={() => setShowErrorDialog(true)}
                >
                  View errors
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Completion alert */}
        {progress && progress.status === 'completed' && showProgress && (
          <Alert className={progress.failed > 0 ? 'border-amber-200' : 'border-green-200'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {progress.failed === 0 
                  ? `Successfully processed ${progress.succeeded} invoices`
                  : `Processed ${progress.succeeded} invoices with ${progress.failed} errors`
                }
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProgress(false)}
                className="h-auto p-1"
              >
                <X className="w-3 h-3" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Error details dialog */}
      <BulkOperationErrorsDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        progress={progress}
      />
    </div>
  );
};