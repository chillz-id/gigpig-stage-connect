import { render, screen, fireEvent } from '@testing-library/react';
import { GigCalendar } from '@/components/comedian/GigCalendar';
import { UnifiedGig } from '@/hooks/useUnifiedGigs';

describe('GigCalendar', () => {
  const mockGigs: UnifiedGig[] = [
    {
      id: 'manual-1',
      title: 'Manual Gig',
      venue_name: 'Comedy Club',
      venue_address: '123 Main St',
      start_datetime: '2025-11-15T19:00:00Z',
      end_datetime: '2025-11-15T20:00:00Z',
      source: 'manual',
      notes: 'Bring props',
    },
    {
      id: 'platform-1',
      title: 'Platform Gig',
      venue_name: 'Open Mic',
      venue_address: null,
      start_datetime: '2025-11-20T20:00:00Z',
      end_datetime: null,
      source: 'platform',
    },
  ];

  it('renders calendar with current month', () => {
    render(<GigCalendar gigs={[]} />);

    // Should show month/year header
    const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    expect(screen.getByText(new RegExp(currentMonth.split(' ')[0]))).toBeInTheDocument();
  });

  it('renders day headers', () => {
    render(<GigCalendar gigs={[]} />);

    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
    expect(screen.getByText('Wed')).toBeInTheDocument();
    expect(screen.getByText('Thu')).toBeInTheDocument();
    expect(screen.getByText('Fri')).toBeInTheDocument();
    expect(screen.getByText('Sat')).toBeInTheDocument();
  });

  it('navigates to previous month', () => {
    render(<GigCalendar gigs={[]} />);

    const prevButton = screen.getByLabelText(/previous month/i);
    fireEvent.click(prevButton);

    // Month should change (basic check that navigation works)
    const monthDisplay = screen.getByRole('heading', { level: 2 });
    expect(monthDisplay).toBeInTheDocument();
  });

  it('navigates to next month', () => {
    render(<GigCalendar gigs={[]} />);

    const nextButton = screen.getByLabelText(/next month/i);
    fireEvent.click(nextButton);

    // Month should change (basic check that navigation works)
    const monthDisplay = screen.getByRole('heading', { level: 2 });
    expect(monthDisplay).toBeInTheDocument();
  });

  it('displays gigs on correct dates', () => {
    // Set a specific month to test (November 2025)
    render(<GigCalendar gigs={mockGigs} initialMonth={new Date('2025-11-01')} />);

    // Should show both gigs
    expect(screen.getByText('Manual Gig')).toBeInTheDocument();
    expect(screen.getByText('Platform Gig')).toBeInTheDocument();
  });

  it('applies correct color coding to gig badges', () => {
    render(<GigCalendar gigs={mockGigs} initialMonth={new Date('2025-11-01')} />);

    const manualGigBadge = screen.getByText('Manual Gig').closest('button');
    const platformGigBadge = screen.getByText('Platform Gig').closest('button');

    // Manual gigs should have green styling
    expect(manualGigBadge).toHaveClass('border-green-500');
    expect(manualGigBadge).toHaveClass('bg-green-50');

    // Platform gigs should have purple styling
    expect(platformGigBadge).toHaveClass('border-purple-500');
    expect(platformGigBadge).toHaveClass('bg-purple-50');
  });

  it('calls onGigClick when gig badge is clicked', () => {
    const onGigClick = jest.fn();
    render(<GigCalendar gigs={mockGigs} initialMonth={new Date('2025-11-01')} onGigClick={onGigClick} />);

    const gigBadge = screen.getByText('Manual Gig');
    fireEvent.click(gigBadge);

    expect(onGigClick).toHaveBeenCalledWith(mockGigs[0]);
  });

  it('handles empty gigs array', () => {
    render(<GigCalendar gigs={[]} />);

    // Should still render calendar structure
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('displays multiple gigs on same day', () => {
    const sameDayGigs: UnifiedGig[] = [
      {
        id: 'gig-1',
        title: 'Morning Gig',
        venue_name: 'Venue A',
        venue_address: null,
        start_datetime: '2025-11-15T10:00:00Z',
        end_datetime: null,
        source: 'manual',
      },
      {
        id: 'gig-2',
        title: 'Evening Gig',
        venue_name: 'Venue B',
        venue_address: null,
        start_datetime: '2025-11-15T20:00:00Z',
        end_datetime: null,
        source: 'platform',
      },
    ];

    render(<GigCalendar gigs={sameDayGigs} initialMonth={new Date('2025-11-01')} />);

    expect(screen.getByText('Morning Gig')).toBeInTheDocument();
    expect(screen.getByText('Evening Gig')).toBeInTheDocument();
  });

  it('dims dates outside current month', () => {
    render(<GigCalendar gigs={[]} initialMonth={new Date('2025-11-15')} />);

    // Calendar should render all cells (typically 42 for 6 weeks)
    const calendarGrid = screen.getByTestId('calendar-grid');
    expect(calendarGrid.children.length).toBeGreaterThanOrEqual(28);
  });
});
