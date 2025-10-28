import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

interface FoundProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  gst_registered: boolean;
}

interface DealParticipantSelectorProps {
  onAddParticipant: (participant: {
    participant_id?: string;
    participant_email: string;
    participant_name: string;
    gst_registered: boolean;
    invitation_pending: boolean;
  }) => void;
  existingParticipants: string[]; // Email addresses already in deal
}

export function DealParticipantSelector({
  onAddParticipant,
  existingParticipants,
}: DealParticipantSelectorProps) {
  const [email, setEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundProfile, setFoundProfile] = useState<FoundProfile | null>(null);
  const [noProfileFound, setNoProfileFound] = useState(false);

  const handleLookup = async () => {
    if (!email || !email.includes('@')) {
      return;
    }

    setIsSearching(true);
    setFoundProfile(null);
    setNoProfileFound(false);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, avatar_url, gst_registered')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setFoundProfile(data as FoundProfile);
      } else {
        setNoProfileFound(true);
      }
    } catch (error) {
      console.error('Profile lookup error:', error);
      setNoProfileFound(true);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFoundProfile = () => {
    if (!foundProfile) return;

    onAddParticipant({
      participant_id: foundProfile.id,
      participant_email: foundProfile.email,
      participant_name: foundProfile.name,
      gst_registered: foundProfile.gst_registered,
      invitation_pending: false,
    });

    // Reset
    setEmail('');
    setFoundProfile(null);
    setNoProfileFound(false);
  };

  const handleInvitePartner = () => {
    onAddParticipant({
      participant_email: email.toLowerCase().trim(),
      participant_name: email, // Will show email until they register
      gst_registered: false,
      invitation_pending: true,
    });

    // Reset
    setEmail('');
    setFoundProfile(null);
    setNoProfileFound(false);
  };

  const isExistingParticipant = foundProfile && existingParticipants.includes(foundProfile.email);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="partner-email">Partner Email Address</Label>
        <div className="flex gap-2">
          <Input
            id="partner-email"
            type="email"
            placeholder="partner@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleLookup();
              }
            }}
          />
          <Button
            onClick={handleLookup}
            disabled={!email || isSearching}
            variant="secondary"
          >
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Looking up...
              </>
            ) : (
              'Look Up'
            )}
          </Button>
        </div>
      </div>

      {/* Profile Found */}
      {foundProfile && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={foundProfile.avatar_url} />
                  <AvatarFallback>{foundProfile.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{foundProfile.name}</p>
                  <p className="text-sm text-muted-foreground">{foundProfile.email}</p>
                </div>
                {foundProfile.gst_registered && (
                  <Badge variant="secondary" className="ml-2">
                    GST Registered
                  </Badge>
                )}
              </div>
              <Button
                onClick={handleAddFoundProfile}
                disabled={isExistingParticipant}
                size="sm"
              >
                {isExistingParticipant ? 'Already Added' : 'Add to Deal'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* No Profile Found */}
      {noProfileFound && (
        <Alert className="border-amber-200 bg-amber-50">
          <XCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">No profile found for {email}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You can invite them to join. They'll be added to the deal once they create their profile.
                </p>
              </div>
              <Button
                onClick={handleInvitePartner}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                <Mail className="mr-2 h-4 w-4" />
                Invite Partner
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
