import { ReconciliationConfig } from './types';

export const DEFAULT_RECONCILIATION_CONFIG: ReconciliationConfig = {
  autoCorrectThreshold: 0.01,
  duplicateTimeWindow: 5,
  alertThreshold: {
    count: 10,
    amount: 100,
  },
};

