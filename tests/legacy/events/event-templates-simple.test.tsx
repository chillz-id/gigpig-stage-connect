/**
 * Simple Event Template System Tests
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EventTemplatePreview } from '@/components/EventTemplatePreview';
import { EventTemplateErrorBoundary } from '@/components/EventTemplateErrorBoundary';
import { loadTemplateData } from '@/utils/templateLoader';

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

describe('Event Template System - Core Functionality', () => {
  describe('EventTemplatePreview', () => {
    test('renders template preview button', () => {
      render(
        <TestWrapper>
          <EventTemplatePreview template={mockTemplate} />
        </TestWrapper>
      );

      // Should show preview button
      const button = screen.getByRole('button');
      expect(button).toBeDefined();
    });
  });

  describe('EventTemplateErrorBoundary', () => {
    test('renders children when no error', () => {
      render(
        <EventTemplateErrorBoundary>
          <div>Test Content</div>
        </EventTemplateErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeDefined();
    });

    test('catches and displays errors', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <EventTemplateErrorBoundary>
          <ThrowError />
        </EventTemplateErrorBoundary>
      );

      expect(screen.getByText('Template System Error')).toBeDefined();
      expect(screen.getByText('Try Again')).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe('Template Data Loading', () => {
    test('correctly loads template data with banner image', () => {
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

    test('handles missing banner image gracefully', () => {
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

    test('handles corrupted template data gracefully', () => {
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

    test('supports both imageUrl and bannerUrl fields', () => {
      const templateWithBannerUrl = {
        ...mockTemplate,
        template_data: {
          ...mockTemplate.template_data,
          imageUrl: undefined,
          bannerUrl: 'https://example.com/alt-banner.jpg'
        }
      };

      const mockSetFormData = jest.fn();
      const mockSetEventSpots = jest.fn();
      const mockSetRecurringSettings = jest.fn();

      loadTemplateData(
        templateWithBannerUrl,
        mockSetFormData,
        mockSetEventSpots,
        mockSetRecurringSettings
      );

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          imageUrl: 'https://example.com/alt-banner.jpg' // Should use bannerUrl as fallback
        })
      );
    });
  });

  describe('Template Type Safety', () => {
    test('handles array vs number spots correctly', () => {
      const templateWithArraySpots = {
        ...mockTemplate,
        template_data: {
          ...mockTemplate.template_data,
          spots: [
            { spot_name: 'MC', duration: 10 },
            { spot_name: 'Feature', duration: 15 }
          ]
        }
      };

      const mockSetFormData = jest.fn();
      const mockSetEventSpots = jest.fn();
      const mockSetRecurringSettings = jest.fn();

      loadTemplateData(
        templateWithArraySpots,
        mockSetFormData,
        mockSetEventSpots,
        mockSetRecurringSettings
      );

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          spots: 2 // Should count array length
        })
      );
    });

    test('handles requirements array correctly', () => {
      const templateWithStringRequirements = {
        ...mockTemplate,
        template_data: {
          ...mockTemplate.template_data,
          requirements: 'Must be professional'
        }
      };

      const mockSetFormData = jest.fn();
      const mockSetEventSpots = jest.fn();
      const mockSetRecurringSettings = jest.fn();

      loadTemplateData(
        templateWithStringRequirements,
        mockSetFormData,
        mockSetEventSpots,
        mockSetRecurringSettings
      );

      expect(mockSetFormData).toHaveBeenCalledWith(
        expect.objectContaining({
          requirements: [] // Should default to empty array for non-arrays
        })
      );
    });
  });
});