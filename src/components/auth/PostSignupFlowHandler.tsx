import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrganizationSignupWizard } from './OrganizationSignupWizard';
import { ManagerSignupWizard } from './ManagerSignupWizard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic, Briefcase, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type FlowType = 'role-selection' | 'organization' | 'manager' | 'complete';

interface PostSignupFlowHandlerProps {
  onComplete?: () => void;
}

const ROLE_OPTIONS = [
  { value: 'comedian', label: 'Comedian', icon: Mic, description: 'Perform at shows and events' },
  { value: 'manager', label: 'Manager', icon: Briefcase, description: 'Manage comedians or organizations' },
  { value: 'organization', label: 'Organization', icon: Building2, description: 'Run a venue or production company' },
] as const;

/**
 * Orchestrates post-signup flow based on user roles
 * - If user has only "member" role (Google OAuth): show role selection
 * - If user selected "organization" role: show OrganizationSignupWizard
 * - If user selected "manager" role: show ManagerSignupWizard
 * - User can skip any wizard and complete later
 */
export const PostSignupFlowHandler: React.FC<PostSignupFlowHandlerProps> = ({ onComplete }) => {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentFlow, setCurrentFlow] = useState<FlowType | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const navigateByRole = useCallback((roleNames: string[]) => {
    if (roleNames.includes('comedian') || roleNames.includes('comedian_lite')) {
      navigate('/gigs');
    } else if (roleNames.includes('admin')) {
      navigate('/admin');
    } else {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const roleNames: string[] = roles.map(r => r.role);
    const hasOnlyMember = roleNames.length === 0 ||
      (roleNames.length === 1 && roleNames[0] === 'member');

    if (hasOnlyMember) {
      // Google OAuth user with no role selection — show role picker
      setCurrentFlow('role-selection');
    } else if (roleNames.includes('organization') || roleNames.includes('venue_manager')) {
      setCurrentFlow('organization');
    } else if (roleNames.includes('manager')) {
      setCurrentFlow('manager');
    } else {
      // Has specific roles, no wizard needed — navigate directly
      setCurrentFlow('complete');
      onComplete?.();
      navigateByRole(roleNames);
    }
  }, [user, roles, onComplete, navigateByRole]);

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev =>
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleRoleSelectionComplete = async () => {
    if (!user || selectedRoles.length === 0) {
      toast({
        title: 'Select a role',
        description: 'Please select at least one role to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingRoles(true);
    try {
      // Insert selected roles via RPC (bypasses RLS which restricts inserts to admins)
      const { error } = await supabase.rpc('set_own_roles', {
        p_roles: selectedRoles,
      });

      if (error) {
        throw error;
      }

      // Determine next flow based on selected roles
      if (selectedRoles.includes('organization')) {
        setCurrentFlow('organization');
      } else if (selectedRoles.includes('manager')) {
        setCurrentFlow('manager');
      } else {
        // Comedian, promoter, etc. — complete
        setCurrentFlow('complete');
        onComplete?.();
        navigateByRole(selectedRoles);
      }
    } catch (error) {
      console.error('Error saving roles:', error);
      toast({
        title: 'Error saving roles',
        description: 'Failed to save your roles. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingRoles(false);
    }
  };

  const handleRoleSelectionSkip = () => {
    // Skip role selection, go to home
    setCurrentFlow('complete');
    onComplete?.();
    navigate('/');
  };

  const handleOrganizationComplete = () => {
    const roleNames: string[] = [
      ...roles.map(r => r.role),
      ...selectedRoles,
    ];
    if (roleNames.includes('manager')) {
      setCurrentFlow('manager');
    } else {
      handleAllComplete();
    }
  };

  const handleOrganizationSkip = () => {
    const roleNames: string[] = [
      ...roles.map(r => r.role),
      ...selectedRoles,
    ];
    if (roleNames.includes('manager')) {
      setCurrentFlow('manager');
    } else {
      handleAllComplete();
    }
  };

  const handleManagerComplete = () => {
    handleAllComplete();
  };

  const handleManagerSkip = () => {
    handleAllComplete();
  };

  const handleAllComplete = () => {
    setCurrentFlow('complete');
    onComplete?.();
    const roleNames: string[] = [
      ...roles.map(r => r.role),
      ...selectedRoles,
    ];
    navigateByRole(roleNames);
  };

  if (!user || currentFlow === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (currentFlow === 'complete') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {currentFlow === 'role-selection' && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Stand Up Sydney!</CardTitle>
            <CardDescription className="text-base">
              Tell us what you do so we can set up your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground">I am a... (select all that apply)</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                {ROLE_OPTIONS.map(({ value, label, icon: Icon, description }) => {
                  const isSelected = selectedRoles.includes(value);
                  return (
                    <div
                      key={value}
                      className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleRoleToggle(value)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && handleRoleToggle(value)}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleRoleToggle(value)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-medium">{label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={handleRoleSelectionSkip}
                disabled={isSavingRoles}
              >
                Skip for now
              </Button>
              <Button
                onClick={handleRoleSelectionComplete}
                disabled={selectedRoles.length === 0 || isSavingRoles}
              >
                {isSavingRoles ? 'Saving...' : 'Continue'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentFlow === 'organization' && (
        <OrganizationSignupWizard
          userId={user.id}
          onComplete={handleOrganizationComplete}
          onSkip={handleOrganizationSkip}
        />
      )}

      {currentFlow === 'manager' && (
        <ManagerSignupWizard
          userId={user.id}
          onComplete={handleManagerComplete}
          onSkip={handleManagerSkip}
        />
      )}
    </div>
  );
};
