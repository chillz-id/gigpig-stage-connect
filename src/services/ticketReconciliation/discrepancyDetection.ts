import { PlatformType } from '@/types/ticketSales';

import { findDuplicateSales } from './dataFetchers';
import {
  LocalSale,
  PlatformSale,
  ReconciliationConfig,
  ReconciliationDiscrepancy,
} from './types';

interface DetectionParams {
  eventId: string;
  platform: PlatformType;
  localSales: LocalSale[];
  platformSales: PlatformSale[];
  config: ReconciliationConfig;
}

export function detectDiscrepancies({
  eventId,
  platform,
  localSales,
  platformSales,
  config,
}: DetectionParams): ReconciliationDiscrepancy[] {
  const discrepancies: ReconciliationDiscrepancy[] = [];
  const currentTimestamp = () => new Date().toISOString();

  const localSalesMap = new Map(localSales.map(sale => [sale.platform_order_id, sale]));
  const platformSalesMap = new Map(platformSales.map(sale => [sale.orderId, sale]));

  for (const platformSale of platformSales) {
    if (!localSalesMap.has(platformSale.orderId)) {
      discrepancies.push({
        id: crypto.randomUUID(),
        eventId,
        platform,
        type: 'missing_sale',
        severity: 'high',
        platformData: platformSale,
        detectedAt: currentTimestamp(),
      });
    }
  }

  for (const localSale of localSales) {
    const platformSale = platformSalesMap.get(localSale.platform_order_id);

    if (!platformSale) {
      discrepancies.push({
        id: crypto.randomUUID(),
        eventId,
        platform,
        type: 'data_inconsistency',
        severity: 'medium',
        localData: localSale,
        detectedAt: currentTimestamp(),
      });
      continue;
    }

    const amountDiff = Math.abs(localSale.total_amount - platformSale.totalAmount);
    if (amountDiff > config.autoCorrectThreshold) {
      discrepancies.push({
        id: crypto.randomUUID(),
        eventId,
        platform,
        type: 'amount_mismatch',
        severity: amountDiff > 10 ? 'high' : 'medium',
        localData: localSale,
        platformData: platformSale,
        difference: {
          field: 'total_amount',
          localValue: localSale.total_amount,
          platformValue: platformSale.totalAmount,
        },
        detectedAt: currentTimestamp(),
      });
    }
  }

  const duplicates = findDuplicateSales(localSales, config.duplicateTimeWindow);
  for (const duplicate of duplicates) {
    discrepancies.push({
      id: crypto.randomUUID(),
      eventId,
      platform,
      type: 'duplicate_sale',
      severity: 'medium',
      localData: duplicate,
      detectedAt: currentTimestamp(),
    });
  }

  return discrepancies;
}

