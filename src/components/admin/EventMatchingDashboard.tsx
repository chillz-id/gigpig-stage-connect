import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link2, CheckCircle, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PendingMatch {
  id: string;
  platform: string;
  external_event_id: string;
  external_title: string;
  external_venue: string;
  external_date: string;
  suggested_matches: any[];
  suggested_event_id: string | null;
  suggested_title: string | null;
  suggested_venue: string | null;
  suggested_date: string | null;
}

export const EventMatchingDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMatches, setSelectedMatches] = useState<Record<string, string>>({});

  // Fetch pending matches
  const { data: pendingMatches, isLoading } = useQuery({
    queryKey: ['pending-event-matches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pending_event_matches')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as PendingMatch[];
    }
  });

  // Link event mutation
  const linkEventMutation = useMutation({
    mutationFn: async ({ platform, externalId, eventId }: {
      platform: string;
      externalId: string;
      eventId: string;
    }) => {
      const { error } = await supabase.rpc('link_external_event', {
        p_platform: platform,
        p_external_id: externalId,
        p_event_id: eventId
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-event-matches'] });
      toast({
        title: "Events linked successfully",
        description: "The external event has been linked to your Stand Up Sydney event.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to link events",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Ignore match mutation
  const ignoreMatchMutation = useMutation({
    mutationFn: async ({ platform, externalId }: {
      platform: string;
      externalId: string;
    }) => {
      const { error } = await supabase
        .from('unmatched_external_events')
        .update({ match_status: 'ignored' })
        .eq('platform', platform)
        .eq('external_event_id', externalId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-event-matches'] });
      toast({
        title: "Match ignored",
        description: "This external event will no longer appear in pending matches.",
      });
    }
  });

  const handleLinkEvent = (match: PendingMatch) => {
    const selectedEventId = selectedMatches[match.id] || match.suggested_event_id;
    
    if (!selectedEventId) {
      toast({
        title: "No event selected",
        description: "Please select an event to link to.",
        variant: "destructive",
      });
      return;
    }

    linkEventMutation.mutate({
      platform: match.platform,
      externalId: match.external_event_id,
      eventId: selectedEventId
    });
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, string> = {
      humanitix: '🎟️',
      eventbrite: '🎫',
      ticketek: '🎪',
      trybooking: '📋',
    };
    return icons[platform] || '🎟️';
  };

  const getMatchScore = (match: any) => {
    if (!match || !match.match_score) return 0;
    return parseInt(match.match_score);
  };

  const getMatchQuality = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'bg-green-500' };
    if (score >= 60) return { label: 'Good', color: 'bg-blue-500' };
    if (score >= 40) return { label: 'Fair', color: 'bg-yellow-500' };
    return { label: 'Poor', color: 'bg-red-500' };
  };

  if (isLoading) {
    return <div className="animate-pulse">Loading pending matches...</div>;
  }

  const pendingCount = pendingMatches?.length || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Event Matching Dashboard
            </span>
            <Badge variant={pendingCount > 0 ? "destructive" : "secondary"}>
              {pendingCount} Pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCount === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                All external events are matched! The system will automatically match new events as they appear.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingMatches?.map((match) => {
                const topMatch = match.suggested_matches?.[0];
                const matchScore = getMatchScore(topMatch);
                const matchQuality = getMatchQuality(matchScore);

                return (
                  <Card key={match.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* External Event */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            {getPlatformIcon(match.platform)} External Event ({match.platform})
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p><strong>Title:</strong> {match.external_title}</p>
                            <p><strong>Venue:</strong> {match.external_venue}</p>
                            <p><strong>Date:</strong> {new Date(match.external_date).toLocaleDateString()}</p>
                            <p><strong>Time:</strong> {new Date(match.external_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            <p><strong>ID:</strong> <code className="text-xs">{match.external_event_id}</code></p>
                          </div>
                        </div>

                        {/* Suggested Match */}
                        <div>
                          <h4 className="font-semibold mb-2 flex items-center gap-2">
                            🎯 Suggested Match
                            {topMatch && (
                              <Badge className={matchQuality.color}>
                                {matchQuality.label} ({matchScore}%)
                              </Badge>
                            )}
                          </h4>
                          
                          {match.suggested_event_id ? (
                            <div className="space-y-1 text-sm">
                              <p><strong>Title:</strong> {match.suggested_title}</p>
                              <p><strong>Venue:</strong> {match.suggested_venue}</p>
                              <p><strong>Date:</strong> {new Date(match.suggested_date).toLocaleDateString()}</p>
                              <p><strong>Time:</strong> {new Date(match.suggested_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              
                              {/* Match reasons */}
                              {topMatch?.match_reasons && (
                                <div className="mt-2 flex gap-2 flex-wrap">
                                  {topMatch.match_reasons.title_match && (
                                    <Badge className="professional-button text-xs">Title Match</Badge>
                                  )}
                                  {topMatch.match_reasons.venue_match && (
                                    <Badge className="professional-button text-xs">Venue Match</Badge>
                                  )}
                                  {topMatch.match_reasons.date_match && (
                                    <Badge className="professional-button text-xs">Date Match</Badge>
                                  )}
                                  {topMatch.match_reasons.exact_time_match && (
                                    <Badge className="professional-button text-xs bg-green-50">Exact Time</Badge>
                                  )}
                                  {!topMatch.match_reasons.exact_time_match && topMatch.match_reasons.time_match_quality === 'very_close' && (
                                    <Badge className="professional-button text-xs bg-blue-50">±30min</Badge>
                                  )}
                                  {topMatch.match_reasons.time_match_quality === 'close' && (
                                    <Badge className="professional-button text-xs bg-yellow-50">±1hr</Badge>
                                  )}
                                </div>
                              )}

                              {/* Other suggestions */}
                              {match.suggested_matches?.length > 1 && (
                                <div className="mt-3">
                                  <select
                                    className="w-full text-sm border rounded p-1"
                                    value={selectedMatches[match.id] || match.suggested_event_id || ''}
                                    onChange={(e) => setSelectedMatches({
                                      ...selectedMatches,
                                      [match.id]: e.target.value
                                    })}
                                  >
                                    <option value="">Select a different match...</option>
                                    {match.suggested_matches.map((suggestion: any) => (
                                      <option key={suggestion.event_id} value={suggestion.event_id}>
                                        {suggestion.event_title} ({getMatchScore(suggestion)}% match)
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                No automatic matches found. Please select an event manually or create a new one.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleLinkEvent(match)}
                          disabled={!match.suggested_event_id && !selectedMatches[match.id]}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Link Events
                        </Button>
                        <Button
                          size="sm"
                          className="professional-button"
                          onClick={() => ignoreMatchMutation.mutate({
                            platform: match.platform,
                            externalId: match.external_event_id
                          })}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Ignore
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            // Open external event in new tab
                            if (match.platform === 'humanitix') {
                              window.open(`https://events.humanitix.com/${match.external_event_id}`, '_blank');
                            } else if (match.platform === 'eventbrite') {
                              window.open(`https://www.eventbrite.com/e/${match.external_event_id}`, '_blank');
                            }
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};