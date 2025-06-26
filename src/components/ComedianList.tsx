
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import ComedianCard from './ComedianCard';
import { useToast } from '@/hooks/use-toast';

interface Comedian {
  id: string;
  name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  email: string | null;
  years_experience?: number;
  show_count?: number;
  social_media?: {
    instagram?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
}

interface ComedianListProps {
  comedians: Comedian[];
  loading: boolean;
  searchTerm: string;
  contacting: string | null;
  onContact: (comedianId: string, comedianEmail: string) => void;
}

const ComedianList: React.FC<ComedianListProps> = ({
  comedians,
  loading,
  searchTerm,
  contacting,
  onContact,
}) => {
  const { toast } = useToast();
  const [vouchedComedians, setVouchedComedians] = useState<Set<string>>(new Set());

  const handleVouch = (comedianId: string) => {
    const newVouchedComedians = new Set(vouchedComedians);
    if (vouchedComedians.has(comedianId)) {
      newVouchedComedians.delete(comedianId);
      toast({
        title: "Vouch removed",
        description: "You've removed your vouch for this comedian.",
      });
    } else {
      newVouchedComedians.add(comedianId);
      toast({
        title: "Comedian vouched!",
        description: "You've vouched for this comedian.",
      });
    }
    setVouchedComedians(newVouchedComedians);
  };

  const filteredComedians = comedians.filter(comedian =>
    comedian.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comedian.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (filteredComedians.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            {searchTerm ? 'No comedians found matching your search.' : 'No comedians available at the moment.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredComedians.map((comedian) => (
        <ComedianCard
          key={comedian.id}
          comedian={comedian}
          isContacting={contacting === comedian.id}
          onContact={onContact}
          onVouch={handleVouch}
          isVouched={vouchedComedians.has(comedian.id)}
        />
      ))}
    </div>
  );
};

export default ComedianList;
