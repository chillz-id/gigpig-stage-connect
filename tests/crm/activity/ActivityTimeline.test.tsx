import { render, screen } from '@testing-library/react';
import { ActivityTimeline } from '@/components/crm/ActivityTimeline';
import type { CustomerActivity } from '@/hooks/useCustomerActivity';

const baseActivity: CustomerActivity = {
  activity_id: 'activity-1',
  customer_id: 'customer-1',
  activity_type: 'order',
  created_at: '2025-01-15T10:30:00Z',
  metadata: {
    total_cents: 4500,
    order_reference: 'ORD-123',
    status: 'paid',
    source: 'web',
  },
};

describe('ActivityTimeline', () => {
  it('renders loading skeletons when loading', () => {
    render(<ActivityTimeline activities={[]} isLoading />);
    expect(screen.getAllByTestId('activity-skeleton')).toHaveLength(5);
  });

  it('renders empty state when no activities available', () => {
    render(<ActivityTimeline activities={[]} />);
    expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
  });

  it('renders activity cards with formatted timestamp', () => {
    render(<ActivityTimeline activities={[baseActivity]} />);
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(screen.getByText(/order #/i)).toBeInTheDocument();
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('renders message activity', () => {
    render(
      <ActivityTimeline
        activities={[
          {
            ...baseActivity,
            activity_id: 'activity-2',
            activity_type: 'message',
            metadata: { subject: 'Follow up', is_read: false },
          },
        ]}
      />
    );

    expect(screen.getByText('Message')).toBeInTheDocument();
    expect(screen.getByText('Follow up')).toBeInTheDocument();
  });
});
