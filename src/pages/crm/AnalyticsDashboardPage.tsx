import { AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCRMAnalytics } from '@/hooks/useAnalytics';
import { RevenueChart } from '@/components/crm/RevenueChart';
import { SegmentChart } from '@/components/crm/SegmentChart';
import { ConversionFunnel } from '@/components/crm/ConversionFunnel';
import { Skeleton } from '@/components/ui/skeleton';

export const AnalyticsDashboardPage = () => {
  const { data, isLoading, isError, error } = useCRMAnalytics();

  const engagement = data?.engagement ?? {
    activeCustomers: 0,
    activeDeals: 0,
    tasksDueThisWeek: 0,
    overdueFollowUps: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Track pipeline velocity, customer segments, and follow-up workload at a glance.
          </p>
        </div>
      </div>

      {isError ? (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="flex items-center gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{error?.message ?? 'Unable to load analytics data at the moment.'}</span>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Active customers</p>
              <p className="text-2xl font-semibold">{engagement.activeCustomers}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-purple-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Active deals</p>
              <p className="text-2xl font-semibold">{engagement.activeDeals}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Tasks due this week</p>
              <p className="text-2xl font-semibold">{engagement.tasksDueThisWeek}</p>
            </div>
            <Activity className="h-8 w-8 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Overdue follow-ups</p>
              <p className="text-2xl font-semibold">{engagement.overdueFollowUps}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <RevenueChart data={data?.revenue ?? []} isLoading={isLoading} />
        <SegmentChart data={data?.segments ?? []} isLoading={isLoading} />
      </div>

      <ConversionFunnel data={data?.pipeline ?? []} isLoading={isLoading} />

      {isLoading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : null}
    </div>
  );
};
