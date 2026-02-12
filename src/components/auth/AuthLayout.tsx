
import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#131b2b] p-4">
      <div className="w-full max-w-md">
        <div className="bg-neutral-900/95 backdrop-blur-sm border border-neutral-800 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Stand Up Sydney</h1>
            <p className="text-neutral-400 text-sm sm:text-base">Comedy community platform</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
