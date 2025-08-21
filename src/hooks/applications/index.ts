// Export all application-related hooks
export { useApplications } from '../useApplications';
export { useEventApplications } from '../useEventApplications';
export { useSubmitApplication } from '../useSubmitApplication';
export { useApplicationDetails } from '../useApplicationDetails';
export { useComedianApplications } from '../useComedianApplications';

// Export types
export type { Application } from '../useApplications';
export type { ApplicationSubmitData, ApplicationResponse } from '../useSubmitApplication';
export type { ApplicationDetails } from '../useApplicationDetails';
export type { ComedianApplication } from '../useComedianApplications';

// Re-export service utilities
export {
  calculateApplicationStats,
  getSpotTypeDisplayName,
  getStatusBadgeColor,
  validateApplicationData,
  filterAndSortApplications,
  type ApplicationData,
  type ApplicationSubmitData as ApplicationFormData
} from '@/services/applicationService';