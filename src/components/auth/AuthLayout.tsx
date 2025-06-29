
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center font-sans text-neutral-200 relative overflow-hidden">
      {/* Reactive Glow */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-60 blur-3xl transition-opacity duration-700"
        style={{
          background: 'radial-gradient(600px circle at 50% 50%, rgba(168,85,247,0.35), transparent 60%)'
        }}
      />
      
      {/* Card */}
      <div className="w-full max-w-md px-8 py-10 bg-neutral-900/80 backdrop-blur rounded-xl shadow-2xl ring-1 ring-neutral-800 space-y-8 animate-fade-in">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
