import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle, ExternalLink } from 'lucide-react';
import { 
  convertToSocialUrl, 
  getPlatformDisplayName, 
  getPlatformPlaceholder,
  formatUsernameDisplay 
} from '@/utils/socialLinks';

interface SocialMediaInputProps {
  platform: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  id?: string;
  className?: string;
}

export const SocialMediaInput: React.FC<SocialMediaInputProps> = ({
  platform,
  value,
  onChange,
  label,
  id,
  className = ''
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [convertedUrl, setConvertedUrl] = useState('');
  const [username, setUsername] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [showPreview, setShowPreview] = useState(false);

  // Update local state when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Process input and convert to URL
  useEffect(() => {
    if (!inputValue.trim()) {
      setConvertedUrl('');
      setUsername('');
      setIsValid(true);
      setError(undefined);
      setShowPreview(false);
      onChange('');
      return;
    }

    const result = convertToSocialUrl(platform, inputValue);
    setConvertedUrl(result.url);
    setUsername(result.username);
    setIsValid(result.isValid);
    setError(result.error);
    setShowPreview(!!result.username);

    // Only update parent if the URL is valid
    if (result.isValid) {
      onChange(result.url);
    }
  }, [inputValue, platform, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const displayLabel = label || `${getPlatformDisplayName(platform)} URL`;
  const placeholder = getPlatformPlaceholder(platform);

  return (
    <div className={className}>
      <Label htmlFor={id}>{displayLabel}</Label>
      <div className="relative">
        <Input
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className={`pr-10 ${!isValid ? 'border-red-500 focus:border-red-500' : ''} ${
            isValid && showPreview ? 'border-green-500 focus:border-green-500' : ''
          }`}
        />
        
        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {inputValue && (
            <>
              {isValid && showPreview && (
                <Check className="w-4 h-4 text-green-500" />
              )}
              {!isValid && (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Preview */}
      {showPreview && isValid && username && (
        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {getPlatformDisplayName(platform)}: {formatUsernameDisplay(username, platform)}
              </p>
              <p className="text-xs text-green-600 dark:text-green-300 break-all">
                {convertedUrl}
              </p>
            </div>
            {convertedUrl && (
              <a
                href={convertedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200"
                title="Open profile"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Help Text */}
      {!inputValue && (
        <p className="text-xs text-gray-500 mt-1">
          You can enter @username, username, or a full URL
        </p>
      )}
    </div>
  );
};