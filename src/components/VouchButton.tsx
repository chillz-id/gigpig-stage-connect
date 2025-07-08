
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VouchButtonProps {
  profileId: string;
  profileName: string;
  vouchCount?: number;
  hasVouched?: boolean;
  className?: string;
  variant?: 'default' | 'icon';
}

const VouchButton: React.FC<VouchButtonProps> = ({ 
  profileId, 
  profileName, 
  vouchCount = 0, 
  hasVouched = false,
  className = '',
  variant = 'default'
}) => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [isVouching, setIsVouching] = useState(false);
  const [currentVouchCount, setCurrentVouchCount] = useState(vouchCount);
  const [userHasVouched, setUserHasVouched] = useState(hasVouched);

  const handleVouch = async () => {
    if (!user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to vouch for someone.",
        variant: "destructive",
      });
      return;
    }

    if (profileId === user.id) {
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
          description: `You removed your vouch for ${profileName}`,
        });
      } else {
        setCurrentVouchCount(prev => prev + 1);
        setUserHasVouched(true);
        toast({
          title: "Vouched!",
          description: `You vouched for ${profileName}`,
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

  // Show vouch count for non-authenticated users
  if (!user) {
    if (variant === 'icon') {
      return currentVouchCount > 0 ? (
        <div className="flex items-center gap-1">
          <Crown className="w-5 h-5 text-yellow-400 fill-current" />
          <span className="text-white text-sm font-medium">{currentVouchCount}</span>
        </div>
      ) : null;
    }
    
    return currentVouchCount > 0 ? (
      <Badge variant="outline" className={`text-xs ${className}`}>
        <Crown className="w-3 h-3 mr-1 text-yellow-400 fill-current" />
        {currentVouchCount} vouch{currentVouchCount !== 1 ? 'es' : ''}
      </Badge>
    ) : null;
  }

  // Icon variant - just crown and number
  if (variant === 'icon') {
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={handleVouch}
        disabled={isVouching}
        className={`group flex items-center gap-1 p-2 bg-black/50 hover:bg-black/70 transition-all duration-300 ${className}`}
      >
        {isVouching ? (
          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
        ) : (
          <Crown className={`w-5 h-5 text-yellow-400 ${userHasVouched ? 'fill-current' : ''}`} />
        )}
        
        {/* Vouch count */}
        {currentVouchCount > 0 && (
          <span className="text-white text-sm font-medium">{currentVouchCount}</span>
        )}
      </Button>
    );
  }

  // Default variant
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant={userHasVouched ? "default" : "outline"}
        onClick={handleVouch}
        disabled={isVouching}
        className={`text-xs ${className}`}
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
