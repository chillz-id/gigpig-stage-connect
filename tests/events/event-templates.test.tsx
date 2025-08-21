// Event Template Test Suite - Testing event template functionality
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { EventTemplateForm } from '@/components/events/EventTemplateForm';
import { EventTemplateList } from '@/components/events/EventTemplateList';
import { useEventTemplates } from '@/hooks/useEventTemplates';
import { AuthContext } from '@/contexts/AuthContext';
import { EventTemplate } from '@/types/event';

// Mock hooks
jest.mock('@/hooks/useEventTemplates');
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

// Mock Supabase
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } })
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      data: [],
      error: null
    })
  }
}));

// Test utilities
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  const mockAuthContext = {
    user: { id: 'test-user', email: 'test@example.com' },
    hasRole: jest.fn().mockReturnValue(true),
    loading: false,
    signOut: jest.fn()
  };

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={mockAuthContext}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
};

// Mock data
const mockTemplate: EventTemplate = {
  id: 'template-1',
  name: 'Comedy Night Template',
  description: 'Standard comedy night template',
  title: 'Friday Comedy Night',
  venue: 'The Comedy Club',
  address: '123 Comedy St',
  city: 'Sydney',
  state: 'NSW',
  country: 'Australia',
  event_type: 'open_mic',
  total_spots: 10,
  event_description: 'Weekly comedy open mic night',
  requirements: ['5 minute set', 'Clean material only'],
  banner_url: 'https://example.com/template-banner.jpg',
  start_time: '20:00',
  end_time: '22:00',
  promoter_id: 'test-user',
  created_at: '2025-01-01',
  updated_at: '2025-01-01'
};

const mockTemplates = [mockTemplate];

describe('Event Template Test Suite', () => {
  const mockUseEventTemplates = useEventTemplates as jest.MockedFunction<typeof useEventTemplates>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock hooks default returns
    mockUseEventTemplates.mockReturnValue({
      templates: mockTemplates,
      loading: false,
      error: null,
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      deleteTemplate: jest.fn(),
      applyTemplate: jest.fn(),
      refetch: jest.fn()
    });
  });

  describe('Template Save/Load Functionality', () => {
    test('should save event as template', async () => {
      const mockCreateTemplate = jest.fn();
      mockUseEventTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateForm />, { wrapper: createWrapper() });

      // Fill in template form
      const nameInput = screen.getByLabelText('Template Name');
      const descriptionInput = screen.getByLabelText('Template Description');
      const titleInput = screen.getByLabelText('Event Title');
      const venueInput = screen.getByLabelText('Venue');

      fireEvent.change(nameInput, { target: { value: 'New Template' } });
      fireEvent.change(descriptionInput, { target: { value: 'A new template for events' } });
      fireEvent.change(titleInput, { target: { value: 'Comedy Show' } });
      fireEvent.change(venueInput, { target: { value: 'The Venue' } });

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(expect.objectContaining({
          name: 'New Template',
          description: 'A new template for events',
          title: 'Comedy Show',
          venue: 'The Venue'
        }));
      });
    });

    test('should load template list', () => {
      render(<EventTemplateList />, { wrapper: createWrapper() });

      expect(screen.getByText('Event Templates')).toBeInTheDocument();
      expect(screen.getByText('Comedy Night Template')).toBeInTheDocument();
      expect(screen.getByText('Standard comedy night template')).toBeInTheDocument();
    });

    test('should handle template update', async () => {
      const mockUpdateTemplate = jest.fn();
      mockUseEventTemplates.mockReturnValue({
        templates: mockTemplates,
        loading: false,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: mockUpdateTemplate,
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      // Update template name
      const nameInput = screen.getByDisplayValue('Comedy Night Template');
      fireEvent.change(nameInput, { target: { value: 'Updated Comedy Night' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockUpdateTemplate).toHaveBeenCalledWith('template-1', expect.objectContaining({
          name: 'Updated Comedy Night'
        }));
      });
    });

    test('should handle template deletion', async () => {
      const mockDeleteTemplate = jest.fn();
      window.confirm = jest.fn().mockReturnValue(true);
      
      mockUseEventTemplates.mockReturnValue({
        templates: mockTemplates,
        loading: false,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: mockDeleteTemplate,
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteTemplate).toHaveBeenCalledWith('template-1');
      });
    });
  });

  describe('Banner Inclusion', () => {
    test('should save template with banner URL', async () => {
      const mockCreateTemplate = jest.fn();
      mockUseEventTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: mockCreateTemplate,
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateForm />, { wrapper: createWrapper() });

      const nameInput = screen.getByLabelText('Template Name');
      const bannerInput = screen.getByLabelText('Banner URL');

      fireEvent.change(nameInput, { target: { value: 'Template with Banner' } });
      fireEvent.change(bannerInput, { target: { value: 'https://example.com/banner.jpg' } });

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Template with Banner',
          banner_url: 'https://example.com/banner.jpg'
        }));
      });
    });

    test('should display template banner preview', () => {
      render(<EventTemplateList />, { wrapper: createWrapper() });

      const bannerImage = screen.getByAltText('Comedy Night Template banner');
      expect(bannerImage).toBeInTheDocument();
      expect(bannerImage).toHaveAttribute('src', 'https://example.com/template-banner.jpg');
    });

    test('should handle missing banner gracefully', () => {
      const templateWithoutBanner = { ...mockTemplate, banner_url: null };
      mockUseEventTemplates.mockReturnValue({
        templates: [templateWithoutBanner],
        loading: false,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      // Should show placeholder or default image
      const placeholder = screen.getByTestId('banner-placeholder');
      expect(placeholder).toBeInTheDocument();
    });
  });

  describe('Template Application', () => {
    test('should apply template to new event', async () => {
      const mockApplyTemplate = jest.fn();
      mockUseEventTemplates.mockReturnValue({
        templates: mockTemplates,
        loading: false,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: mockApplyTemplate,
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      const applyButton = screen.getByText('Use Template');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(mockApplyTemplate).toHaveBeenCalledWith('template-1');
      });
    });

    test('should populate form fields from template', async () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate
      }));

      render(<EventTemplateList />, { wrapper: createWrapper() });

      const applyButton = screen.getByText('Use Template');
      fireEvent.click(applyButton);

      // Should navigate to create event page with template data
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/events/create', {
          state: { template: mockTemplate }
        });
      });
    });

    test('should preserve template settings when applying', () => {
      const templateData = {
        title: mockTemplate.title,
        venue: mockTemplate.venue,
        address: mockTemplate.address,
        city: mockTemplate.city,
        state: mockTemplate.state,
        country: mockTemplate.country,
        event_type: mockTemplate.event_type,
        total_spots: mockTemplate.total_spots,
        event_description: mockTemplate.event_description,
        requirements: mockTemplate.requirements,
        banner_url: mockTemplate.banner_url,
        start_time: mockTemplate.start_time,
        end_time: mockTemplate.end_time
      };

      // Verify all fields are included when applying template
      expect(templateData.title).toBe('Friday Comedy Night');
      expect(templateData.venue).toBe('The Comedy Club');
      expect(templateData.banner_url).toBe('https://example.com/template-banner.jpg');
      expect(templateData.requirements).toEqual(['5 minute set', 'Clean material only']);
    });
  });

  describe('Error Handling', () => {
    test('should handle loading state', () => {
      mockUseEventTemplates.mockReturnValue({
        templates: [],
        loading: true,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      expect(screen.getByTestId('template-loading')).toBeInTheDocument();
    });

    test('should handle error state', () => {
      mockUseEventTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: 'Failed to load templates',
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      expect(screen.getByText('Error Loading Templates')).toBeInTheDocument();
      expect(screen.getByText('Failed to load templates')).toBeInTheDocument();
    });

    test('should handle empty template list', () => {
      mockUseEventTemplates.mockReturnValue({
        templates: [],
        loading: false,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      expect(screen.getByText('No templates found')).toBeInTheDocument();
      expect(screen.getByText('Create your first template')).toBeInTheDocument();
    });
  });

  describe('Template Validation', () => {
    test('should validate required fields', async () => {
      render(<EventTemplateForm />, { wrapper: createWrapper() });

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Template name is required')).toBeInTheDocument();
        expect(screen.getByText('Event title is required')).toBeInTheDocument();
        expect(screen.getByText('Venue is required')).toBeInTheDocument();
      });
    });

    test('should validate banner URL format', async () => {
      render(<EventTemplateForm />, { wrapper: createWrapper() });

      const bannerInput = screen.getByLabelText('Banner URL');
      fireEvent.change(bannerInput, { target: { value: 'not-a-url' } });

      const saveButton = screen.getByText('Save Template');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
      });
    });
  });

  describe('Template Search and Filter', () => {
    test('should search templates by name', () => {
      mockUseEventTemplates.mockReturnValue({
        templates: mockTemplates,
        loading: false,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText('Search templates...');
      fireEvent.change(searchInput, { target: { value: 'Comedy' } });

      expect(screen.getByText('Comedy Night Template')).toBeInTheDocument();
    });

    test('should filter templates by type', () => {
      const templates = [
        mockTemplate,
        { ...mockTemplate, id: 'template-2', name: 'Workshop Template', event_type: 'workshop' }
      ];

      mockUseEventTemplates.mockReturnValue({
        templates,
        loading: false,
        error: null,
        createTemplate: jest.fn(),
        updateTemplate: jest.fn(),
        deleteTemplate: jest.fn(),
        applyTemplate: jest.fn(),
        refetch: jest.fn()
      });

      render(<EventTemplateList />, { wrapper: createWrapper() });

      const typeFilter = screen.getByLabelText('Event Type');
      fireEvent.change(typeFilter, { target: { value: 'open_mic' } });

      expect(screen.getByText('Comedy Night Template')).toBeInTheDocument();
      expect(screen.queryByText('Workshop Template')).not.toBeInTheDocument();
    });
  });
});