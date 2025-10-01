// Refactored Tour Service - Orchestrates the split domain services
import { tourService as coreTourService } from './tour/TourService';
import { tourStopService } from './tour/TourStopService';
import { tourParticipantService } from './tour/TourParticipantService';
import { tourFinancialService } from './tour/TourFinancialService';

import type {
  Tour,
  TourStop,
  TourParticipant,
  TourCollaboration,
  TourLogistics,
  TourExpense,
  TourRevenue,
  TourItinerary,
  TourWithDetails,
  TourStatistics,
  TourListResponse,
  TourDetailsResponse,
  TourSearchParams,
  TourFilters,
  TourDashboardStats,
  TourCalendarEvent,
  CreateTourRequest,
  UpdateTourRequest,
  CreateTourStopRequest,
  CreateTourParticipantRequest,
  CreateTourCollaborationRequest,
  CreateTourLogisticsRequest,
  CreateTourExpenseRequest,
  CreateTourRevenueRequest,
  TourParticipantWithUser,
  TourCollaborationWithUser,
  TourStopWithDetails
} from '@/types/tour';

/**
 * Refactored Tour Service - Orchestrates domain-specific services
 * 
 * This service maintains the original API while delegating to specialized services:
 * - CoreTourService: Basic tour CRUD operations
 * - TourStopService: Stop management and logistics
 * - TourParticipantService: Participants and collaborations
 * - TourFinancialService: Expenses, revenue, and financial operations
 */
class RefactoredTourService {
  // =====================================
  // TOUR MANAGEMENT (delegated to CoreTourService)
  // =====================================

  async createTour(data: CreateTourRequest): Promise<Tour> {
    return coreTourService.createTour(data);
  }

  async updateTour(id: string, data: UpdateTourRequest): Promise<Tour> {
    return coreTourService.updateTour(id, data);
  }

  async getTour(id: string): Promise<Tour | null> {
    return coreTourService.getTour(id);
  }

  async getTourWithDetails(id: string): Promise<TourDetailsResponse | null> {
    return coreTourService.getTourWithDetails(id);
  }

  async getTours(params: TourSearchParams = {}): Promise<TourListResponse> {
    return coreTourService.getTours(params);
  }

  async deleteTour(id: string): Promise<void> {
    return coreTourService.deleteTour(id);
  }

  async getTourStatistics(id: string): Promise<TourStatistics> {
    return coreTourService.getTourStatistics(id);
  }

  async searchTours(query: string, filters?: TourFilters): Promise<Tour[]> {
    return coreTourService.searchTours(query, filters);
  }

  async getPublicTours(limit: number = 20): Promise<Tour[]> {
    return coreTourService.getPublicTours(limit);
  }

  async getFeaturedTours(): Promise<Tour[]> {
    return coreTourService.getFeaturedTours();
  }

  async getToursByLocation(city: string, state?: string): Promise<Tour[]> {
    return coreTourService.getToursByLocation(city, state);
  }

  async getTourDashboardStats(managerId?: string): Promise<TourDashboardStats> {
    return coreTourService.getTourDashboardStats(managerId);
  }

  async getTourCalendarEvents(tourId: string): Promise<TourCalendarEvent[]> {
    return coreTourService.getTourCalendarEvents(tourId);
  }

  async duplicateTour(tourId: string, newName: string): Promise<Tour> {
    return coreTourService.duplicateTour(tourId, newName);
  }

  // =====================================
  // TOUR STOP MANAGEMENT (delegated to TourStopService)
  // =====================================

  async createTourStop(data: CreateTourStopRequest): Promise<TourStop> {
    return tourStopService.createTourStop(data);
  }

  async updateTourStop(id: string, data: Partial<CreateTourStopRequest>): Promise<TourStop> {
    return tourStopService.updateTourStop(id, data);
  }

  async getTourStops(tourId: string): Promise<TourStop[]> {
    return tourStopService.getTourStops(tourId);
  }

  async getTourStop(id: string): Promise<TourStop | null> {
    return tourStopService.getTourStop(id);
  }

  async deleteTourStop(id: string): Promise<void> {
    return tourStopService.deleteTourStop(id);
  }

  async getTourStopWithDetails(id: string): Promise<TourStopWithDetails | null> {
    return tourStopService.getTourStopWithDetails(id);
  }

  async bulkCreateTourStops(tourId: string, stops: Omit<CreateTourStopRequest, 'tour_id'>[]): Promise<TourStop[]> {
    return tourStopService.bulkCreateTourStops(tourId, stops);
  }

  async bulkUpdateTourStops(updates: Array<{ id: string; data: Partial<TourStop> }>): Promise<TourStop[]> {
    return tourStopService.bulkUpdateTourStops(updates);
  }

  // =====================================
  // LOGISTICS MANAGEMENT (delegated to TourStopService)
  // =====================================

  async createTourLogistics(data: CreateTourLogisticsRequest): Promise<TourLogistics> {
    return tourStopService.createTourLogistics(data);
  }

  async updateTourLogistics(id: string, data: Partial<CreateTourLogisticsRequest>): Promise<TourLogistics> {
    return tourStopService.updateTourLogistics(id, data);
  }

  async getTourLogistics(tourId: string, stopId?: string): Promise<TourLogistics[]> {
    return tourStopService.getTourLogistics(tourId, stopId);
  }

  async deleteTourLogistics(id: string): Promise<void> {
    return tourStopService.deleteTourLogistics(id);
  }

  // =====================================
  // ITINERARY MANAGEMENT (delegated to TourStopService)
  // =====================================

  async createTourItinerary(data: Omit<TourItinerary, 'id' | 'created_at' | 'updated_at'>): Promise<TourItinerary> {
    return tourStopService.createTourItinerary(data);
  }

  async updateTourItinerary(id: string, data: Partial<TourItinerary>): Promise<TourItinerary> {
    return tourStopService.updateTourItinerary(id, data);
  }

  async getTourItinerary(tourId: string, stopId?: string): Promise<TourItinerary[]> {
    return tourStopService.getTourItinerary(tourId, stopId);
  }

  async deleteTourItinerary(id: string): Promise<void> {
    return tourStopService.deleteTourItinerary(id);
  }

  // =====================================
  // PARTICIPANT MANAGEMENT (delegated to TourParticipantService)
  // =====================================

  async createTourParticipant(data: CreateTourParticipantRequest): Promise<TourParticipant> {
    return tourParticipantService.createTourParticipant(data);
  }

  async updateTourParticipant(id: string, data: Partial<CreateTourParticipantRequest>): Promise<TourParticipant> {
    return tourParticipantService.updateTourParticipant(id, data);
  }

  async getTourParticipants(tourId: string): Promise<TourParticipantWithUser[]> {
    return tourParticipantService.getTourParticipants(tourId);
  }

  async deleteTourParticipant(id: string): Promise<void> {
    return tourParticipantService.deleteTourParticipant(id);
  }

  // =====================================
  // COLLABORATION MANAGEMENT (delegated to TourParticipantService)
  // =====================================

  async createTourCollaboration(data: CreateTourCollaborationRequest): Promise<TourCollaboration> {
    return tourParticipantService.createTourCollaboration(data);
  }

  async updateTourCollaboration(id: string, data: Partial<CreateTourCollaborationRequest>): Promise<TourCollaboration> {
    return tourParticipantService.updateTourCollaboration(id, data);
  }

  async getTourCollaborations(tourId: string): Promise<TourCollaborationWithUser[]> {
    return tourParticipantService.getTourCollaborations(tourId);
  }

  async respondToCollaboration(id: string, accept: boolean): Promise<TourCollaboration> {
    return tourParticipantService.respondToCollaboration(id, accept);
  }

  async deleteTourCollaboration(id: string): Promise<void> {
    return tourParticipantService.deleteTourCollaboration(id);
  }

  // =====================================
  // FINANCIAL MANAGEMENT (delegated to TourFinancialService)
  // =====================================

  async createTourExpense(data: CreateTourExpenseRequest): Promise<TourExpense> {
    return tourFinancialService.createTourExpense(data);
  }

  async updateTourExpense(id: string, data: Partial<CreateTourExpenseRequest>): Promise<TourExpense> {
    return tourFinancialService.updateTourExpense(id, data);
  }

  async getTourExpenses(tourId: string, stopId?: string): Promise<TourExpense[]> {
    return tourFinancialService.getTourExpenses(tourId, stopId);
  }

  async deleteTourExpense(id: string): Promise<void> {
    return tourFinancialService.deleteTourExpense(id);
  }

  async createTourRevenue(data: CreateTourRevenueRequest): Promise<TourRevenue> {
    return tourFinancialService.createTourRevenue(data);
  }

  async updateTourRevenue(id: string, data: Partial<CreateTourRevenueRequest>): Promise<TourRevenue> {
    return tourFinancialService.updateTourRevenue(id, data);
  }

  async getTourRevenue(tourId: string, stopId?: string): Promise<TourRevenue[]> {
    return tourFinancialService.getTourRevenue(tourId, stopId);
  }

  async deleteTourRevenue(id: string): Promise<void> {
    return tourFinancialService.deleteTourRevenue(id);
  }

  // =====================================
  // ENHANCED FUNCTIONALITY (using composed services)
  // =====================================

  /**
   * Get comprehensive tour data with all related information
   * This method demonstrates how the split services can work together
   */
  async getComprehensiveTourData(tourId: string): Promise<{
    tour: Tour | null;
    stops: TourStop[];
    participants: TourParticipantWithUser[];
    collaborations: TourCollaborationWithUser[];
    expenses: TourExpense[];
    revenue: TourRevenue[];
    financialSummary: any;
  }> {
    // Fetch data from all services in parallel
    const [
      tour,
      stops,
      participants,
      collaborations,
      expenses,
      revenue
    ] = await Promise.all([
      coreTourService.getTour(tourId),
      tourStopService.getTourStops(tourId),
      tourParticipantService.getTourParticipants(tourId),
      tourParticipantService.getTourCollaborations(tourId),
      tourFinancialService.getTourExpenses(tourId),
      tourFinancialService.getTourRevenue(tourId)
    ]);

    // Get financial summary
    const financialSummary = await tourFinancialService.getTourFinancialSummary(tourId);

    return {
      tour,
      stops,
      participants,
      collaborations,
      expenses,
      revenue,
      financialSummary
    };
  }
}

// Export the refactored service with the same interface
export const tourService = new RefactoredTourService();
export default RefactoredTourService;