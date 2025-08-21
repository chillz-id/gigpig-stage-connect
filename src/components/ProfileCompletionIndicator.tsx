import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

export const ProfileCompletionIndicator: React.FC = () => {
  const { completionStatus } = useProfileCompletion();
  const { theme } = useTheme();

  const getCardStyles = () => {
    if (theme === 'pleasure') {
      return 'bg-white/[0.08] backdrop-blur-md border-white/[0.15] text-white';
    }
    return 'bg-gray-800/90 border-gray-600 text-gray-100';
  };

  const getProgressColor = () => {
    if (completionStatus.percentage >= 80) return 'bg-green-500';
    if (completionStatus.percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusColor = () => {
    if (completionStatus.isComplete) return 'bg-green-500 text-white';
    if (completionStatus.percentage >= 60) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  const allFields = [
    { key: 'name', label: 'Name' },
    { key: 'avatar', label: 'Profile Photo' },
    { key: 'bio', label: 'Bio' },
    { key: 'location', label: 'Location' },
    { key: 'social', label: 'Social Media' }
  ];

  return (
    <Card className={cn(getCardStyles(), 'mb-6')}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            {completionStatus.isComplete ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            Profile Completion
          </span>
          <Badge className={getStatusColor()}>
            {completionStatus.percentage}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{completionStatus.percentage}% Complete</span>
          </div>
          <Progress 
            value={completionStatus.percentage} 
            className="h-2"
          />
        </div>

        {/* Completion Status */}
        {!completionStatus.isComplete && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Complete your profile to get started:</h4>
            <div className="grid grid-cols-1 gap-2">
              {allFields.map(field => {
                const isCompleted = completionStatus.completedFields.includes(field.label);
                return (
                  <div key={field.key} className="flex items-center gap-2 text-sm">
                    {isCompleted ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-gray-400" />
                    )}
                    <span className={isCompleted ? 'text-green-400' : 'text-gray-300'}>
                      {field.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Message */}
        {completionStatus.isComplete && (
          <div className="text-center p-4 bg-green-500/20 rounded-lg">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm text-green-400">
              Great! Your profile is complete. You're ready to start your comedy journey!
            </p>
          </div>
        )}

        {/* Tips for incomplete profiles */}
        {!completionStatus.isComplete && (
          <div className="text-xs text-gray-400 bg-gray-700/50 p-3 rounded-lg">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="space-y-1">
              <li>• Add a professional headshot or comedy photo</li>
              <li>• Write a compelling bio that showcases your comedy style</li>
              <li>• Include at least one social media link</li>
              <li>• Add your location to help with local gig opportunities</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};