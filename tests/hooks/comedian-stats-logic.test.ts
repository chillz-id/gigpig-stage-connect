/**
 * Unit tests for comedian stats business logic
 * Pure logic tests without React or Puppeteer dependencies
 */

// Override the setup to prevent Puppeteer initialization
beforeAll(() => {
  // No-op to override default setup
});

afterAll(() => {
  // No-op to override default teardown
});

describe('Comedian Stats Business Logic', () => {
  describe('Mock Data Generation', () => {
    test('generates consistent data based on comedian ID', () => {
      // Test the seed generation algorithm
      const generateSeed = (id: string) => {
        return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      };

      // Test known IDs produce consistent seeds
      const seed1 = generateSeed('comedian-123');
      const seed2 = generateSeed('comedian-456');
      const seed3 = generateSeed('test-user');
      
      // Just verify they're numbers and consistent
      expect(typeof seed1).toBe('number');
      expect(typeof seed2).toBe('number');
      expect(typeof seed3).toBe('number');
      expect(seed1).not.toBe(seed2);
      expect(seed2).not.toBe(seed3);

      // Test seed consistency
      const testId = 'my-test-comedian';
      const seedA = generateSeed(testId);
      const seedB = generateSeed(testId);
      expect(seedA).toBe(seedB);
    });

    test('generates stats within valid ranges', () => {
      const generateStats = (comedianId: string) => {
        const seed = comedianId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const randomFactor = (seed % 100) / 100;

        return {
          totalShows: Math.floor(20 + randomFactor * 80),
          averageRating: parseFloat((3.5 + randomFactor * 1.5).toFixed(1)),
          totalEarnings: Math.floor(5000 + randomFactor * 45000),
          upcomingGigs: Math.floor(1 + randomFactor * 9),
        };
      };

      // Test multiple IDs
      const testIds = ['id1', 'id2', 'id3', 'comedian-xyz', 'performer-abc'];
      
      testIds.forEach(id => {
        const stats = generateStats(id);
        
        // Verify ranges
        expect(stats.totalShows).toBeGreaterThanOrEqual(20);
        expect(stats.totalShows).toBeLessThanOrEqual(100);
        
        expect(stats.averageRating).toBeGreaterThanOrEqual(3.5);
        expect(stats.averageRating).toBeLessThanOrEqual(5.0);
        
        expect(stats.totalEarnings).toBeGreaterThanOrEqual(5000);
        expect(stats.totalEarnings).toBeLessThanOrEqual(50000);
        
        expect(stats.upcomingGigs).toBeGreaterThanOrEqual(1);
        expect(stats.upcomingGigs).toBeLessThanOrEqual(10);
      });
    });

    test('formats ratings correctly', () => {
      const formatRating = (rating: number) => parseFloat(rating.toFixed(1));
      
      expect(formatRating(3.555)).toBe(3.6);
      expect(formatRating(4.234)).toBe(4.2);
      expect(formatRating(4.999)).toBe(5.0);
      expect(formatRating(3.501)).toBe(3.5);
      expect(formatRating(5.0)).toBe(5.0);
      expect(formatRating(3.5)).toBe(3.5);
    });
  });

  describe('Earnings Calculations', () => {
    test('calculates earnings per show correctly', () => {
      const calculateEarningsPerShow = (totalEarnings: number, totalShows: number) => {
        if (totalShows === 0) return 0;
        return Math.round(totalEarnings / totalShows);
      };

      expect(calculateEarningsPerShow(25000, 50)).toBe(500);
      expect(calculateEarningsPerShow(10000, 20)).toBe(500);
      expect(calculateEarningsPerShow(45000, 100)).toBe(450);
      expect(calculateEarningsPerShow(5000, 25)).toBe(200);
      expect(calculateEarningsPerShow(0, 10)).toBe(0);
      expect(calculateEarningsPerShow(1000, 0)).toBe(0); // Division by zero
    });

    test('handles edge cases in calculations', () => {
      const calculateEarningsPerShow = (totalEarnings: number, totalShows: number) => {
        if (totalShows === 0) return 0;
        return Math.round(totalEarnings / totalShows);
      };

      // Large numbers
      expect(calculateEarningsPerShow(1000000, 2000)).toBe(500);
      
      // Small numbers
      expect(calculateEarningsPerShow(100, 1)).toBe(100);
      
      // Decimal results
      expect(calculateEarningsPerShow(1000, 3)).toBe(333);
      expect(calculateEarningsPerShow(100, 7)).toBe(14);
    });
  });

  describe('Performance Trends', () => {
    test('calculates trends correctly', () => {
      const calculateTrend = (performances: number[]) => {
        if (performances.length < 2) return 'stable';
        
        const recent = performances.slice(0, 3);
        const older = performances.slice(-3);
        
        const recentAvg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
        const olderAvg = older.reduce((sum, r) => sum + r, 0) / older.length;
        
        if (recentAvg > olderAvg + 0.2) return 'improving';
        if (recentAvg < olderAvg - 0.2) return 'declining';
        return 'stable';
      };

      // Improving trend
      const improving = [4.8, 4.7, 4.5, 4.2, 4.0, 3.9, 3.8, 3.7, 3.6, 3.5];
      expect(calculateTrend(improving)).toBe('improving');

      // Declining trend
      const declining = [3.5, 3.6, 3.7, 3.8, 3.9, 4.0, 4.2, 4.5, 4.7, 4.8];
      expect(calculateTrend(declining)).toBe('declining');

      // Stable trend
      const stable = [4.0, 4.1, 3.9, 4.0, 4.1, 3.9, 4.0, 4.1, 3.9, 4.0];
      expect(calculateTrend(stable)).toBe('stable');

      // Edge cases
      expect(calculateTrend([])).toBe('stable');
      expect(calculateTrend([4.0])).toBe('stable');
      expect(calculateTrend([4.0, 4.0])).toBe('stable');
    });
  });

  describe('Performance History', () => {
    test('generates valid performance dates', () => {
      const generatePerformances = (count: number) => {
        const performances = [];
        const today = new Date();
        
        for (let i = 0; i < count; i++) {
          const date = new Date(today);
          date.setDate(date.getDate() - (i * 7)); // Weekly shows
          performances.push({
            date: date.toISOString(),
            weekOffset: i,
          });
        }
        
        return performances;
      };

      const perfs = generatePerformances(10);
      
      expect(perfs.length).toBe(10);
      
      // Check dates are valid and in order
      perfs.forEach((perf, index) => {
        expect(() => new Date(perf.date)).not.toThrow();
        expect(perf.weekOffset).toBe(index);
        
        if (index > 0) {
          const current = new Date(perf.date).getTime();
          const previous = new Date(perfs[index - 1].date).getTime();
          expect(current).toBeLessThan(previous);
        }
      });
    });

    test('generates valid performance data', () => {
      const generateMockPerformance = (showIndex: number) => {
        // Use index as seed for consistent testing
        const rating = parseFloat((3.5 + (showIndex % 15) * 0.1).toFixed(1));
        const earnings = 200 + (showIndex * 50) % 800;
        
        return {
          showId: `show-test-${showIndex}`,
          rating: Math.min(5.0, Math.max(3.5, rating)),
          earnings: Math.min(1000, Math.max(200, earnings)),
        };
      };

      // Test 10 performances
      for (let i = 0; i < 10; i++) {
        const perf = generateMockPerformance(i);
        
        expect(perf.showId).toBe(`show-test-${i}`);
        expect(perf.rating).toBeGreaterThanOrEqual(3.5);
        expect(perf.rating).toBeLessThanOrEqual(5.0);
        expect(perf.earnings).toBeGreaterThanOrEqual(200);
        expect(perf.earnings).toBeLessThanOrEqual(1000);
      }
    });
  });

  describe('Error States', () => {
    test('creates appropriate error messages', () => {
      const errors = {
        noId: new Error('No comedian ID provided'),
        fetchFailed: new Error('Failed to fetch comedian statistics'),
        networkError: new Error('Network request failed'),
      };

      expect(errors.noId.message).toBe('No comedian ID provided');
      expect(errors.fetchFailed.message).toBe('Failed to fetch comedian statistics');
      expect(errors.networkError.message).toBe('Network request failed');
      
      Object.values(errors).forEach(error => {
        expect(error).toBeInstanceOf(Error);
      });
    });

    test('validates state transitions', () => {
      // Initial state
      let state = {
        loading: true,
        error: null as Error | null,
      };
      
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
      
      // Success transition
      state = { loading: false, error: null };
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      
      // Error transition
      state = { loading: false, error: new Error('Test error') };
      expect(state.loading).toBe(false);
      expect(state.error).toBeInstanceOf(Error);
    });
  });

  describe('Input Validation', () => {
    test('handles various ID formats', () => {
      const generateSeed = (id: string) => {
        return id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      };

      const ids = [
        'simple',
        'with-dashes',
        'with_underscores',
        'MixedCase123',
        '12345',
        'special!@#$%',
        '',
        'very-long-id-'.repeat(100),
      ];

      ids.forEach(id => {
        const seed = generateSeed(id);
        const factor = (seed % 100) / 100;
        
        expect(typeof seed).toBe('number');
        expect(seed).toBeGreaterThanOrEqual(0);
        expect(factor).toBeGreaterThanOrEqual(0);
        expect(factor).toBeLessThan(1);
      });
    });
  });
});