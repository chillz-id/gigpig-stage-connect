import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, RefreshCw, AlertCircle, CheckCircle, XCircle, FileText, Download } from 'lucide-react';
import { useReconciliation } from '@/hooks/useReconciliation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReconciliationDashboardProps {
  eventId: string;
}

export function ReconciliationDashboard({ eventId }: ReconciliationDashboardProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [isReconciling, setIsReconciling] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    reconciliationStats,
    reconciliationHistory,
    unresolvedDiscrepancies,
    isLoading,
    runReconciliation,
    resolveDiscrepancy,
    refreshData,
  } = useReconciliation(eventId);

  const handleRunReconciliation = async () => {
    setIsReconciling(true);
    try {
      await runReconciliation(selectedPlatform === 'all' ? undefined : selectedPlatform);
      toast.success('Reconciliation completed successfully');
      await refreshData();
    } catch (error) {
      toast.error('Failed to run reconciliation');
      console.error('Reconciliation error:', error);
    } finally {
      setIsReconciling(false);
    }
  };

  const handleResolveDiscrepancy = async (discrepancyId: string, resolution: string, notes: string) => {
    try {
      await resolveDiscrepancy(discrepancyId, resolution, notes);
      toast.success('Discrepancy resolved');
      await refreshData();
    } catch (error) {
      toast.error('Failed to resolve discrepancy');
      console.error('Resolution error:', error);
    }
  };

  const getHealthBadgeVariant = (health: string) => {
    switch (health) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getSeverityBadgeVariant = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'high':
        return 'warning';
      case 'critical':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ticket Sales Reconciliation</h2>
        <div className="flex gap-2">
          <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="humanitix">Humanitix</SelectItem>
              <SelectItem value="eventbrite">Eventbrite</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleRunReconciliation}
            disabled={isReconciling}
          >
            {isReconciling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reconciling...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Reconciliation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reconciliationStats ? `${(reconciliationStats.resolutionRate * 100).toFixed(1)}%` : '0%'}
            </div>
            <Progress 
              value={reconciliationStats ? reconciliationStats.resolutionRate * 100 : 0} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg. Discrepancies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reconciliationStats?.averageDiscrepancies.toFixed(1) || '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per reconciliation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Unresolved Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {unresolvedDiscrepancies?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Last Reconciliation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {reconciliationHistory && reconciliationHistory.length > 0
                ? format(new Date(reconciliationHistory[0].start_time), 'MMM dd, HH:mm')
                : 'Never'}
            </div>
            {reconciliationHistory && reconciliationHistory.length > 0 && (
              <Badge 
                variant={getHealthBadgeVariant(reconciliationHistory[0].sync_health)}
                className="mt-1"
              >
                {reconciliationHistory[0].sync_health}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discrepancies">Discrepancies</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Platform Breakdown */}
          {reconciliationStats?.platformBreakdown && (
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>Reconciliation metrics by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(reconciliationStats.platformBreakdown).map(([platform, stats]: [string, any]) => (
                    <div key={platform} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium capitalize">{platform}</span>
                        <Badge variant="outline">{stats.reports} reports</Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Discrepancies: </span>
                          <span className="font-medium">{stats.discrepancies}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Resolved: </span>
                          <span className="font-medium text-green-600">{stats.resolved}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Health Trend */}
          {reconciliationStats?.healthTrend && reconciliationStats.healthTrend.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Health Trend</CardTitle>
                <CardDescription>Recent reconciliation health status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {reconciliationStats.healthTrend.slice(0, 5).map((trend: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(trend.date), 'MMM dd, HH:mm')}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getHealthBadgeVariant(trend.health)}>
                          {trend.health}
                        </Badge>
                        <span className="text-sm">{trend.discrepancies} issues</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discrepancies" className="space-y-4">
          {unresolvedDiscrepancies && unresolvedDiscrepancies.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Unresolved Discrepancies</CardTitle>
                <CardDescription>Issues requiring manual review or correction</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Detected</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unresolvedDiscrepancies.map((discrepancy: any) => (
                      <TableRow key={discrepancy.id}>
                        <TableCell>
                          <span className="font-medium">
                            {discrepancy.type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </span>
                        </TableCell>
                        <TableCell className="capitalize">{discrepancy.platform}</TableCell>
                        <TableCell>
                          {discrepancy.difference && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Local: </span>
                              ${discrepancy.difference.localValue}
                              <br />
                              <span className="text-muted-foreground">Platform: </span>
                              ${discrepancy.difference.platformValue}
                            </div>
                          )}
                          {discrepancy.type === 'missing_sale' && (
                            <div className="text-sm">
                              Order ID: {discrepancy.platformData?.orderId}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getSeverityBadgeVariant(discrepancy.severity)}>
                            {discrepancy.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(discrepancy.detected_at), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResolveDiscrepancy(discrepancy.id, 'ignored', 'Reviewed and ignored')}
                            >
                              Ignore
                            </Button>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleResolveDiscrepancy(discrepancy.id, 'manual_review', 'Marked for review')}
                            >
                              Review
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>All Clear!</AlertTitle>
              <AlertDescription>
                No unresolved discrepancies found. Your ticket sales data is in sync.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {reconciliationHistory && reconciliationHistory.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation History</CardTitle>
                <CardDescription>Recent reconciliation reports</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Discrepancies</TableHead>
                      <TableHead>Revenue Diff</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationHistory.map((report: any) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          {format(new Date(report.start_time), 'MMM dd, HH:mm')}
                        </TableCell>
                        <TableCell className="capitalize">{report.platform}</TableCell>
                        <TableCell>
                          <Badge variant={report.status === 'completed' ? 'success' : 'destructive'}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getHealthBadgeVariant(report.sync_health)}>
                            {report.sync_health}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.discrepancies_resolved}/{report.discrepancies_found}
                        </TableCell>
                        <TableCell>
                          ${Math.abs(report.total_local_revenue - report.total_platform_revenue).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No History</AlertTitle>
              <AlertDescription>
                No reconciliation reports found. Run your first reconciliation to start tracking.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}