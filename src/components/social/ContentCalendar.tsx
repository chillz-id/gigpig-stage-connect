/**
 * ContentCalendar Component
 * Visual month calendar showing scheduled posts by date.
 * Color-coded by platform with post count badges.
 */

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useScheduledPosts } from '@/hooks/social/useScheduledPosts';
import { useReviewQueue } from '@/hooks/social/useReviewQueue';
import type { ScheduledPost, ContentDraft } from '@/types/social';

const PLATFORM_COLORS: Record<string, string> = {
  INSTAGRAM: 'bg-pink-500',
  FACEBOOK: 'bg-blue-600',
  TIKTOK: 'bg-zinc-800',
  TWITTER: 'bg-sky-500',
  YOUTUBE: 'bg-red-600',
  LINKEDIN: 'bg-blue-700',
  THREADS: 'bg-zinc-700',
  BLUESKY: 'bg-blue-400',
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  metricoolPosts: ScheduledPost[];
  drafts: ContentDraft[];
}

interface ContentCalendarProps {
  organizationId: string | undefined;
  blogId?: string;
}

export function ContentCalendar({ organizationId, blogId }: ContentCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Fetch Metricool posts for the visible month range
  const start = new Date(year, month - 1, 1).toISOString().slice(0, 19);
  const end = new Date(year, month + 2, 0).toISOString().slice(0, 19);
  const { data: postsResponse, isLoading: postsLoading } = useScheduledPosts(start, end, blogId);

  // Fetch drafts for the organization
  const { data: drafts, isLoading: draftsLoading } = useReviewQueue(organizationId);

  const isLoading = postsLoading || draftsLoading;

  const metricoolPosts = useMemo(() => {
    if (!postsResponse?.data) return [];
    return Array.isArray(postsResponse.data) ? postsResponse.data : [];
  }, [postsResponse]);

  // Build calendar grid
  const calendarDays = useMemo((): CalendarDay[] => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    // Previous month padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false, isToday: false, metricoolPosts: [], drafts: [] });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().slice(0, 10);

      const dayPosts = metricoolPosts.filter((p) => {
        const postDate = p.publicationDate?.dateTime?.slice(0, 10);
        return postDate === dateStr;
      });

      const dayDrafts = (drafts ?? []).filter((dr) => {
        if (!dr.scheduled_for) return false;
        return dr.scheduled_for.slice(0, 10) === dateStr;
      });

      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        metricoolPosts: dayPosts,
        drafts: dayDrafts,
      });
    }

    // Next month padding (fill to 6 rows)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({ date, isCurrentMonth: false, isToday: false, metricoolPosts: [], drafts: [] });
    }

    return days;
  }, [year, month, metricoolPosts, drafts]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>{MONTHS[month]} {year}</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-px mb-1">
                {DAYS.map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-px">
                {calendarDays.map((day, i) => {
                  const totalPosts = day.metricoolPosts.length + day.drafts.length;
                  const isSelected = selectedDay?.date.getTime() === day.date.getTime();

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(totalPosts > 0 ? day : null)}
                      className={`
                        min-h-[72px] p-1 text-left rounded transition-colors
                        ${day.isCurrentMonth ? '' : 'opacity-40'}
                        ${day.isToday ? 'bg-primary/10 ring-1 ring-primary' : ''}
                        ${isSelected ? 'bg-accent ring-1 ring-accent-foreground/20' : 'hover:bg-muted/50'}
                      `}
                    >
                      <span className={`text-xs font-medium ${day.isToday ? 'text-primary' : ''}`}>
                        {day.date.getDate()}
                      </span>

                      {/* Platform dots */}
                      {totalPosts > 0 && (
                        <div className="flex flex-wrap gap-0.5 mt-1">
                          {day.metricoolPosts.slice(0, 4).map((post, j) => {
                            const network = post.providers?.[0]?.network ?? '';
                            const color = PLATFORM_COLORS[network] ?? 'bg-gray-400';
                            return (
                              <div
                                key={`p-${j}`}
                                className={`h-2 w-2 rounded-full ${color}`}
                                title={`${network.toLowerCase()} - ${post.text?.slice(0, 40) ?? ''}`}
                              />
                            );
                          })}
                          {day.drafts.slice(0, 4).map((draft, j) => (
                            <div
                              key={`d-${j}`}
                              className="h-2 w-2 rounded-full bg-yellow-500 ring-1 ring-yellow-300"
                              title={`Draft: ${draft.platform} - ${draft.caption.slice(0, 40)}`}
                            />
                          ))}
                          {totalPosts > 4 && (
                            <span className="text-[10px] text-muted-foreground">+{totalPosts - 4}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected day detail */}
      {selectedDay && (selectedDay.metricoolPosts.length > 0 || selectedDay.drafts.length > 0) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedDay.date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedDay.metricoolPosts.map((post, i) => (
              <div key={`mp-${i}`} className="flex items-start gap-2 p-2 rounded border">
                <div className="flex gap-1 flex-shrink-0 mt-0.5">
                  {post.providers?.map((p) => {
                    const color = PLATFORM_COLORS[p.network ?? ''] ?? 'bg-gray-400';
                    return (
                      <div
                        key={p.network}
                        className={`h-3 w-3 rounded-full ${color}`}
                        title={p.network?.toLowerCase()}
                      />
                    );
                  })}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{post.text}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {post.publicationDate?.dateTime
                        ? new Date(post.publicationDate.dateTime).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                    <Badge variant="secondary" className="text-[10px] h-4">
                      {post.providers?.[0]?.status ?? 'PENDING'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
            {selectedDay.drafts.map((draft) => (
              <div key={draft.id} className="flex items-start gap-2 p-2 rounded border border-yellow-200 bg-yellow-50/50">
                <div className="h-3 w-3 rounded-full bg-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2">{draft.caption}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] h-4 capitalize">
                      {draft.platform}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] h-4 capitalize bg-yellow-100">
                      {draft.status}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        {Object.entries(PLATFORM_COLORS).map(([network, color]) => (
          <div key={network} className="flex items-center gap-1">
            <div className={`h-2.5 w-2.5 rounded-full ${color}`} />
            <span className="capitalize">{network.toLowerCase()}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-yellow-500 ring-1 ring-yellow-300" />
          <span>Draft</span>
        </div>
      </div>
    </div>
  );
}
