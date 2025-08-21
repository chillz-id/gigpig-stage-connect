import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface ComedianStats {
  totalShows: number;
  averageRating: number;
  totalEarnings: number;
  upcomingGigs: number;
  loading: boolean;
  error: Error | null;
}

interface ShowPerformance {
  showId: string;
  date: string;
  rating: number;
  earnings: number;
}

/**
 * Custom hook to fetch comedian performance statistics
 * Returns total shows, average rating, total earnings, and upcoming gigs count
 */
export const useComedianStats = (comedianId?: string) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ComedianStats>({
    totalShows: 0,
    averageRating: 0,
    totalEarnings: 0,
    upcomingGigs: 0,
    loading: true,
    error: null,
  });

  // Mock data for development
  const getMockStats = useCallback((id: string): ComedianStats => {
    // Generate consistent mock data based on ID
    const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const randomFactor = (seed % 100) / 100;

    return {
      totalShows: Math.floor(20 + randomFactor * 80), // 20-100 shows
      averageRating: parseFloat((3.5 + randomFactor * 1.5).toFixed(1)), // 3.5-5.0 rating
      totalEarnings: Math.floor(5000 + randomFactor * 45000), // $5k-$50k earnings
      upcomingGigs: Math.floor(1 + randomFactor * 9), // 1-10 upcoming gigs
      loading: false,
      error: null,
    };
  }, []);

  // Mock performance history for development
  const getMockPerformanceHistory = useCallback((id: string): ShowPerformance[] => {
    const performances: ShowPerformance[] = [];
    const today = new Date();
    
    // Generate 10 past performances
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7)); // Weekly shows
      
      performances.push({
        showId: `show-${id}-${i}`,
        date: date.toISOString(),
        rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
        earnings: Math.floor(200 + Math.random() * 800), // $200-$1000 per show
      });
    }
    
    return performances;
  }, []);

  const fetchComedianStats = useCallback(async (id: string) => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));

      // TODO: Replace with actual API call when backend is ready
      // const { data, error } = await supabase
      //   .from('comedian_stats')
      //   .select('*')
      //   .eq('comedian_id', id)
      //   .single();

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Use mock data for now
      const mockStats = getMockStats(id);
      setStats(mockStats);

      // In production, this would also fetch and calculate from:
      // - events table (for past shows)
      // - ratings table (for average rating)
      // - payments/earnings table (for total earnings)
      // - events table with future dates (for upcoming gigs)

    } catch (error) {
      console.error('Error fetching comedian stats:', error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error('Failed to fetch comedian statistics'),
      }));
    }
  }, [getMockStats]);

  const refreshStats = useCallback(() => {
    const id = comedianId || user?.id;
    if (id) {
      fetchComedianStats(id);
    }
  }, [comedianId, user?.id, fetchComedianStats]);

  useEffect(() => {
    const id = comedianId || user?.id;
    if (id) {
      fetchComedianStats(id);
    } else {
      setStats(prev => ({
        ...prev,
        loading: false,
        error: new Error('No comedian ID provided'),
      }));
    }
  }, [comedianId, user?.id, fetchComedianStats]);

  // Additional utility functions
  const getPerformanceTrend = useCallback((): 'improving' | 'stable' | 'declining' => {
    // TODO: Implement actual trend calculation based on recent performances
    const performances = getMockPerformanceHistory(comedianId || user?.id || '');
    if (performances.length < 2) return 'stable';

    const recentAvg = performances.slice(0, 3).reduce((sum, p) => sum + p.rating, 0) / 3;
    const olderAvg = performances.slice(-3).reduce((sum, p) => sum + p.rating, 0) / 3;

    if (recentAvg > olderAvg + 0.2) return 'improving';
    if (recentAvg < olderAvg - 0.2) return 'declining';
    return 'stable';
  }, [comedianId, user?.id, getMockPerformanceHistory]);

  const getEarningsPerShow = useCallback((): number => {
    if (stats.totalShows === 0) return 0;
    return Math.round(stats.totalEarnings / stats.totalShows);
  }, [stats.totalEarnings, stats.totalShows]);

  return {
    ...stats,
    refreshStats,
    getPerformanceTrend,
    getEarningsPerShow,
  };
};

// Export types for use in components
export type { ComedianStats, ShowPerformance };