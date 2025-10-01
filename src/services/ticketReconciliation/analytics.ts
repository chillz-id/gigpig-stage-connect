import { ReconciliationReport, ReconciliationStats, SyncHealthStatus } from './types';

export function calculateSyncHealth(report: ReconciliationReport): SyncHealthStatus {
  const discrepancyRate = report.totalLocalSales > 0
    ? report.discrepanciesFound / report.totalLocalSales
    : 0;

  const revenueDiff = Math.abs(report.totalLocalRevenue - report.totalPlatformRevenue);
  const revenueDiscrepancyRate = report.totalPlatformRevenue > 0
    ? revenueDiff / report.totalPlatformRevenue
    : 0;

  if (discrepancyRate > 0.1 || revenueDiscrepancyRate > 0.05) {
    return 'critical';
  }

  if (discrepancyRate > 0.05 || revenueDiscrepancyRate > 0.02) {
    return 'warning';
  }

  return 'healthy';
}

export function buildReconciliationStats(reports: ReconciliationReport[]): ReconciliationStats {
  const stats: ReconciliationStats = {
    totalReports: reports.length,
    averageDiscrepancies: 0,
    resolutionRate: 0,
    healthTrend: [],
    platformBreakdown: {},
  };

  if (reports.length === 0) {
    return stats;
  }

  const totalDiscrepancies = reports.reduce((sum, report) => sum + report.discrepanciesFound, 0);
  const totalResolved = reports.reduce((sum, report) => sum + report.discrepanciesResolved, 0);

  stats.averageDiscrepancies = totalDiscrepancies / reports.length;
  stats.resolutionRate = totalDiscrepancies > 0 ? totalResolved / totalDiscrepancies : 1;
  stats.healthTrend = reports.map(report => ({
    date: report.startTime,
    health: report.syncHealth,
    discrepancies: report.discrepanciesFound,
  }));

  for (const report of reports) {
    const breakdown = stats.platformBreakdown[report.platform] || {
      reports: 0,
      discrepancies: 0,
      resolved: 0,
    };

    breakdown.reports += 1;
    breakdown.discrepancies += report.discrepanciesFound;
    breakdown.resolved += report.discrepanciesResolved;

    stats.platformBreakdown[report.platform] = breakdown;
  }

  return stats;
}

