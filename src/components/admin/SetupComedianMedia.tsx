import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Copy, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SetupComedianMedia = () => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const setupSQL = `-- Create comedian_media table
CREATE TABLE IF NOT EXISTS public.comedian_media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  title TEXT,
  description TEXT,
  file_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  external_url TEXT,
  external_type TEXT CHECK (external_type IN ('youtube', 'google_drive', 'vimeo') OR external_type IS NULL),
  external_id TEXT,
  thumbnail_url TEXT,
  duration INTEGER,
  width INTEGER,
  height INTEGER,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure either file_url or external_url is present, but not both
  CONSTRAINT valid_media_source CHECK (
    (file_url IS NOT NULL AND external_url IS NULL) OR 
    (file_url IS NULL AND external_url IS NOT NULL)
  ),
  
  -- If external_url is present, external_type must also be present
  CONSTRAINT valid_external_media CHECK (
    (external_url IS NULL) OR 
    (external_url IS NOT NULL AND external_type IS NOT NULL)
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_comedian_media_user_id ON public.comedian_media(user_id);
CREATE INDEX IF NOT EXISTS idx_comedian_media_media_type ON public.comedian_media(media_type);
CREATE INDEX IF NOT EXISTS idx_comedian_media_featured ON public.comedian_media(is_featured);
CREATE INDEX IF NOT EXISTS idx_comedian_media_display_order ON public.comedian_media(display_order);
CREATE INDEX IF NOT EXISTS idx_comedian_media_created_at ON public.comedian_media(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comedian_media_tags ON public.comedian_media USING GIN(tags);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_comedian_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_comedian_media_updated_at ON public.comedian_media;
CREATE TRIGGER tr_comedian_media_updated_at
  BEFORE UPDATE ON public.comedian_media
  FOR EACH ROW
  EXECUTE FUNCTION update_comedian_media_updated_at();

-- Enable RLS
ALTER TABLE public.comedian_media ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view media
DROP POLICY IF EXISTS "Anyone can view comedian media" ON public.comedian_media;
CREATE POLICY "Anyone can view comedian media"
  ON public.comedian_media FOR SELECT
  USING (true);

-- Users can insert their own media
DROP POLICY IF EXISTS "Users can insert own media" ON public.comedian_media;
CREATE POLICY "Users can insert own media"
  ON public.comedian_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own media
DROP POLICY IF EXISTS "Users can update own media" ON public.comedian_media;
CREATE POLICY "Users can update own media"
  ON public.comedian_media FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own media
DROP POLICY IF EXISTS "Users can delete own media" ON public.comedian_media;
CREATE POLICY "Users can delete own media"
  ON public.comedian_media FOR DELETE
  USING (auth.uid() = user_id);`;

  const handleCopy = () => {
    navigator.clipboard.writeText(setupSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "SQL Copied!",
      description: "Paste it in your Supabase SQL Editor",
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Setup Comedian Media Storage
        </CardTitle>
        <CardDescription>
          Follow these steps to enable media uploads for comedian profiles
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step 1: Create Database Table</h3>
          
          <Alert>
            <AlertDescription>
              Copy the SQL below and run it in your Supabase SQL Editor
            </AlertDescription>
          </Alert>

          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              <code>{setupSQL}</code>
            </pre>
            <Button
              onClick={handleCopy}
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
            >
              {copied ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy SQL'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step 2: Create Storage Bucket</h3>
          
          <ol className="space-y-2 list-decimal list-inside">
            <li>Go to your Supabase Dashboard → Storage</li>
            <li>Click "Create Bucket"</li>
            <li>Name it: <code className="bg-gray-100 px-2 py-1 rounded">comedian-media</code></li>
            <li>Make it <strong>Public</strong></li>
            <li>Set file size limit to <strong>50MB</strong></li>
            <li>Allow MIME types: <code className="bg-gray-100 px-2 py-1 rounded">image/*,video/*</code></li>
          </ol>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Step 3: Verify Setup</h3>
          
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Once completed, comedians will be able to upload photos and videos to their profiles!
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex gap-4 pt-4">
          <Button className="professional-button" asChild>
            <a href="https://app.supabase.com" target="_blank" rel="noopener noreferrer">
              Open Supabase Dashboard
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupComedianMedia;