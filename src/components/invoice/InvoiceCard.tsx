
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, MoreVertical, CreditCard, Link, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { Invoice } from '@/types/invoice';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { stripePaymentService } from '@/services/stripeService';
import { toast } from 'sonner';

interface InvoiceCardProps {
  invoice: Invoice;
  onDelete: (invoiceId: string) => void;
  onView?: (invoice: Invoice) => void;
  onEdit?: (invoice: Invoice) => void;
  onPaymentLinkCreate?: (invoice: Invoice) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onDelete, onView, onEdit, onPaymentLinkCreate }) => {
  const [paymentLink, setPaymentLink] = useState<{ url: string; status: string } | null>(null);
  const [isCreatingPaymentLink, setIsCreatingPaymentLink] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loadingPaymentInfo, setLoadingPaymentInfo] = useState(false);

  const loadPaymentInfo = useCallback(async () => {
    try {
      setLoadingPaymentInfo(true);
      
      // Initialize Stripe if not already done
      if (!stripePaymentService.isInitialized()) {
        await stripePaymentService.initializeFromEnv();
      }
      
      // Get existing payment link
      const existingLink = await stripePaymentService.getPaymentLink(invoice.id);
      setPaymentLink(existingLink);
      
      // Get payment status
      const status = await stripePaymentService.getPaymentStatus(invoice.id);
      setPaymentStatus(status);
    } catch (error) {
      console.error('Failed to load payment info:', error);
    } finally {
      setLoadingPaymentInfo(false);
    }
  }, [invoice]);

  // Load payment information when component mounts
  useEffect(() => {
    if (invoice.status === 'sent' || invoice.status === 'overdue') {
      loadPaymentInfo();
    }
  }, [invoice.status, loadPaymentInfo]);

  const handleCreatePaymentLink = async () => {
    try {
      setIsCreatingPaymentLink(true);
      
      // Initialize Stripe if not already done
      if (!stripePaymentService.isInitialized()) {
        await stripePaymentService.initializeFromEnv();
      }
      
      const response = await stripePaymentService.createPaymentLink(invoice);
      setPaymentLink({ url: response.url, status: 'active' });
      
      toast.success('Payment link created successfully!');
      onPaymentLinkCreate?.(invoice);
    } catch (error) {
      console.error('Failed to create payment link:', error);
      toast.error('Failed to create payment link. Please try again.');
    } finally {
      setIsCreatingPaymentLink(false);
    }
  };

  const handleCopyPaymentLink = async () => {
    if (paymentLink?.url) {
      try {
        await navigator.clipboard.writeText(paymentLink.url);
        toast.success('Payment link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy payment link');
      }
    }
  };

  const handleOpenPaymentLink = () => {
    if (paymentLink?.url) {
      window.open(paymentLink.url, '_blank');
    }
  };

  const canCreatePaymentLink = () => {
    return (invoice.status === 'sent' || invoice.status === 'overdue') && !paymentLink;
  };

  const showPaymentActions = () => {
    return invoice.status !== 'paid' && invoice.status !== 'draft' && invoice.status !== 'cancelled';
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500';
      case 'sent': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'overdue': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-400';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <h3 className="text-lg font-semibold break-all">{invoice.invoice_number}</h3>
              <Badge className={`${getStatusColor(invoice.status)} w-fit`}>
                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="break-all">
                To: {invoice.invoice_recipients[0]?.recipient_name} ({invoice.invoice_recipients[0]?.recipient_email})
              </div>
              <div className="flex flex-col sm:flex-row sm:gap-4 gap-1">
                <div>
                  Issue: {format(new Date(invoice.issue_date), 'MMM dd, yyyy')}
                </div>
                <div>
                  Due: {format(new Date(invoice.due_date), 'MMM dd, yyyy')}
                </div>
              </div>
              
              {/* Payment Status */}
              {paymentStatus && (
                <div className="flex items-center gap-2 text-xs">
                  {paymentStatus.status === 'completed' ? (
                    <>
                      <Check className="w-3 h-3 text-green-600" />
                      <span className="text-green-600">Paid {paymentStatus.paymentDate ? format(new Date(paymentStatus.paymentDate), 'MMM dd') : ''}</span>
                    </>
                  ) : paymentStatus.status === 'failed' ? (
                    <>
                      <X className="w-3 h-3 text-red-600" />
                      <span className="text-red-600">Payment failed</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-3 h-3 text-blue-600" />
                      <span className="text-blue-600">Payment pending</span>
                    </>
                  )}
                </div>
              )}
              
              {/* Payment Link Status */}
              {paymentLink && (
                <div className="flex items-center gap-2 text-xs">
                  <Link className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-600">
                    Payment link {paymentLink.status === 'active' ? 'active' : paymentLink.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:text-right gap-4">
            <div className="text-xl sm:text-2xl font-bold">
              {invoice.currency} {invoice.total_amount.toFixed(2)}
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden sm:flex gap-2">
              {/* Payment Actions */}
              {showPaymentActions() && (
                <div className="flex gap-2">
                  {canCreatePaymentLink() && (
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={handleCreatePaymentLink}
                      disabled={isCreatingPaymentLink}
                    >
                      <CreditCard className="w-4 h-4 mr-1" />
                      {isCreatingPaymentLink ? 'Creating...' : 'Pay Link'}
                    </Button>
                  )}
                  
                  {paymentLink && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCopyPaymentLink}
                        title="Copy payment link"
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleOpenPaymentLink}
                        title="Open payment link"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              )}
              
              {/* Standard Actions */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onView?.(invoice)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onEdit?.(invoice)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => onDelete(invoice.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Mobile Actions - Dropdown Menu */}
            <div className="sm:hidden flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {/* Payment Actions */}
                  {showPaymentActions() && (
                    <>
                      {canCreatePaymentLink() && (
                        <DropdownMenuItem 
                          onClick={handleCreatePaymentLink}
                          disabled={isCreatingPaymentLink}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          {isCreatingPaymentLink ? 'Creating...' : 'Create Payment Link'}
                        </DropdownMenuItem>
                      )}
                      
                      {paymentLink && (
                        <>
                          <DropdownMenuItem onClick={handleCopyPaymentLink}>
                            <Link className="w-4 h-4 mr-2" />
                            Copy Payment Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleOpenPaymentLink}>
                            <Eye className="w-4 h-4 mr-2" />
                            Open Payment Link
                          </DropdownMenuItem>
                        </>
                      )}
                    </>
                  )}
                  
                  {/* Standard Actions */}
                  <DropdownMenuItem onClick={() => onView?.(invoice)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEdit?.(invoice)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(invoice.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
