
import React from 'react';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MemberViewNavigationProps {
  user: any;
}

const MemberViewNavigation: React.FC<MemberViewNavigationProps> = ({ user }) => {
  return (
    <div className="flex items-center space-x-6">
      <Link 
        to="/browse" 
        className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
      >
        Shows
      </Link>
      <Link 
        to="/comedians" 
        className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
      >
        Comedians
      </Link>
      {/* Calendar link removed from member view navigation */}
      <Link to={user ? "/profile?tab=book-comedian" : "/auth"}>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 shadow-md hover:shadow-lg rounded-lg">
          <User className="w-4 h-4 mr-2" />
          Book Comedian
        </Button>
      </Link>
    </div>
  );
};

export default MemberViewNavigation;
