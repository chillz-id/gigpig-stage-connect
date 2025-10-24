import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganizationProfiles } from "@/hooks/useOrganizationProfiles";
import { useState } from "react";
import { toast } from "sonner";

export function PostizSSO() {
  const { session, user, profile } = useAuth();
  const { data: organizations } = useOrganizationProfiles();
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenPostiz = async () => {
    if (!session || !user) {
      toast.error("Please log in first");
      return;
    }

    setIsLoading(true);

    try {
      // Determine if user is acting as organization or individual
      const userOrgs = organizations && Object.values(organizations).length > 0
        ? Object.values(organizations)
        : [];

      // Use first organization if available, otherwise use personal profile
      const useOrganization = userOrgs.length > 0;
      const orgProfile = useOrganization ? userOrgs[0] : null;

      // Build profile data to pass to Postiz
      const profileData = {
        user_id: user.id,
        name: useOrganization
          ? (orgProfile?.display_name || orgProfile?.organization_name || profile?.name || '')
          : (profile?.name || user.email?.split('@')[0] || ''),
        email: useOrganization
          ? (orgProfile?.contact_email || user.email || '')
          : (profile?.email || user.email || ''),
        picture: useOrganization
          ? (orgProfile?.logo_url || null)
          : (profile?.avatar_url || null),
        type: useOrganization ? 'organization' : 'personal'
      };

      // Build Postiz SSO URL with session token
      // Postiz backend will validate this token with Supabase
      const postizUrl = new URL("https://social.gigpigs.app/auth/gigpigs-sso");
      postizUrl.searchParams.set("token", session.access_token);
      postizUrl.searchParams.set("profile", btoa(JSON.stringify(profileData)));

      // Open Postiz in a new tab
      const postizWindow = window.open(postizUrl.toString(), "_blank");

      if (!postizWindow) {
        toast.error("Please allow popups for this site");
        return;
      }

      toast.success("Opening Social Media Manager...");
    } catch (error) {
      console.error("Error opening Postiz:", error);
      toast.error("Failed to open Social Media Manager");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleOpenPostiz}
      disabled={isLoading}
      className="gap-2"
      size="lg"
    >
      <ExternalLink className="h-5 w-5" />
      {isLoading ? "Opening..." : "Open Social Media Manager"}
    </Button>
  );
}
