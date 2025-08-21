import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, Clock, Globe } from 'lucide-react';

export const AnalyticsPrivacyNotice: React.FC = () => {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Privacy & Analytics Notice
        </CardTitle>
        <CardDescription>
          How we protect your data while providing valuable insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Eye className="h-4 w-4" />
              What We Track
            </h4>
            <ul className="text-sm space-y-1 ml-6">
              <li>• Profile page views and unique visitors</li>
              <li>• Time spent on profile pages</li>
              <li>• Interaction with media and links</li>
              <li>• Geographic location (country/region)</li>
              <li>• Device and browser information</li>
              <li>• Traffic sources and referrers</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Privacy Protection
            </h4>
            <ul className="text-sm space-y-1 ml-6">
              <li>• No personally identifiable information collected</li>
              <li>• Anonymous visitor tracking by default</li>
              <li>• IP addresses are anonymized</li>
              <li>• No third-party tracking or cookies</li>
              <li>• Data never sold or shared</li>
              <li>• Compliant with GDPR & privacy laws</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Retention
            </h4>
            <ul className="text-sm space-y-1 ml-6">
              <li>• Raw analytics data: 90 days</li>
              <li>• Aggregated daily stats: 1 year</li>
              <li>• Automatic cleanup of old data</li>
              <li>• Export your data anytime</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Your Rights
            </h4>
            <ul className="text-sm space-y-1 ml-6">
              <li>• Access your analytics data</li>
              <li>• Export data in CSV or JSON</li>
              <li>• Request data deletion</li>
              <li>• Opt-out of tracking</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> Profile owners only see analytics for their own profiles. 
            We don't track logged-in users viewing other profiles, and profile owners cannot 
            see who specifically viewed their profile - only anonymous, aggregated data.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};