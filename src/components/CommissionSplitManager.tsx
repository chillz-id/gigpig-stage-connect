import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { usePayments } from '../hooks/usePayments';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, Users, TrendingUp, Calendar, Download, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface CommissionSplit {
  id: string;
  payment_record_id: string;
  recipient_type: string;
  recipient_id?: string;
  split_percentage: number;
  split_amount: number;
  split_status: string;
  payout_method?: string;
  payout_date?: string;
  payout_reference?: string;
  created_at: string;
  payment_record?: {
    amount: number;
    currency: string;
    payment_date: string;
    invoice?: {
      invoice_number: string;
    };
  };
  recipient?: {
    name: string;
    email: string;
  };
}

interface PayoutRequest {
  splitId: string;
  payoutMethod: string;
  payoutReference?: string;
}

export const CommissionSplitManager: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedSplits, setSelectedSplits] = useState<string[]>([]);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [bulkPayoutMethod, setBulkPayoutMethod] = useState<string>('');
  const [payoutReference, setPayoutReference] = useState<string>('');

  // Fetch commission splits
  const { data: commissionSplits, isLoading } = useQuery({
    queryKey: ['commission-splits', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('commission_splits')
        .select(`
          *,
          payment_record:payment_records!inner(
            amount,
            currency,
            payment_date,
            invoice:invoices(invoice_number)
          ),
          recipient:profiles(name, email)
        `)
        .or(`recipient_id.eq.${user.id},payment_record.invoices.promoter_id.eq.${user.id},payment_record.invoices.comedian_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CommissionSplit[];
    },
    enabled: !!user?.id,
  });

  // Process payout mutation
  const processPayoutMutation = useMutation({
    mutationFn: async (request: PayoutRequest) => {
      const { error } = await supabase
        .from('commission_splits')
        .update({
          split_status: 'completed',
          payout_method: request.payoutMethod,
          payout_date: new Date().toISOString(),
          payout_reference: request.payoutReference,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.splitId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Payout processed successfully');
      queryClient.invalidateQueries({ queryKey: ['commission-splits'] });
      setSelectedSplits([]);
      setPayoutDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to process payout:', error);
      toast.error('Failed to process payout');
    },
  });

  // Bulk payout mutation
  const bulkPayoutMutation = useMutation({
    mutationFn: async ({ splitIds, payoutMethod, reference }: { 
      splitIds: string[]; 
      payoutMethod: string; 
      reference?: string; 
    }) => {
      const { error } = await supabase
        .from('commission_splits')
        .update({
          split_status: 'completed',
          payout_method: payoutMethod,
          payout_date: new Date().toISOString(),
          payout_reference: reference,
          updated_at: new Date().toISOString()
        })
        .in('id', splitIds);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedSplits.length} payouts processed successfully`);
      queryClient.invalidateQueries({ queryKey: ['commission-splits'] });
      setSelectedSplits([]);
      setPayoutDialogOpen(false);
    },
    onError: (error) => {
      console.error('Failed to process bulk payout:', error);
      toast.error('Failed to process bulk payout');
    },
  });

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    if (!commissionSplits) return null;

    const pending = commissionSplits.filter(split => split.split_status === 'pending');
    const completed = commissionSplits.filter(split => split.split_status === 'completed');

    return {
      totalSplits: commissionSplits.length,
      pendingCount: pending.length,
      completedCount: completed.length,
      pendingAmount: pending.reduce((sum, split) => sum + split.split_amount, 0),
      completedAmount: completed.reduce((sum, split) => sum + split.split_amount, 0),
      totalAmount: commissionSplits.reduce((sum, split) => sum + split.split_amount, 0),
    };
  }, [commissionSplits]);

  const handleSelectSplit = (splitId: string) => {
    setSelectedSplits(prev => 
      prev.includes(splitId) 
        ? prev.filter(id => id !== splitId)
        : [...prev, splitId]
    );
  };

  const handleSelectAll = () => {
    const pendingSplits = commissionSplits?.filter(split => split.split_status === 'pending') || [];
    if (selectedSplits.length === pendingSplits.length) {
      setSelectedSplits([]);
    } else {
      setSelectedSplits(pendingSplits.map(split => split.id));
    }
  };

  const handleBulkPayout = async () => {
    if (!bulkPayoutMethod) {
      toast.error('Please select a payout method');
      return;
    }

    await bulkPayoutMutation.mutateAsync({
      splitIds: selectedSplits,
      payoutMethod: bulkPayoutMethod,
      reference: payoutReference || undefined
    });
  };

  const getRecipientTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      platform: 'default',
      agency: 'secondary',
      comedian: 'secondary',
      promoter: 'secondary',
      venue: 'secondary'
    };

    return (
      <Badge variant={variants[type] || 'secondary'} className="capitalize">
        {type}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'secondary',
      completed: 'default',
      failed: 'destructive'
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="capitalize">
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'AUD') => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading commission splits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Commission Split Management</h2>
          <p className="text-muted-foreground">
            Manage commission splits and process payouts to all parties.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button className="professional-button" onClick={() => queryClient.invalidateQueries({ queryKey: ['commission-splits'] })}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button className="professional-button">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summaryStats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center p-6">
              <Users className="h-8 w-8 text-primary mr-4" />
              <div>
                <p className="text-2xl font-bold">{summaryStats.totalSplits}</p>
                <p className="text-sm text-muted-foreground">Total Splits</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <Calendar className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{summaryStats.pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <DollarSign className="h-8 w-8 text-orange-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.pendingAmount)}</p>
                <p className="text-sm text-muted-foreground">Pending Amount</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center p-6">
              <TrendingUp className="h-8 w-8 text-green-500 mr-4" />
              <div>
                <p className="text-2xl font-bold">{formatCurrency(summaryStats.completedAmount)}</p>
                <p className="text-sm text-muted-foreground">Paid Out</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedSplits.length > 0 && (
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <p className="font-medium">{selectedSplits.length} splits selected</p>
              <Badge className="professional-button">
                Total: {formatCurrency(
                  commissionSplits
                    ?.filter(split => selectedSplits.includes(split.id))
                    .reduce((sum, split) => sum + split.split_amount, 0) || 0
                )}
              </Badge>
            </div>
            <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Bulk Payout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Process Bulk Payout</DialogTitle>
                  <DialogDescription>
                    Process payout for {selectedSplits.length} selected commission splits.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payout-method">Payout Method</Label>
                    <Select value={bulkPayoutMethod} onValueChange={setBulkPayoutMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="manual">Manual Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payout-reference">Reference (Optional)</Label>
                    <Input
                      id="payout-reference"
                      placeholder="e.g., Batch payout #123"
                      value={payoutReference}
                      onChange={(e) => setPayoutReference(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button className="professional-button" onClick={() => setPayoutDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBulkPayout}
                    disabled={!bulkPayoutMethod || bulkPayoutMutation.isPending}
                  >
                    {bulkPayoutMutation.isPending ? 'Processing...' : 'Process Payout'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Commission Splits Table */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Splits</CardTitle>
          <CardDescription>
            All commission splits from processed payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedSplits.length > 0 && 
                      selectedSplits.length === commissionSplits?.filter(split => split.split_status === 'pending').length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payout Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissionSplits?.map((split) => (
                <TableRow key={split.id}>
                  <TableCell>
                    {split.split_status === 'pending' && (
                      <input
                        type="checkbox"
                        checked={selectedSplits.includes(split.id)}
                        onChange={() => handleSelectSplit(split.id)}
                        className="rounded border-gray-300"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {split.payment_record?.invoice?.invoice_number || 'N/A'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(split.payment_record?.amount || 0, split.payment_record?.currency)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">
                      {split.recipient?.name || split.recipient_type}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {split.recipient?.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRecipientTypeBadge(split.recipient_type)}
                  </TableCell>
                  <TableCell>{split.split_percentage.toFixed(2)}%</TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(split.split_amount, split.payment_record?.currency)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(split.split_status)}
                  </TableCell>
                  <TableCell>
                    {split.payout_method ? (
                      <div>
                        <div className="font-medium capitalize">{split.payout_method.replace('_', ' ')}</div>
                        {split.payout_reference && (
                          <div className="text-sm text-muted-foreground">{split.payout_reference}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {split.payout_date ? (
                      new Date(split.payout_date).toLocaleDateString()
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {split.split_status === 'pending' && (
                      <Button
                        size="sm"
                        className="professional-button"
                        onClick={() => {
                          setSelectedSplits([split.id]);
                          setPayoutDialogOpen(true);
                        }}
                      >
                        Payout
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {commissionSplits?.length === 0 && (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Commission Splits</h3>
              <p className="text-muted-foreground">
                Commission splits will appear here once payments are processed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Commission Split Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Split Rules</CardTitle>
          <CardDescription>
            Configure how commission splits are calculated for different payment types.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Platform Commission</Label>
              <div className="flex items-center space-x-2">
                <Input type="number" placeholder="2.5" min="0" max="100" step="0.1" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Platform fee for facilitating payments
              </p>
            </div>
            <div className="space-y-2">
              <Label>Agency Commission</Label>
              <div className="flex items-center space-x-2">
                <Input type="number" placeholder="10.0" min="0" max="100" step="0.1" />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Agency/promoter management fee
              </p>
            </div>
            <div className="space-y-2">
              <Label>Comedian Split</Label>
              <div className="flex items-center space-x-2">
                <Input type="number" placeholder="87.5" disabled />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Remaining amount after commissions
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button className="professional-button">
              <Settings className="w-4 h-4 mr-2" />
              Update Commission Rules
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};