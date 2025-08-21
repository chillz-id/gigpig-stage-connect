
import React from 'react';
import { Star, ExternalLink } from 'lucide-react';

interface Review {
  id: string;
  publication: string;
  rating: number;
  hookLine: string;
  url: string;
  date: string;
}

interface PressReviewsProps {
  reviews: Review[];
}

const PressReviews: React.FC<PressReviewsProps> = ({ reviews }) => {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1 mb-2">
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

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Press Reviews</h3>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600/50">
            {renderStars(review.rating)}
            <blockquote className="text-gray-300 italic mb-3">
              "{review.hookLine}"
            </blockquote>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{review.publication}</p>
                <p className="text-gray-400 text-sm">{review.date}</p>
              </div>
              <a 
                href={review.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                Read Full Review
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PressReviews;
