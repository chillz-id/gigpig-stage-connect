/**
 * DealList Component (Presentational)
 *
 * Grouped list of deals with collapsible sections
 */

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { DealData } from '@/types/deal';

interface DealListProps {
  deals: DealData[];
  renderCard: (deal: DealData) => React.ReactNode;
  emptyMessage?: string;
}

export function DealList({
  deals,
  renderCard,
  emptyMessage = 'No deals created yet'
}: DealListProps) {
  // Group deals by status
  const groupedDeals = React.useMemo(() => {
    const pending = deals.filter((d) => d.status === 'pending');
    const confirmed = deals.filter((d) => d.status === 'confirmed');
    const rejected = deals.filter((d) => d.status === 'rejected');

    return { pending, confirmed, rejected };
  }, [deals]);

  if (deals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-6 mb-4">
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {emptyMessage}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create deals to split revenue with partners
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full w-full">
      <div className="space-y-4 p-4">
        <Accordion type="multiple" defaultValue={['pending', 'confirmed']} className="space-y-4">
          {/* Pending Deals */}
          {groupedDeals.pending.length > 0 && (
            <AccordionItem
              value="pending"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Pending Confirmation
                  </span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                    {groupedDeals.pending.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {groupedDeals.pending.map((deal) => (
                  <div key={deal.id}>{renderCard(deal)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Confirmed Deals */}
          {groupedDeals.confirmed.length > 0 && (
            <AccordionItem
              value="confirmed"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Confirmed
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {groupedDeals.confirmed.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {groupedDeals.confirmed.map((deal) => (
                  <div key={deal.id}>{renderCard(deal)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Rejected Deals */}
          {groupedDeals.rejected.length > 0 && (
            <AccordionItem
              value="rejected"
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    Rejected
                  </span>
                  <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {groupedDeals.rejected.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {groupedDeals.rejected.map((deal) => (
                  <div key={deal.id}>{renderCard(deal)}</div>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </div>
    </ScrollArea>
  );
}

export default DealList;
