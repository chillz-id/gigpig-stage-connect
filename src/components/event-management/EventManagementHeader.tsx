/**
 * EventManagementHeader Component (Presentational)
 *
 * Displays event management header with stats
 * NO "Deals count" stat per user feedback
 * Revenue only shown if user has permission
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle2, DollarSign } from 'lucide-react';

export interface ShortlistStats {
  total_applications: number;
  shortlisted_count: number;
  pending_shortlisted: number;
  accepted_shortlisted: number;
}

interface EventManagementHeaderProps {
  eventId: string;
  eventName: string;
  stats: ShortlistStats;
  canViewFinancials?: boolean;
  totalRevenue?: number;
}

export function EventManagementHeader({
  eventName,
  stats,
  canViewFinancials = false,
  totalRevenue
}: EventManagementHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Event Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {eventName}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Event Management Dashboard
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Applications */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Total Applications
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total_applications}
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* Shortlisted */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Shortlisted
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.shortlisted_count}
              </span>
              {stats.pending_shortlisted > 0 && (
                <Badge className="professional-button w-fit text-xs">
                  {stats.pending_shortlisted} pending
                </Badge>
              )}
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900">
              <Users className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        {/* Confirmed */}
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Confirmed
              </span>
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.accepted_shortlisted}
              </span>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* Revenue (conditional) */}
        {canViewFinancials && totalRevenue !== undefined && (
          <Card>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Total Revenue
                </span>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${totalRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default EventManagementHeader;
