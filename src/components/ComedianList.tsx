import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import ComedianCard from './ComedianCard';
import { Comedian } from '@/types/comedian';

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
  onContact 
}) => {
  const filteredComedians = comedians.filter(comedian =>
    comedian.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comedian.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comedian.specialties?.some(specialty => 
      specialty.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {filteredComedians.map((comedian) => (
        <ComedianCard
          key={comedian.id}
          comedian={comedian}
          isContacting={contacting === comedian.id}
          onContact={onContact}
        />
      ))}
    </div>
  );
};

export default ComedianList;
