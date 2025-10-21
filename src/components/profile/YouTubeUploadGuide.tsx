import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { InfoIcon, CheckCircle2, Upload, Link2, Eye, Clock } from 'lucide-react';

interface YouTubeUploadGuideProps {
  variant?: 'button' | 'icon';
}

/**
 * YouTube Upload Guide Component
 * Provides step-by-step instructions for uploading unlisted YouTube videos
 */
export const YouTubeUploadGuide: React.FC<YouTubeUploadGuideProps> = ({
  variant = 'icon'
}) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        {variant === 'button' ? (
          <Button variant="outline" size="sm">
            <InfoIcon className="w-4 h-4 mr-2" />
            How to Upload
          </Button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="YouTube upload instructions"
          >
            <InfoIcon className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            How to Upload Your Comedy Videos to YouTube
          </DialogTitle>
          <DialogDescription>
            Follow these steps to upload your performance clips and share them on your profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Step 1: Upload to YouTube */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              1
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Upload Your Video to YouTube
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Go to <a href="https://studio.youtube.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">YouTube Studio</a> and click the "Create" button, then select "Upload video"
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-sm">
                <p className="font-medium mb-1">💡 Video Tips:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Keep clips between 2-5 minutes for best engagement</li>
                  <li>• Use good lighting and clear audio</li>
                  <li>• Showcase your best material and performance style</li>
                  <li>• Film from a stable position (tripod recommended)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2: Set to Unlisted */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              2
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Set Privacy to "Unlisted"
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                In the video details, find the "Visibility" section and select <strong>"Unlisted"</strong>
              </p>
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 p-3 rounded-md">
                <p className="font-medium text-sm text-blue-900 dark:text-blue-100 mb-2">
                  Why Unlisted?
                </p>
                <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                  <li>✓ Only people with the link can view it</li>
                  <li>✓ Won't appear in public YouTube search results</li>
                  <li>✓ Promoters can watch it on your profile</li>
                  <li>✓ You control who sees your material</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Step 3: Add Title and Description */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              3
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Add Title and Description
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Give your video a descriptive title and add details about the performance
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
                <div>
                  <p className="font-medium">Example Title:</p>
                  <p className="text-muted-foreground">"5 Min Set - Comedy Store Sydney - Jan 2025"</p>
                </div>
                <div>
                  <p className="font-medium">Example Description:</p>
                  <p className="text-muted-foreground">Include venue name, date, set length, and any notable details about the show</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Copy Share Link */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              4
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <Link2 className="w-4 h-4" />
                Copy the Video URL
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                After uploading, click the "Share" button and copy the video URL
              </p>
              <div className="bg-muted/50 p-3 rounded-md text-sm space-y-2">
                <p className="font-medium">The URL will look like:</p>
                <code className="block bg-background px-2 py-1 rounded border text-xs">
                  https://www.youtube.com/watch?v=dQw4w9WgXcQ
                </code>
                <p className="text-muted-foreground text-xs mt-2">
                  Or the shorter version: <code className="bg-background px-1 py-0.5 rounded">https://youtu.be/dQw4w9WgXcQ</code>
                </p>
              </div>
            </div>
          </div>

          {/* Step 5: Paste URL Here */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
              5
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Paste the URL in the Field Above
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Copy the YouTube URL and paste it into the "YouTube URL" field on this page
              </p>
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-3 rounded-md">
                <p className="font-medium text-sm text-green-900 dark:text-green-100 mb-2">
                  ✓ You're all set!
                </p>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Your video will appear on your profile with a play button. Promoters can watch it directly on your page.
                </p>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="border-t pt-4 mt-6">
            <h4 className="font-semibold mb-3">📝 Pro Tips</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Upload multiple clips to showcase different styles (storytelling, crowd work, one-liners)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Mark your best performance as "Featured" to highlight it at the top</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Keep your portfolio updated with recent performances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can always edit or remove videos later from your profile</span>
              </li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
