import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BookComedianForm } from '@/components/BookComedianForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BookComedianPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prefilledData, setPrefilledData] = useState<any>(null);

  useEffect(() => {
    if (location.state) {
      setPrefilledData(location.state);
    }
  }, [location.state]);

  useEffect(() => {
    // Redirect to signin if not authenticated
    if (!user) {
      navigate('/signin', { state: { from: '/book-comedian' } });
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#131b2b]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <h1 className="text-3xl font-bold text-white mb-2">Book a Comedian</h1>
            <p className="text-gray-300">
              Submit a booking request to find the perfect comedian for your event
            </p>
          </div>

          {/* Prefilled Info Card */}
          {prefilledData && (
            <Card className="bg-blue-900/20 border-blue-700 mb-6">
              <CardHeader>
                <CardTitle className="text-lg text-blue-300">
                  Booking Request Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prefilledData.comedianName && (
                  <p className="text-blue-200">
                    Requesting: <strong>{prefilledData.comedianName}</strong>
                  </p>
                )}
                {prefilledData.preselectedDate && (
                  <p className="text-blue-200 mt-1">
                    Selected Date: <strong>{new Date(prefilledData.preselectedDate).toLocaleDateString()}</strong>
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Booking Form */}
          <BookComedianForm 
            prefilledComedianId={prefilledData?.comedianId}
            prefilledComedianName={prefilledData?.comedianName}
            prefilledDate={prefilledData?.preselectedDate}
          />
        </div>
      </div>
    </div>
  );
};

export default BookComedianPage;