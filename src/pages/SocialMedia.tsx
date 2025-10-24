/**
 * SocialMedia Page
 * Social media scheduling interface using Postiz integration
 */

import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PostizSSO } from "@/components/postiz/PostizSSO";
import { Share2, Calendar, Image, BarChart3, Sparkles } from "lucide-react";

export default function SocialMedia() {
  return (
    <>
      <Helmet>
        <title>Social Media Manager | GigPigs</title>
        <meta
          name="description"
          content="Schedule and manage your social media posts across all platforms"
        />
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Share2 className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Social Media Manager</h1>
            <p className="text-muted-foreground">
              Schedule and manage your social media posts across all platforms
            </p>
          </div>
        </div>

        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              GigPigs Social Media Platform
            </CardTitle>
            <CardDescription>
              Powered by Postiz - Your all-in-one social media management tool
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Schedule Posts</h3>
                  <p className="text-sm text-muted-foreground">
                    Plan and schedule your content across Facebook, Instagram, Twitter, LinkedIn, and more
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Image className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Media Library</h3>
                  <p className="text-sm text-muted-foreground">
                    Access your GigPigs media library directly from the social media manager
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Track engagement, reach, and performance across all your social media accounts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                <Share2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">Multi-Platform</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage Facebook Pages, Instagram Business, Twitter, LinkedIn, and more from one place
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-center text-muted-foreground max-w-2xl">
                  Click below to launch the Social Media Manager in a new tab. You'll be automatically logged in with your GigPigs account.
                </p>
                <PostizSSO />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>Connect your social media accounts to begin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Open Social Media Manager" above to launch the platform</li>
              <li>Go to Settings → Channels to connect your social media accounts</li>
              <li>Authorize each platform (Facebook, Instagram, Twitter, etc.)</li>
              <li>Start creating and scheduling your posts!</li>
            </ol>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-900 dark:text-blue-100">
                <strong>Tip:</strong> Your GigPigs media library is automatically available in the Social Media Manager under the "Shared Media" section.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
