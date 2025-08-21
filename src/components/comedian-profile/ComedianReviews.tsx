
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, User, Calendar, Building } from 'lucide-react';

interface ComedianReviewsProps {
  comedianId: string;
}

interface Review {
  id: string;
  reviewer_name: string;
  reviewer_title: string | null;
  rating: number | null;
  review_text: string;
  event_name: string | null;
  event_date: string | null;
  is_featured: boolean;
  created_at: string;
}

const ComedianReviews: React.FC<ComedianReviewsProps> = ({ comedianId }) => {
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['comedian-reviews', comedianId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comedian_reviews')
        .select('*')
        .eq('comedian_id', comedianId)
        .eq('is_public', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
  });

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-full mb-1"></div>
                <div className="h-3 bg-muted rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reviews & Testimonials</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No reviews available yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews & Testimonials</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b last:border-b-0 pb-6 last:pb-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{review.reviewer_name}</h4>
                    {review.is_featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                  </div>
                  {review.reviewer_title && (
                    <p className="text-sm text-muted-foreground mb-2">{review.reviewer_title}</p>
                  )}
                  {review.rating && (
                    <div className="mb-2">
                      {renderStars(review.rating)}
                    </div>
                  )}
                </div>
              </div>
              
              <blockquote className="text-muted-foreground italic mb-3">
                "{review.review_text}"
              </blockquote>
              
              {(review.event_name || review.event_date) && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {review.event_name && (
                    <div className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      <span>{review.event_name}</span>
                    </div>
                  )}
                  {review.event_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(review.event_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ComedianReviews;
