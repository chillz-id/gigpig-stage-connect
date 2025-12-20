import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface LoadMoreMonthButtonProps {
  nextMonthLabel: string;
  onLoadMore: () => void;
  isLoading?: boolean;
}

/**
 * LoadMoreMonthButton Component
 *
 * Button displayed at the end of event list for progressive month loading.
 * Shows "See {Month}" to load the next month's events.
 */
export function LoadMoreMonthButton({
  nextMonthLabel,
  onLoadMore,
  isLoading = false,
}: LoadMoreMonthButtonProps) {
  const { theme } = useTheme();

  return (
    <div className="flex justify-center py-6">
      <Button
        onClick={onLoadMore}
        disabled={isLoading}
        variant="secondary"
        size="lg"
        className={cn(
          "gap-2 px-8 py-6 text-base font-semibold rounded-xl transition-all",
          theme === 'pleasure'
            ? 'bg-purple-600/20 hover:bg-purple-600/40 text-white border-purple-500/50 hover:border-purple-400'
            : 'bg-red-600/20 hover:bg-red-600/40 text-white border-red-500/50 hover:border-red-400'
        )}
      >
        {isLoading ? (
          <>
            <span className="animate-spin">⏳</span>
            Loading...
          </>
        ) : (
          <>
            See {nextMonthLabel}
            <ChevronDown className="w-5 h-5" />
          </>
        )}
      </Button>
    </div>
  );
}
