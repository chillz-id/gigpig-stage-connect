/**
 * EmailRecipientsInput - CC/BCC email input with chips
 *
 * Features:
 * - Primary email (read-only, from client)
 * - "+ Add CC" button with email chips
 * - "+ Add BCC" button with email chips
 * - Email validation per entry
 * - Remove individual emails
 */

import React, { useState, useCallback, useRef, KeyboardEvent } from 'react';
import { Plus, X, Mail, Copy, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmailRecipientsInputProps {
  primaryEmail: string;
  ccEmails: string[];
  bccEmails: string[];
  onCcChange: (emails: string[]) => void;
  onBccChange: (emails: string[]) => void;
  disabled?: boolean;
  className?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email.trim());
}

interface EmailChipsInputProps {
  emails: string[];
  onChange: (emails: string[]) => void;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  expanded: boolean;
  onExpand: () => void;
  hideLabel?: boolean;
}

function EmailChipsInput({
  emails,
  onChange,
  placeholder,
  label,
  icon,
  disabled = false,
  expanded,
  onExpand,
  hideLabel = false,
}: EmailChipsInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addEmail = useCallback((email: string) => {
    const trimmed = email.trim().toLowerCase();

    if (!trimmed) {
      return;
    }

    if (!validateEmail(trimmed)) {
      setError('Invalid email format');
      return;
    }

    if (emails.includes(trimmed)) {
      setError('Email already added');
      return;
    }

    onChange([...emails, trimmed]);
    setInputValue('');
    setError(null);
  }, [emails, onChange]);

  const removeEmail = useCallback((emailToRemove: string) => {
    onChange(emails.filter(email => email !== emailToRemove));
  }, [emails, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && emails.length > 0) {
      // Remove last email if input is empty
      removeEmail(emails[emails.length - 1]!);
    }
  }, [inputValue, emails, addEmail, removeEmail]);

  const handleBlur = useCallback(() => {
    if (inputValue.trim()) {
      addEmail(inputValue);
    }
  }, [inputValue, addEmail]);

  if (!expanded) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onExpand}
        disabled={disabled}
        className="text-muted-foreground hover:text-foreground gap-1 h-auto py-1 px-2"
      >
        <Plus className="h-3 w-3" />
        {label}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      {!hideLabel && (
        <Label className="text-sm flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </Label>
      )}

      <div
        className={cn(
          'flex flex-wrap gap-1.5 p-2 rounded-lg min-h-[42px] transition-all duration-200',
          'bg-gray-800/60 border-0 backdrop-blur-md shadow-lg shadow-black/20',
          'focus-within:bg-gray-700/60 focus-within:ring-1 focus-within:ring-gray-500/40',
          error && 'ring-1 ring-destructive',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {emails.map(email => (
          <Badge
            key={email}
            variant="secondary"
            className="gap-1 pr-1 py-1"
          >
            {email}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeEmail(email);
              }}
              disabled={disabled}
              className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        <Input
          ref={inputRef}
          type="email"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={emails.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[150px] border-0 p-0 h-6 bg-transparent shadow-none focus:ring-0 focus:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <p className="text-xs text-muted-foreground">
        Press Enter or comma to add multiple emails
      </p>
    </div>
  );
}

export function EmailRecipientsInput({
  primaryEmail,
  ccEmails,
  bccEmails,
  onCcChange,
  onBccChange,
  disabled = false,
  className,
}: EmailRecipientsInputProps) {
  const [showCc, setShowCc] = useState(ccEmails.length > 0);
  const [showBcc, setShowBcc] = useState(bccEmails.length > 0);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Primary Email (read-only) */}
      <div className="space-y-2">
        <Label className="text-sm flex items-center gap-1.5">
          <Mail className="h-4 w-4" />
          To
        </Label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm">
            {primaryEmail || (
              <span className="text-muted-foreground italic">
                No email - select a client first
              </span>
            )}
          </div>
        </div>
      </div>

      {/* CC/BCC Toggle Buttons (when not expanded) */}
      {(!showCc || !showBcc) && (
        <div className="flex gap-2">
          {!showCc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCc(true)}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground gap-1 h-auto py-1 px-2"
            >
              <Plus className="h-3 w-3" />
              Add CC
            </Button>
          )}
          {!showBcc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBcc(true)}
              disabled={disabled}
              className="text-muted-foreground hover:text-foreground gap-1 h-auto py-1 px-2"
            >
              <Plus className="h-3 w-3" />
              Add BCC
            </Button>
          )}
        </div>
      )}

      {/* CC Emails */}
      {showCc && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1.5 text-muted-foreground">
              <Copy className="h-3.5 w-3.5" />
              CC
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowCc(false);
                onCcChange([]);
              }}
              disabled={disabled}
              className="h-6 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <EmailChipsInput
            emails={ccEmails}
            onChange={onCcChange}
            placeholder="Enter CC email addresses..."
            label="CC"
            icon={<Copy className="h-3.5 w-3.5" />}
            disabled={disabled}
            expanded={showCc}
            onExpand={() => setShowCc(true)}
            hideLabel
          />
        </div>
      )}

      {/* BCC Emails */}
      {showBcc && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm flex items-center gap-1.5 text-muted-foreground">
              <EyeOff className="h-3.5 w-3.5" />
              BCC
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowBcc(false);
                onBccChange([]);
              }}
              disabled={disabled}
              className="h-6 px-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
          <EmailChipsInput
            emails={bccEmails}
            onChange={onBccChange}
            placeholder="Enter BCC email addresses..."
            label="BCC"
            icon={<EyeOff className="h-3.5 w-3.5" />}
            disabled={disabled}
            expanded={showBcc}
            onExpand={() => setShowBcc(true)}
            hideLabel
          />
        </div>
      )}
    </div>
  );
}

export default EmailRecipientsInput;
