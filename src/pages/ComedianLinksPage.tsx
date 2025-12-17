import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CustomLinks } from '@/components/comedian-profile/CustomLinks';
import { OptimizedAvatar } from '@/components/ui/OptimizedAvatar';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ComedianLinksPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  // Fetch comedian data by slug
  const { data: comedian, isLoading, error } = useQuery({
    queryKey: ['comedian', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comedians')
        .select('id, stage_name, avatar_url, url_slug')
        .eq('url_slug', slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  if (error || !comedian) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-2xl mb-4">Comedian not found</h1>
          <Link to="/comedians" className="text-purple-400 hover:text-purple-300">
            Browse all comedians
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-black">
      {/* Header */}
      <div className="pt-12 pb-8 px-4">
        <div className="max-w-md mx-auto text-center">
          {/* Avatar */}
          <OptimizedAvatar
            src={comedian.avatar_url}
            name={comedian.stage_name}
            className="w-24 h-24 mx-auto mb-4 border-4 border-white/20"
            fallbackClassName="bg-purple-600 text-white text-2xl"
          />

          {/* Name */}
          <h1 className="text-3xl font-bold text-white mb-2">{comedian.stage_name}</h1>
          <p className="text-purple-200 text-sm">@{comedian.url_slug}</p>
        </div>
      </div>

      {/* Links Section */}
      <div className="px-4 pb-12">
        <div className="max-w-md mx-auto">
          <CustomLinks
            userId={comedian.id}
            isOwnProfile={false}
            compact={true}
          />
        </div>
      </div>

      {/* Footer - View Full Profile Link */}
      <div className="px-4 pb-12">
        <div className="max-w-md mx-auto text-center">
          <Link to={`/comedian/${comedian.url_slug}`}>
            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/10 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              View Full Profile
            </Button>
          </Link>
        </div>
      </div>

      {/* Branding Footer */}
      <div className="px-4 pb-8">
        <div className="max-w-md mx-auto text-center">
          <p className="text-white/40 text-xs">
            Powered by <span className="text-purple-400">Stand Up Sydney</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComedianLinksPage;
