import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Clock, Info } from 'lucide-react';

interface DealNegotiationHistoryProps {
  dealParticipants: Array<{
    id: string;
    version: number;
    split_percentage: number;
    flat_fee_amount?: number;
    approval_status: string;
    approved_at?: string;
    edit_notes?: string;
    edited_by?: string;
    edited_at?: string;
    participant: {
      name: string;
      email: string;
    };
  }>;
}

export function DealNegotiationHistory({ dealParticipants }: DealNegotiationHistoryProps) {
  // Sort by version descending (most recent first)
  const sortedHistory = [...dealParticipants].sort((a, b) => b.version - a.version);

  // Get status badge configuration
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'approved':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          text: 'Approved',
          className: 'bg-green-100 text-green-800 hover:bg-green-100',
        };
      case 'declined':
        return {
          icon: <XCircle className="h-4 w-4" />,
          text: 'Declined',
          className: 'bg-red-100 text-red-800 hover:bg-red-100',
        };
      case 'changes_requested':
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: 'Changes Requested',
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Pending',
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-100',
        };
    }
  };

  // Format split display
  const formatSplit = (item: typeof sortedHistory[0]) => {
    if (item.flat_fee_amount) {
      return `$${item.flat_fee_amount.toFixed(2)}`;
    }
    return `${item.split_percentage}%`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  // Empty state
  if (sortedHistory.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed p-8">
        <div className="text-center">
          <Info className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No changes yet</p>
        </div>
      </div>
    );
  }

  // Default to first item expanded (most recent version)
  const defaultValue = sortedHistory[0]?.id;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Negotiation History</h3>
      <Accordion type="single" collapsible defaultValue={defaultValue} className="w-full">
        {sortedHistory.map((item) => {
          const statusDisplay = getStatusDisplay(item.approval_status);
          const timestamp = item.approved_at || item.edited_at;

          return (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex w-full items-center justify-between pr-4">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">Version {item.version}</span>
                    <Badge className={statusDisplay.className}>
                      <span className="flex items-center gap-1">
                        {statusDisplay.icon}
                        {statusDisplay.text}
                      </span>
                    </Badge>
                  </div>
                  {timestamp && (
                    <span className="text-sm text-muted-foreground">
                      {formatDate(timestamp)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  {/* Participant and Split Info */}
                  <div className="space-y-2 rounded-lg bg-muted p-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Participant:</span>
                      <span className="text-sm font-medium">{item.participant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm font-medium">{item.participant.email}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm text-muted-foreground">Split:</span>
                      <span className="text-sm font-bold">{formatSplit(item)}</span>
                    </div>
                  </div>

                  {/* Edit Information */}
                  {item.edited_by && item.edited_at && (
                    <div className="rounded-lg border bg-blue-50 p-3">
                      <p className="text-sm text-blue-900">
                        Edited by <span className="font-medium">{item.edited_by}</span> on{' '}
                        {formatDate(item.edited_at)}
                      </p>
                    </div>
                  )}

                  {/* Edit Notes */}
                  {item.edit_notes && (
                    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                      <div className="flex items-start gap-2">
                        <Info className="mt-0.5 h-4 w-4 text-yellow-700" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900">Notes:</p>
                          <p className="text-sm text-yellow-800">{item.edit_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approval/Decline Timestamp */}
                  {item.approved_at && (
                    <div className="rounded-lg border bg-gray-50 p-3">
                      <p className="text-sm text-gray-700">
                        {item.approval_status === 'approved' && 'Approved on '}
                        {item.approval_status === 'declined' && 'Declined on '}
                        {item.approval_status === 'changes_requested' && 'Changes requested on '}
                        <span className="font-medium">{formatDate(item.approved_at)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
