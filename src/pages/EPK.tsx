/**
 * EPK (Electronic Press Kit) Route
 *
 * Shows the comedian's EPK content including:
 * - Press Reviews
 * - Career Highlights
 * - Vouches
 * - Upcoming Shows
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ComedianAccomplishments from '@/components/comedian-profile/ComedianAccomplishments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const EPK = () => {
  const { user, hasRole } = useAuth();

  // Redirect if not a comedian
  if (!user || !(hasRole('comedian') || hasRole('comedian_lite'))) {
    return <Navigate to="/profile" replace />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="professional-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6" />
            My Electronic Press Kit (EPK)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage your press reviews, career highlights, and accomplishments
          </p>
        </CardHeader>
      </Card>

      <ComedianAccomplishments
        comedianId={user.id}
        isOwnProfile={true}
      />
    </div>
  );
};

export default EPK;
