/**
 * Event Template System Tests
 * 
 * Tests the complete template functionality including:
 * - Template loading and saving
 * - Banner image handling
 * - Type safety
 * - Error handling
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { EventTemplateLoader } from '@/components/EventTemplateLoader';
import { EventTemplateSaver } from '@/components/EventTemplateSaver';
import { EventTemplatePreview } from '@/components/EventTemplatePreview';
import { EventTemplateErrorBoundary } from '@/components/EventTemplateErrorBoundary';
import { loadTemplateData } from '@/utils/templateLoader';
import { useEventTemplates } from '@/hooks/useEventTemplates';
import { useToast } from '@/hooks/use-toast';

// Mock hooks
jest.mock('@/hooks/useEventTemplates');
jest.mock('@/hooks/use-toast');

// Mock data
const mockTemplate = {
  id: 'test-template-1',
  name: 'Test Comedy Night',
  promoter_id: 'test-promoter-1',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  template_data: {
    title: 'Weekly Comedy Night',
    venue: 'The Comedy Club',
    address: '123 Main St',
    city: 'Sydney',
    state: 'NSW',
    country: 'Australia',
    time: '19:00',
    endTime: '22:00',
    description: 'A great comedy night',
    imageUrl: 'https://example.com/banner.jpg',
    spots: [
      {
        id: 'spot-1',
        spot_name: 'MC',
        duration_minutes: 10,
        is_paid: true,
        payment_amount: 100,
        currency: 'AUD'
      }
    ],
    requirements: ['Must be 18+', 'Professional material only'],
    isVerifiedOnly: false,
    isPaid: true,
    allowRecording: true,
    ageRestriction: '18+',
    dresscode: 'Smart Casual',
    capacity: 100
  }
};

const mockFormData = {
  title: '',
  venue: '',
  address: '',
  city: '',
  state: '',
  country: 'Australia',
  date: '',
  time: '',
  endTime: '',
  type: '',
  spots: 5,
  description: '',
  requirements: [],
  isVerifiedOnly: false,
  isPaid: false,
  allowRecording: false,
  ageRestriction: '18+',
  dresscode: 'Casual',
  imageUrl: '',
  showLevel: '',
  showType: '',
  customShowType: '',
  ticketingType: 'external' as const,
  externalTicketUrl: '',
  tickets: [],
  feeHandling: 'absorb' as const,
  capacity: 0
};

const mockEventSpots: any[] = [];
const mockRecurringSettings = {
  isRecurring: false,
  pattern: 'weekly',
  endDate: '',
  customDates: []
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Event Template System', () => {
  const mockToast = jest.fn();
  const mockOnLoadTemplate = jest.fn();
  const mockCreateTemplate = jest.fn();
  const mockDeleteTemplate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useToast
    (useToast as any).mockReturnValue({
      toast: mockToast
    });
  });

  describe('EventTemplateLoader', () => {
    it('renders loading skeleton when templates are loading', () => {
      (useEventTemplates as any).mockReturnValue({
        templates: [],
        isLoading: true,
        deleteTemplate: mockDeleteTemplate,
        isDeleting: false
      });

      render(
        <TestWrapper>
          <EventTemplateLoader onLoadTemplate={mockOnLoadTemplate} />
        </TestWrapper>
      );

      expect(screen.getByRole('generic')).toHaveClass('animate-pulse');
    });

    it('renders nothing when no templates exist', () => {
      (useEventTemplates as any).mockReturnValue({
        templates: [],
        isLoading: false,
        deleteTemplate: mockDeleteTemplate,
        isDeleting: false
      });

      const { container } = render(
        <TestWrapper>
          <EventTemplateLoader onLoadTemplate={mockOnLoadTemplate} />
        </TestWrapper>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders template selector when templates exist', () => {
      (useEventTemplates as any).mockReturnValue({
        templates: [mockTemplate],
        isLoading: false,
        deleteTemplate: mockDeleteTemplate,
        isDeleting: false
      });

      render(
        <TestWrapper>
          <EventTemplateLoader onLoadTemplate={mockOnLoadTemplate} />
        </TestWrapper>
      );

      expect(screen.getByText('Load Template')).toBeInTheDocument();
    });

    it('calls onLoadTemplate when template is selected', async () => {
      (useEventTemplates as any).mockReturnValue({
        templates: [mockTemplate],
        isLoading: false,
        deleteTemplate: mockDeleteTemplate,
        isDeleting: false
      });

      render(
        <TestWrapper>
          <EventTemplateLoader onLoadTemplate={mockOnLoadTemplate} />
        </TestWrapper>
      );

      // Click on select trigger
      fireEvent.click(screen.getByText('Load Template'));
      
      // Wait for template item to appear and click it
      await waitFor(() => {
        expect(screen.getByText('Test Comedy Night')).toBeInTheDocument();
      });
      
      fireEvent.click(screen.getByText('Test Comedy Night'));

      await waitFor(() => {
        expect(mockOnLoadTemplate).toHaveBeenCalledWith(mockTemplate);
      });
    });
  });

  describe('EventTemplateSaver', () => {
    it('renders save template button', () => {
      (useEventTemplates as any).mockReturnValue({
        createTemplate: mockCreateTemplate,
        isCreating: false
      });

      render(
        <TestWrapper>
          <EventTemplateSaver
            formData={mockFormData}
            eventSpots={mockEventSpots}
            recurringSettings={mockRecurringSettings}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Save Template')).toBeInTheDocument();
    });

    it('shows loading state when saving', () => {
      (useEventTemplates as any).mockReturnValue({
        createTemplate: mockCreateTemplate,
        isCreating: true
      });

      render(
        <TestWrapper>
          <EventTemplateSaver
            formData={mockFormData}
            eventSpots={mockEventSpots}
            recurringSettings={mockRecurringSettings}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('validates template name before saving', async () => {
      (useEventTemplates as any).mockReturnValue({
        createTemplate: mockCreateTemplate,
        isCreating: false
      });

      render(
        <TestWrapper>
          <EventTemplateSaver
            formData={mockFormData}
            eventSpots={mockEventSpots}
            recurringSettings={mockRecurringSettings}
          />
        </TestWrapper>
      );

      // Open save dialog
      fireEvent.click(screen.getByText('Save Template'));
      
      // Try to save without entering a name
      await waitFor(() => {
        expect(screen.getByText('Save Template', { selector: 'button' })).toBeInTheDocument();
      });
      
      const saveButton = screen.getAllByText('Save Template').find(el => el.tagName === 'BUTTON');
      fireEvent.click(saveButton!);

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Template name required',
        description: 'Please enter a name for your template.',
        variant: 'destructive'
      });
    });
  });

  describe('EventTemplatePreview', () => {
    it('renders template preview with all data', () => {
      render(
        <TestWrapper>
          <EventTemplatePreview template={mockTemplate} />
        </TestWrapper>
      );

      // Should show preview button
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('shows template details in preview dialog', async () => {
      render(
        <TestWrapper>
          <EventTemplatePreview template={mockTemplate} />
        </TestWrapper>
      );

      // Click preview button
      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText('Template Preview: Test Comedy Night')).toBeInTheDocument();
        expect(screen.getByText('Weekly Comedy Night')).toBeInTheDocument();
        expect(screen.getByText('The Comedy Club')).toBeInTheDocument();
      });
    });
  });

  describe('EventTemplateErrorBoundary', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('catches and displays errors', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <EventTemplateErrorBoundary>
          <ThrowError />
        </EventTemplateErrorBoundary>
      );

      expect(screen.getByText('Template System Error')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('allows retry after error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      let shouldThrow = true;

      const ConditionalThrow = () => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>Success</div>;
      };

      const { rerender } = render(
        <EventTemplateErrorBoundary>
          <ConditionalThrow />
        </EventTemplateErrorBoundary>
      );

      expect(screen.getByText('Template System Error')).toBeInTheDocument();

      // Simulate retry
      shouldThrow = false;
      fireEvent.click(screen.getByText('Try Again'));

      rerender(
        <EventTemplateErrorBoundary>
          <ConditionalThrow />
        </EventTemplateErrorBoundary>
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Template Data Loading', () => {
    it('correctly loads template data with banner image', () => {
      const mockSetFormData = jest.fn();
      const mockSetEventSpots = jest.fn();
      const mockSetRecurringSettings = jest.fn();

      loadTemplateData(
        mockTemplate,
        mockSetFormData,
        mockSetEventSpots,
        mockSetRecurringSettings
      );

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Weekly Comedy Night',
          venue: 'The Comedy Club',
          imageUrl: 'https://example.com/banner.jpg', // Banner should be loaded
          isPaid: true,
          capacity: 100
        })
      );

      expect(mockSetEventSpots).toHaveBeenCalledWith(mockTemplate.template_data.spots);
    });

    it('handles missing banner image gracefully', () => {
      const templateWithoutBanner = {
        ...mockTemplate,
        template_data: {
          ...mockTemplate.template_data,
          imageUrl: undefined,
          bannerUrl: undefined
        }
      };

      const mockSetFormData = jest.fn();
      const mockSetEventSpots = jest.fn();
      const mockSetRecurringSettings = jest.fn();

      loadTemplateData(
        templateWithoutBanner,
        mockSetFormData,
        mockSetEventSpots,
        mockSetRecurringSettings
      );

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: '' // Should default to empty string
        })
      );
    });

    it('handles corrupted template data gracefully', () => {
      const corruptedTemplate = {
        ...mockTemplate,
        template_data: null
      };

      const mockSetFormData = jest.fn();
      const mockSetEventSpots = jest.fn();
      const mockSetRecurringSettings = jest.fn();

      // Should not throw error
      expect(() => {
        loadTemplateData(
          corruptedTemplate as any,
          mockSetFormData,
          mockSetEventSpots,
          mockSetRecurringSettings
        );
      }).not.toThrow();
    });
  });

  describe('Template Performance', () => {
    it('renders multiple templates efficiently', () => {
      const manyTemplates = Array.from({ length: 20 }, (_, i) => ({
        ...mockTemplate,
        id: `template-${i}`,
        name: `Template ${i}`
      }));

      (useEventTemplates as any).mockReturnValue({
        templates: manyTemplates,
        isLoading: false,
        deleteTemplate: mockDeleteTemplate,
        isDeleting: false
      });

      const start = performance.now();
      
      render(
        <TestWrapper>
          <EventTemplateLoader onLoadTemplate={mockOnLoadTemplate} />
        </TestWrapper>
      );

      const end = performance.now();
      
      // Should render quickly (under 100ms for 20 templates)
      expect(end - start).toBeLessThan(100);
    });
  });
});