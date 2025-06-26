
import React from 'react';
import { Link } from 'react-router-dom';

const ComedianViewNavigation: React.FC = () => {
  return (
    <div className="flex items-center space-x-6">
      <Link 
        to="/browse" 
        className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
      >
        Shows
      </Link>
      <Link 
        to="/invoices" 
        className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
      >
        Invoices
      </Link>
      <Link 
        to="/comedians" 
        className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
      >
        Comedians
      </Link>
      <Link 
        to="/dashboard" 
        className="text-foreground hover:text-primary bg-transparent hover:bg-accent/50 transition-all duration-200 font-medium px-4 py-2 rounded-lg"
      >
        Dashboard
      </Link>
    </div>
  );
};

export default ComedianViewNavigation;
