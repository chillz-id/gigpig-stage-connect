/**
 * SettlementsTab Component
 *
 * Displays and manages event settlements including:
 * - Spot payments to comedians
 * - Deal settlements with partners
 */

import { useState } from 'react';
import {
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useEventSettlements,
  useSettleSpot,
  useBatchSettleSpots,
  useRevertSpotSettlement,
  type SpotSettlement,
} from '@/hooks/useEventSettlements';
import { formatCurrency } from '@/lib/utils';

interface SettlementsTabProps {
  eventId: string;
  userId: string;
}

export default function SettlementsTab({ eventId, userId }: SettlementsTabProps) {
  const [selectedSpots, setSelectedSpots] = useState<string[]>([]);

  // Queries
  const { data, isLoading, error } = useEventSettlements(eventId);

  // Mutations
  const settleSpot = useSettleSpot();
  const batchSettle = useBatchSettleSpots();
  const revertSettlement = useRevertSpotSettlement();

  const spots = data?.spots || [];
  const deals = data?.deals || [];
  const summary = data?.summary;

  // Filter unsettled spots
  const unsettledSpots = spots.filter(s => s.payment_status !== 'paid');
  const settledSpots = spots.filter(s => s.payment_status === 'paid');

  const handleSelectSpot = (spotId: string, checked: boolean) => {
    setSelectedSpots(prev =>
      checked ? [...prev, spotId] : prev.filter(id => id !== spotId)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedSpots(checked ? unsettledSpots.map(s => s.id) : []);
  };

  const handleSettleSelected = async () => {
    if (selectedSpots.length === 0) return;
    await batchSettle.mutateAsync({ spotIds: selectedSpots, eventId });
    setSelectedSpots([]);
  };

  const handleSettleSpot = async (spotId: string) => {
    await settleSpot.mutateAsync({ spotId, eventId });
  };

  const handleRevertSpot = async (spotId: string) => {
    await revertSettlement.mutateAsync({ spotId, eventId });
  };

  const getPaymentStatusBadge = (status: 'unpaid' | 'pending' | 'paid') => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Settled</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'unpaid':
        return <Badge variant="secondary">Unpaid</Badge>;
    }
  };

  const getGSTBadge = (mode: string) => {
    switch (mode) {
      case 'inclusive':
        return <Badge variant="secondary" className="text-xs">GST Inc</Badge>;
      case 'exclusive':
        return <Badge variant="secondary" className="text-xs">GST +</Badge>;
      default:
        return null;
    }
  };

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Settlements</AlertTitle>
        <AlertDescription>
          {error instanceof Error ? error.message : 'Failed to load settlement data'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Settlements</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage payments for spots and deals
          </p>
        </div>
        {selectedSpots.length > 0 && (
          <Button
            onClick={handleSettleSelected}
            disabled={batchSettle.isPending}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Settle Selected ({selectedSpots.length})
          </Button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(summary?.totalPending || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Awaiting settlement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.totalSettled || 0)}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Payments completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spot Payments</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {summary?.settledSpotsCount || 0}/{summary?.spotsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Settled / Total paid spots
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deal Settlements</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {summary?.settledDealsCount || 0}/{summary?.dealsCount || 0}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Settled / Total deals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Spot Settlements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spot Payments
          </CardTitle>
          <CardDescription>
            Payments due to comedians for paid spots
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : spots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <DollarSign className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No Paid Spots</p>
              <p className="text-sm text-muted-foreground">
                Add paid spots to the lineup to track settlements
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={unsettledSpots.length > 0 && selectedSpots.length === unsettledSpots.length}
                        onCheckedChange={(checked) => handleSelectAll(checked === true)}
                        disabled={unsettledSpots.length === 0}
                      />
                    </TableHead>
                    <TableHead>Spot</TableHead>
                    <TableHead>Comedian</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {spots.map((spot) => (
                    <TableRow key={spot.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSpots.includes(spot.id)}
                          onCheckedChange={(checked) => handleSelectSpot(spot.id, checked === true)}
                          disabled={spot.payment_status === 'paid'}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {spot.spot_name}
                      </TableCell>
                      <TableCell>
                        {spot.comedian_name || (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium">
                            {formatCurrency(spot.payment_gross || spot.payment_amount)}
                          </span>
                          {spot.payment_tax !== null && spot.payment_tax > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (Net: {formatCurrency(spot.payment_net || 0)})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getGSTBadge(spot.gst_mode)}
                      </TableCell>
                      <TableCell>
                        {getPaymentStatusBadge(spot.payment_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        {spot.payment_status === 'paid' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevertSpot(spot.id)}
                            disabled={revertSettlement.isPending}
                          >
                            Undo
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSettleSpot(spot.id)}
                            disabled={settleSpot.isPending}
                          >
                            Settle
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deal Settlements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Deal Settlements
          </CardTitle>
          <CardDescription>
            Revenue shares and partner payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : deals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No Deals to Settle</p>
              <p className="text-sm text-muted-foreground">
                Create deals in the Deals tab to track revenue sharing and partner payments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deals.map((deal) => (
                <div key={deal.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium">{deal.deal_title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {deal.deal_type} &middot; Total: {formatCurrency(deal.total_amount)}
                      </p>
                    </div>
                    <Badge variant={deal.status === 'settled' ? 'default' : 'secondary'}>
                      {deal.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {deal.participants.map((participant) => (
                      <div
                        key={participant.id}
                        className="flex items-center justify-between rounded bg-muted/50 p-2"
                      >
                        <span className="text-sm">{participant.user_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {participant.split_percentage}%
                          </span>
                          <span className="font-medium">
                            {formatCurrency(participant.split_amount)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {participant.approval_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settlement Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>Settlement Process</CardTitle>
          <CardDescription>
            How payments are tracked and settled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Spot Payments</p>
              <p className="text-muted-foreground">
                When you add paid spots to the lineup, the payment amounts are tracked here.
                Mark spots as settled once payment has been made to the comedian.
              </p>
            </div>
            <div>
              <p className="font-medium">Deal Settlements</p>
              <p className="text-muted-foreground">
                Revenue sharing deals require approval from all participants before settlement.
                Once all parties confirm, the deal can be marked as settled.
              </p>
            </div>
            <div>
              <p className="font-medium">GST Handling</p>
              <p className="text-muted-foreground">
                GST calculations are based on each spot's configuration. Inclusive means the
                amount includes GST, while Exclusive adds GST on top of the base amount.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
