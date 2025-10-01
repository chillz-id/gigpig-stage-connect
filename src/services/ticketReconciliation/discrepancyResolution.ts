import { ReconciliationConfig, ReconciliationDiscrepancy } from './types';
import {
  insertPlatformSale,
  logReconciliationAction,
  updateDiscrepancyRecord,
  updateSaleAmount,
} from './persistence';

export async function resolveDiscrepancies(
  discrepancies: ReconciliationDiscrepancy[],
  config: ReconciliationConfig
): Promise<number> {
  let resolved = 0;

  for (const discrepancy of discrepancies) {
    try {
      const wasResolved = await resolveDiscrepancy(discrepancy, config);
      if (wasResolved) {
        resolved += 1;
      }
    } catch (error) {
      console.error(`Failed to resolve discrepancy ${discrepancy.id}:`, error);
    }
  }

  return resolved;
}

async function resolveDiscrepancy(
  discrepancy: ReconciliationDiscrepancy,
  config: ReconciliationConfig
): Promise<boolean> {
  switch (discrepancy.type) {
    case 'missing_sale':
      if (!discrepancy.platformData) return false;
      await importMissingSale(discrepancy);
      return true;

    case 'amount_mismatch':
      if (!discrepancy.difference) return false;
      if (
        Math.abs(discrepancy.difference.localValue - discrepancy.difference.platformValue) <=
        config.autoCorrectThreshold
      ) {
        await correctAmount(discrepancy);
        return true;
      }
      break;

    case 'duplicate_sale':
    case 'data_inconsistency':
      discrepancy.resolution = 'manual_review';
      await updateDiscrepancyRecord(discrepancy);
      return false;
  }

  return false;
}

async function importMissingSale(discrepancy: ReconciliationDiscrepancy): Promise<void> {
  const platformSale = discrepancy.platformData;
  if (!platformSale) return;

  await insertPlatformSale(discrepancy.eventId, discrepancy.platform, platformSale, {
    reconciliation_import: true,
  });

  discrepancy.resolution = 'auto_corrected';
  discrepancy.resolvedAt = new Date().toISOString();
  await updateDiscrepancyRecord(discrepancy);

  await logReconciliationAction(
    discrepancy.eventId,
    'import_sale',
    `Imported missing sale ${platformSale.orderId} from ${discrepancy.platform}`,
    { discrepancyId: discrepancy.id, platformSale }
  );
}

async function correctAmount(discrepancy: ReconciliationDiscrepancy): Promise<void> {
  if (!discrepancy.localData || !discrepancy.difference) return;

  await updateSaleAmount(discrepancy.localData.id, discrepancy.difference.platformValue, {
    reconciliation_corrected: true,
    reconciliation_corrected_at: new Date().toISOString(),
  });

  discrepancy.resolution = 'auto_corrected';
  discrepancy.resolvedAt = new Date().toISOString();
  await updateDiscrepancyRecord(discrepancy);

  await logReconciliationAction(
    discrepancy.eventId,
    'correct_amount',
    `Corrected amount for sale ${discrepancy.localData.platform_order_id}`,
    {
      discrepancyId: discrepancy.id,
      oldAmount: discrepancy.difference.localValue,
      newAmount: discrepancy.difference.platformValue,
    }
  );
}

