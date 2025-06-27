
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, profile, hasRole } = useAuth();

  if (user && profile) {
    return (
      <Link to="/profile" className="flex items-center space-x-3 hover:bg-accent rounded-xl p-3 transition-all duration-200 group">
        <div className="w-10 h-10 rounded-full border-2 border-border group-hover:border-primary transition-colors duration-200 bg-primary/10 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">
            {profile.name ? profile.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="text-foreground">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-semibold">{profile.name || user.email}</span>
            {profile.is_verified && <Star className="w-4 h-4 text-yellow-400 fill-current" />}
          </div>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
              {hasRole('admin') ? 'ADMIN' : hasRole('promoter') ? 'PROMOTER' : 'COMEDIAN'}
            </Badge>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      <Link to="/auth">
        <Button variant="outline" className="text-foreground border-border hover:bg-accent transition-all duration-200 rounded-lg">
          Sign In
        </Button>
      </Link>
      <Link to="/auth">
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
          Get Started
        </Button>
      </Link>
    </div>
  );
};

export default UserProfile;
