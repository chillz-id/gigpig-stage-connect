// Promoter Avatar - Avatar component for promoters/companies
import React from 'react';
import { Building2, User } from 'lucide-react';

interface PromoterAvatarProps {
  name: string | null;
  avatar_url: string | null;
  isCompany?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const PromoterAvatar: React.FC<PromoterAvatarProps> = ({ 
  name, 
  avatar_url, 
  isCompany = false,
  size = 'xl',
  className = ''
}) => {
  const getInitials = (name: string) => {
    if (!name) return '?';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-full h-full text-4xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-24 h-24'
  };

  const baseClasses = `
    ${sizeClasses[size]} 
    rounded-2xl 
    flex 
    items-center 
    justify-center 
    font-bold 
    transition-all 
    duration-200
    ${className}
  `;

  if (avatar_url) {
    return (
      <img
        src={avatar_url}
        alt={name || 'Promoter'}
        className={`${baseClasses} object-cover`}
        onError={(e) => {
          // Fallback to initials if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          if (target.nextSibling) {
            (target.nextSibling as HTMLElement).style.display = 'flex';
          }
        }}
      />
    );
  }

  // Gradient background for promoters
  const gradients = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-orange-500 to-red-600',
    'from-teal-500 to-cyan-600',
    'from-indigo-500 to-purple-600'
  ];

  // Use name to consistently pick a gradient
  const gradientIndex = name ? name.length % gradients.length : 0;
  const selectedGradient = gradients[gradientIndex];

  return (
    <div className={`${baseClasses} bg-gradient-to-br ${selectedGradient} text-white relative overflow-hidden`}>
      {/* Background pattern for companies */}
      {isCompany && (
        <div className="absolute inset-0 opacity-20">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Crect x='0' y='0' width='1' height='1'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}
          />
        </div>
      )}

      {/* Display initials or fallback icon */}
      {name ? (
        <span className="relative z-10 font-bold tracking-tight">
          {getInitials(name)}
        </span>
      ) : (
        <div className="relative z-10">
          {isCompany ? (
            <Building2 className={iconSizes[size]} />
          ) : (
            <User className={iconSizes[size]} />
          )}
        </div>
      )}

      {/* Subtle shine effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default PromoterAvatar;