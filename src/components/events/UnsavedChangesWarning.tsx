import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UnsavedChangesWarningProps {
  hasUnsavedChanges: boolean;
  onSave?: () => Promise<void>;
  onDiscard?: () => void;
  message?: string;
}

export const UnsavedChangesWarning: React.FC<UnsavedChangesWarningProps> = ({
  hasUnsavedChanges,
  onSave,
  onDiscard,
  message = "You have unsaved changes. Are you sure you want to leave this page?"
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  // Handle browser back button and page refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, message]);

  // Handle navigation attempts
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const unblock = (tx: any) => {
      // Check if user is trying to navigate away
      if (tx.location.pathname !== location.pathname) {
        setPendingNavigation(tx.location.pathname);
        setShowDialog(true);
        return false; // Block navigation
      }
      return true; // Allow navigation
    };

    // Note: React Router v6 doesn't have built-in blocking,
    // so we'll use a workaround with navigation events
    const handleNavigation = (e: PopStateEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        setShowDialog(true);
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, [hasUnsavedChanges, location.pathname]);

  const handleSaveAndContinue = async () => {
    if (!onSave) {
      handleDiscard();
      return;
    }

    setIsSaving(true);
    try {
      await onSave();
      toast({
        title: "Changes saved",
        description: "Your changes have been saved successfully.",
      });
      
      // Continue with navigation
      if (pendingNavigation) {
        navigate(pendingNavigation);
      }
      setShowDialog(false);
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    if (onDiscard) {
      onDiscard();
    }
    
    // Continue with navigation
    if (pendingNavigation) {
      navigate(pendingNavigation);
    }
    setShowDialog(false);
  };

  const handleCancel = () => {
    setPendingNavigation(null);
    setShowDialog(false);
  };

  return (
    <>
      {/* Inline warning banner */}
      {hasUnsavedChanges && (
        <div className="fixed top-16 left-0 right-0 z-40 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">You have unsaved changes</span>
            </div>
            {onSave && (
              <Button
                size="sm"
                className="professional-button"
                onClick={onSave}
                className="h-7 text-xs"
              >
                <Save className="h-3 w-3 mr-1" />
                Save Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Navigation warning dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Unsaved Changes
            </AlertDialogTitle>
            <AlertDialogDescription>
              {message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDiscard}
            >
              Discard Changes
            </AlertDialogAction>
            {onSave && (
              <AlertDialogAction
                onClick={handleSaveAndContinue}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Hook to track form changes
export const useUnsavedChanges = (
  isDirty: boolean,
  onSave?: () => Promise<void>
) => {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setHasUnsavedChanges(isDirty);
  }, [isDirty]);

  const markAsSaved = () => {
    setHasUnsavedChanges(false);
  };

  return {
    hasUnsavedChanges,
    markAsSaved,
    UnsavedChangesWarning: (
      <UnsavedChangesWarning
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
        onDiscard={markAsSaved}
      />
    )
  };
};