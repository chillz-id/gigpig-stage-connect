import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AutoSaveStatus, { AutoSaveIcon } from '@/components/events/AutoSaveStatus';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock date-fns to avoid timezone issues in tests
jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(() => '2 minutes ago'),
}));

const renderWithTheme = (ui: React.ReactElement, theme: 'business' | 'pleasure' = 'business') => {
  return render(
    <ThemeProvider defaultTheme={theme}>
      {ui}
    </ThemeProvider>
  );
};

describe('AutoSaveStatus', () => {
  it('should be hidden when status is idle', () => {
    const { container } = renderWithTheme(
      <AutoSaveStatus status="idle" lastSaved={null} error={null} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('should show saving indicator', () => {
    renderWithTheme(
      <AutoSaveStatus status="saving" lastSaved={null} error={null} />
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Auto-save status: saving');
  });

  it('should show saved indicator with last saved time', () => {
    const lastSaved = new Date();
    renderWithTheme(
      <AutoSaveStatus status="saved" lastSaved={lastSaved} error={null} />
    );
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('(2 minutes ago)')).toBeInTheDocument();
  });

  it('should show error indicator with error message', () => {
    const error = new Error('Network connection failed');
    renderWithTheme(
      <AutoSaveStatus status="error" lastSaved={null} error={error} />
    );
    expect(screen.getByText('Failed to save')).toBeInTheDocument();
    expect(screen.getByText('(Network connection failed)')).toBeInTheDocument();
  });

  it('should auto-hide saved status after 2 seconds', async () => {
    renderWithTheme(
      <AutoSaveStatus status="saved" lastSaved={new Date()} error={null} />
    );
    
    expect(screen.getByText('Saved')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Saved')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should apply custom className', () => {
    renderWithTheme(
      <AutoSaveStatus 
        status="saving" 
        lastSaved={null} 
        error={null} 
        className="custom-class" 
      />
    );
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });

  it('should work with pleasure theme', () => {
    renderWithTheme(
      <AutoSaveStatus status="saving" lastSaved={null} error={null} />,
      'pleasure'
    );
    const element = screen.getByRole('status');
    expect(element).toHaveClass('bg-purple-900/20');
    expect(element).toHaveClass('text-purple-300');
  });
});

describe('AutoSaveIcon', () => {
  it('should show icon only by default', () => {
    renderWithTheme(
      <AutoSaveIcon status="saving" lastSaved={null} error={null} />
    );
    expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should show text when showText is true', () => {
    renderWithTheme(
      <AutoSaveIcon status="saving" lastSaved={null} error={null} showText />
    );
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should show appropriate title on hover', () => {
    const error = new Error('Connection failed');
    renderWithTheme(
      <AutoSaveIcon status="error" lastSaved={null} error={error} />
    );
    expect(screen.getByRole('status')).toHaveAttribute('title', 'Failed to save: Connection failed');
  });

  it('should auto-hide saved status after 2 seconds', async () => {
    renderWithTheme(
      <AutoSaveIcon status="saved" lastSaved={new Date()} error={null} />
    );
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });
});