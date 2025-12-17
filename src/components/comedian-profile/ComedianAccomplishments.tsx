import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import CareerHighlights from './accomplishments/CareerHighlights';
import ComedianVouches from './accomplishments/ComedianVouches';
import PressReviews from './accomplishments/PressReviews';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { VouchWithProfiles } from '@/types/vouch';
import { useToast } from '@/hooks/use-toast';

interface ComedianAccomplishmentsProps {
  comedianId: string;
  isOwnProfile?: boolean;
}

const ComedianAccomplishments: React.FC<ComedianAccomplishmentsProps> = ({
  comedianId,
  isOwnProfile = false,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch vouches for this comedian
  const { data: vouchesData = [] } = useQuery({
    queryKey: ['comedian-vouches', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_vouches_with_profiles', { user_id_param: comedianId });

      if (error) throw error;
      return (data || []) as VouchWithProfiles[];
    },
    enabled: !!comedianId,
  });

  // Fetch accomplishments
  const { data: accomplishments = [] } = useQuery({
    queryKey: ['accomplishments', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comedian_accomplishments')
        .select('*')
        .eq('user_id', comedianId)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!comedianId,
  });

  // Fetch press reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ['press-reviews', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('press_reviews')
        .select('*')
        .eq('user_id', comedianId)
        .order('review_date', { ascending: false });

      if (error) throw error;

      // Transform data to match the Review interface
      return (data || []).map(review => ({
        id: review.id,
        publication: review.publication,
        rating: review.rating,
        hookLine: review.hook_line,
        url: review.url || '',
        date: review.review_date,
      }));
    },
    enabled: !!comedianId,
  });

  // Filter for received vouches only
  const receivedVouches = vouchesData.filter(vouch => vouch.vouchee_id === comedianId);

  // Accomplishment mutations
  const addAccomplishmentMutation = useMutation({
    mutationFn: async (accomplishment: string) => {
      const maxOrder = accomplishments.length > 0
        ? Math.max(...accomplishments.map(a => a.display_order))
        : -1;

      const { error } = await supabase
        .from('comedian_accomplishments')
        .insert({
          user_id: comedianId,
          accomplishment,
          display_order: maxOrder + 1,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accomplishments', comedianId] });
      toast({
        title: 'Accomplishment added',
        description: 'Your accomplishment has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add accomplishment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const editAccomplishmentMutation = useMutation({
    mutationFn: async ({ id, accomplishment }: { id: string; accomplishment: string }) => {
      const { error } = await supabase
        .from('comedian_accomplishments')
        .update({ accomplishment })
        .eq('id', id)
        .eq('user_id', comedianId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accomplishments', comedianId] });
      toast({
        title: 'Accomplishment updated',
        description: 'Your accomplishment has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update accomplishment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteAccomplishmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('comedian_accomplishments')
        .delete()
        .eq('id', id)
        .eq('user_id', comedianId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accomplishments', comedianId] });
      toast({
        title: 'Accomplishment deleted',
        description: 'Your accomplishment has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete accomplishment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Press review mutations
  const addReviewMutation = useMutation({
    mutationFn: async (review: {
      publication: string;
      rating: number;
      hookLine: string;
      url: string;
      reviewDate: string;
    }) => {
      const { error } = await supabase
        .from('press_reviews')
        .insert({
          user_id: comedianId,
          publication: review.publication,
          rating: review.rating,
          hook_line: review.hookLine,
          url: review.url || null,
          review_date: review.reviewDate,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-reviews', comedianId] });
      toast({
        title: 'Review added',
        description: 'Your press review has been added successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to add review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const editReviewMutation = useMutation({
    mutationFn: async ({
      id,
      review,
    }: {
      id: string;
      review: {
        publication: string;
        rating: number;
        hookLine: string;
        url: string;
        reviewDate: string;
      };
    }) => {
      const { error } = await supabase
        .from('press_reviews')
        .update({
          publication: review.publication,
          rating: review.rating,
          hook_line: review.hookLine,
          url: review.url || null,
          review_date: review.reviewDate,
        })
        .eq('id', id)
        .eq('user_id', comedianId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-reviews', comedianId] });
      toast({
        title: 'Review updated',
        description: 'Your press review has been updated successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to update review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('press_reviews')
        .delete()
        .eq('id', id)
        .eq('user_id', comedianId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['press-reviews', comedianId] });
      toast({
        title: 'Review deleted',
        description: 'Your press review has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to delete review',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return (
    <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white text-xl sm:text-2xl">
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
          Accomplishments & Reviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        <CareerHighlights
          accomplishments={accomplishments}
          isOwnProfile={isOwnProfile}
          onAdd={isOwnProfile ? (accomplishment) => addAccomplishmentMutation.mutate(accomplishment) : undefined}
          onEdit={isOwnProfile ? (id, accomplishment) => editAccomplishmentMutation.mutate({ id, accomplishment }) : undefined}
          onDelete={isOwnProfile ? (id) => deleteAccomplishmentMutation.mutate(id) : undefined}
        />
        <ComedianVouches vouches={receivedVouches} />
        <PressReviews
          reviews={reviews}
          isOwnProfile={isOwnProfile}
          onAdd={isOwnProfile ? (review) => addReviewMutation.mutate(review) : undefined}
          onEdit={isOwnProfile ? (id, review) => editReviewMutation.mutate({ id, review }) : undefined}
          onDelete={isOwnProfile ? (id) => deleteReviewMutation.mutate(id) : undefined}
        />
      </CardContent>
    </Card>
  );
};

export default ComedianAccomplishments;
