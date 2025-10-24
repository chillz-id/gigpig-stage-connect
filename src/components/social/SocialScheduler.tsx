/**
 * SocialScheduler Component
 * Main interface for scheduling social media posts via Postiz
 */

import { useState } from 'react';
import { Calendar, Clock, Image, Hash, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSocialChannels, useSocialPosts, useSocialTemplates } from '@/hooks/useSocialMedia';
import { ConnectedChannels } from './ConnectedChannels';
import { ScheduledPosts } from './ScheduledPosts';
import { SocialAnalytics } from './SocialAnalytics';

export function SocialScheduler() {
  const { channels, isLoading: channelsLoading } = useSocialChannels();
  const { schedulePost, isScheduling } = useSocialPosts();
  const { templates, applyTemplate } = useSocialTemplates();

  const [selectedChannel, setSelectedChannel] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(templateId);

    // For demo purposes, use placeholder variables
    // In production, this would come from event data or user input
    const variables = {
      event_name: 'Comedy Night at The Factory',
      event_date: 'Friday, Oct 25th 8:00 PM',
      venue_name: 'The Factory Theatre',
      ticket_link: 'https://tickets.example.com',
      lineup_preview: 'Featuring 5 amazing comedians!',
      lineup_list: '• John Doe\n• Jane Smith\n• Mike Johnson',
    };

    const filledContent = applyTemplate(template.content_template, variables);
    setContent(filledContent);

    if (template.default_hashtags) {
      setHashtags(template.default_hashtags.join(' '));
    }
  };

  const handleSchedule = () => {
    if (!selectedChannel || !content || !scheduledDate || !scheduledTime) {
      return;
    }

    const scheduledAt = `${scheduledDate}T${scheduledTime}:00`;
    const hashtagsArray = hashtags
      .split(/\s+/)
      .filter(h => h.startsWith('#'))
      .map(h => h.slice(1));

    schedulePost({
      channelId: selectedChannel,
      content,
      hashtags: hashtagsArray.length > 0 ? hashtagsArray : undefined,
      scheduledAt,
    });

    // Reset form
    setContent('');
    setHashtags('');
    setScheduledDate('');
    setScheduledTime('');
    setSelectedTemplate('');
  };

  const isFormValid = selectedChannel && content && scheduledDate && scheduledTime;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Social Media Scheduler</h1>
        <p className="text-muted-foreground mt-2">
          Schedule posts across all your connected social media platforms
        </p>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="schedule">Schedule Post</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Posts</TabsTrigger>
          <TabsTrigger value="channels">Channels</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Schedule Post Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Scheduling Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create Post</CardTitle>
                <CardDescription>
                  Compose and schedule your social media post
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channel Selection */}
                <div className="space-y-2">
                  <Label htmlFor="channel">Platform</Label>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger id="channel">
                      <SelectValue placeholder="Select a platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {channels.map(channel => (
                        <SelectItem key={channel.id} value={channel.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="capitalize">
                              {channel.platform}
                            </Badge>
                            <span>{channel.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Template Selection */}
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="template">Template (Optional)</Label>
                    <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                      <SelectTrigger id="template">
                        <SelectValue placeholder="Choose a template" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    {content.length} characters
                  </p>
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                  <Label htmlFor="hashtags">
                    <Hash className="inline h-4 w-4 mr-1" />
                    Hashtags
                  </Label>
                  <Input
                    id="hashtags"
                    placeholder="#comedy #standup #sydney"
                    value={hashtags}
                    onChange={(e) => setHashtags(e.target.value)}
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Time
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>

                {/* Media (Coming Soon) */}
                <div className="space-y-2">
                  <Label>
                    <Image className="inline h-4 w-4 mr-1" />
                    Media
                  </Label>
                  <Button variant="outline" className="w-full" disabled>
                    Add Images/Videos (Coming Soon)
                  </Button>
                </div>

                {/* Schedule Button */}
                <Button
                  onClick={handleSchedule}
                  disabled={!isFormValid || isScheduling}
                  className="w-full"
                >
                  <Send className="mr-2 h-4 w-4" />
                  {isScheduling ? 'Scheduling...' : 'Schedule Post'}
                </Button>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  How your post will appear
                </CardDescription>
              </CardHeader>
              <CardContent>
                {content ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border p-4 bg-muted/50">
                      <p className="whitespace-pre-wrap">{content}</p>
                      {hashtags && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {hashtags.split(/\s+/).filter(Boolean).map((tag, i) => (
                            <Badge key={i} variant="secondary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {scheduledDate && scheduledTime && (
                      <div className="text-sm text-muted-foreground">
                        Scheduled for: {new Date(`${scheduledDate}T${scheduledTime}`).toLocaleString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Your post preview will appear here</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Scheduled Posts Tab */}
        <TabsContent value="scheduled">
          <ScheduledPosts />
        </TabsContent>

        {/* Channels Tab */}
        <TabsContent value="channels">
          <ConnectedChannels />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <SocialAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
