import { ReconciliationConfig, ReconciliationReport } from './types';
import { createReconciliationAlertNotification } from './persistence';

export async function checkAndSendAlerts(
  report: ReconciliationReport,
  config: ReconciliationConfig
): Promise<void> {
  const revenueDifference = Math.abs(report.totalLocalRevenue - report.totalPlatformRevenue);
  const shouldAlert =
    report.syncHealth === 'critical' ||
    report.discrepanciesFound > config.alertThreshold.count ||
    revenueDifference > config.alertThreshold.amount;

  if (!shouldAlert) return;

  await createReconciliationAlertNotification(report);
}

