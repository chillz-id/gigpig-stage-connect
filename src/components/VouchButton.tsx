
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VouchButtonProps {
  comedianId: string;
  comedianName: string;
  vouchCount?: number;
  hasVouched?: boolean;
}

const VouchButton: React.FC<VouchButtonProps> = ({ 
  comedianId, 
  comedianName, 
  vouchCount = 0, 
  hasVouched = false 
}) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [isVouching, setIsVouching] = useState(false);
  const [currentVouchCount, setCurrentVouchCount] = useState(vouchCount);
  const [userHasVouched, setUserHasVouched] = useState(hasVouched);

  const handleVouch = async () => {
    if (!user || !hasRole('comedian')) {
      toast({
        title: "Access Required",
        description: "Only comedians can vouch for each other.",
        variant: "destructive",
      });
      return;
    }

    if (comedianId === user.id) {
      toast({
        title: "Cannot Vouch",
        description: "You cannot vouch for yourself.",
        variant: "destructive",
      });
      return;
    }

    setIsVouching(true);
    try {
      // Simulate vouching action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (userHasVouched) {
        setCurrentVouchCount(prev => prev - 1);
        setUserHasVouched(false);
        toast({
          title: "Vouch Removed",
          description: `You removed your vouch for ${comedianName}`,
        });
      } else {
        setCurrentVouchCount(prev => prev + 1);
        setUserHasVouched(true);
        toast({
          title: "Vouched!",
          description: `You vouched for ${comedianName}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update vouch",
        variant: "destructive",
      });
    } finally {
      setIsVouching(false);
    }
  };

  // Only show vouch button if user is a comedian
  if (!hasRole('comedian')) {
    return currentVouchCount > 0 ? (
      <Badge variant="outline" className="text-xs">
        <Crown className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
        {currentVouchCount} vouch{currentVouchCount !== 1 ? 'es' : ''}
      </Badge>
    ) : null;
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={userHasVouched ? "default" : "outline"}
        onClick={handleVouch}
        disabled={isVouching}
        className="text-xs"
      >
        {isVouching ? (
          <Loader2 className="w-3 h-3 animate-spin mr-1" />
        ) : (
          <Crown className={`w-3 h-3 mr-1 text-yellow-400 ${userHasVouched ? 'fill-current' : ''}`} />
        )}
        {userHasVouched ? 'Vouched' : 'Vouch'}
      </Button>
      {currentVouchCount > 0 && (
        <Badge variant="outline" className="text-xs">
          {currentVouchCount}
        </Badge>
      )}
    </div>
  );
};

export default VouchButton;
