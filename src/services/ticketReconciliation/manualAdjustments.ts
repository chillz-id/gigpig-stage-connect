import { PlatformType } from '@/types/ticketSales';

import {
  applyManualAdjustmentMutation,
  logReconciliationAction,
  markDiscrepancyResolved,
} from './persistence';
import { ManualAdjustment } from './types';

export async function manuallyResolveDiscrepancy(
  discrepancyId: string,
  resolution: 'ignored' | 'platform_updated' | 'manual_review',
  notes: string
): Promise<void> {
  await markDiscrepancyResolved(discrepancyId, resolution, notes);
}

export async function createManualAdjustment(
  eventId: string,
  platform: PlatformType,
  adjustment: ManualAdjustment
): Promise<void> {
  await logReconciliationAction(
    eventId,
    `manual_${adjustment.type}`,
    adjustment.reason,
    adjustment
  );

  await applyManualAdjustmentMutation(eventId, platform, adjustment);
}

