import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { FeatureCard } from '@/components/roadmap/FeatureCard';
import * as roadmapHooks from '@/hooks/useRoadmap';

// Mock the roadmap hooks
jest.mock('@/hooks/useRoadmap', () => ({
  useVoteFeature: jest.fn(),
  useUnvoteFeature: jest.fn(),
  useUserVote: jest.fn(),
}));

// Mock auth context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { id: 'test-user-id', email: 'test@example.com' },
    hasRole: jest.fn(() => false),
    signOut: jest.fn(),
  })),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockFeature = {
  id: 'test-feature-1',
  title: 'Test Feature',
  description: 'This is a test feature description',
  status: 'pending',
  vote_count: 42,
  comment_count: 5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  user_id: 'user-1',
  profiles: {
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{children}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('FeatureCard - Heart Icon Voting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display Heart icon instead of ThumbsUp', () => {
    const mockVote = jest.fn();
    const mockUnvote = jest.fn();

    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: mockVote,
      isPending: false,
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: mockUnvote,
      isPending: false,
    });

    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    // Heart icon should be present (using data-testid or checking for svg)
    const voteButton = screen.getByRole('button');
    expect(voteButton).toBeInTheDocument();

    // Check that the vote button contains an SVG (Heart icon from lucide-react)
    const svg = voteButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display vote count above the heart icon', () => {
    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    // Vote count should be displayed
    expect(screen.getByText('42')).toBeInTheDocument();

    // Vote count should be in a span with specific classes
    const voteCount = screen.getByText('42');
    expect(voteCount.className).toContain('text-sm');
    expect(voteCount.className).toContain('font-semibold');
  });

  it('should display filled red heart when user has voted', () => {
    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    // Mock user has voted
    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: { id: 'vote-1', feature_id: 'test-feature-1', user_id: 'user-1' },
      isLoading: false,
    });

    const { container } = render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    // Heart icon should have filled red styling
    const heartIcon = container.querySelector('svg');
    expect(heartIcon).toBeInTheDocument();
    expect(heartIcon?.className).toContain('fill-red-500');
    expect(heartIcon?.className).toContain('text-red-500');
  });

  it('should display gray outlined heart when user has not voted', () => {
    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    // Mock user has not voted
    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { container } = render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    // Heart icon should have gray styling (not filled)
    const heartIcon = container.querySelector('svg');
    expect(heartIcon).toBeInTheDocument();
    expect(heartIcon?.className).toContain('text-gray-400');
    expect(heartIcon?.className).not.toContain('fill-red-500');
  });

  it('should call vote mutation when clicking heart icon (unvoted state)', async () => {
    const user = userEvent.setup();
    const mockVoteMutate = jest.fn();

    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: mockVoteMutate,
      isPending: false,
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    // Find and click the vote button
    const voteButton = screen.getByRole('button');
    await user.click(voteButton);

    // Should call vote mutation
    await waitFor(() => {
      expect(mockVoteMutate).toHaveBeenCalledWith('test-feature-1');
    });
  });

  it('should call unvote mutation when clicking heart icon (voted state)', async () => {
    const user = userEvent.setup();
    const mockUnvoteMutate = jest.fn();

    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: mockUnvoteMutate,
      isPending: false,
    });

    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: { id: 'vote-1', feature_id: 'test-feature-1', user_id: 'user-1' },
      isLoading: false,
    });

    render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    // Find and click the vote button
    const voteButton = screen.getByRole('button');
    await user.click(voteButton);

    // Should call unvote mutation
    await waitFor(() => {
      expect(mockUnvoteMutate).toHaveBeenCalledWith('test-feature-1');
    });
  });

  it('should have transition classes for hover animations', () => {
    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    const { container } = render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    const heartIcon = container.querySelector('svg');
    expect(heartIcon?.className).toContain('transition-all');
    expect(heartIcon?.className).toContain('duration-200');
  });

  it('should disable vote button while mutation is pending', () => {
    (roadmapHooks.useVoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: true, // Mutation in progress
    });

    (roadmapHooks.useUnvoteFeature as jest.Mock).mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    });

    (roadmapHooks.useUserVote as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
    });

    render(<FeatureCard feature={mockFeature} onClick={jest.fn()} />, {
      wrapper: createWrapper(),
    });

    const voteButton = screen.getByRole('button');
    expect(voteButton).toBeDisabled();
  });
});
