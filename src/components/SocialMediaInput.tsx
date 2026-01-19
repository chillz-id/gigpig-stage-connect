import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, AlertCircle } from 'lucide-react';
import {
  convertToSocialUrl,
  getPlatformDisplayName,
  getPlatformPlaceholder
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
      setIsValid(true);
      setError(undefined);
      setShowPreview(false);
      onChange('');
      return;
    }

    const result = convertToSocialUrl(platform, inputValue);
    setConvertedUrl(result.url);
    setIsValid(result.isValid);
    setError(result.error);
    setShowPreview(!!result.username);

    // Only update parent if the URL is valid
    if (result.isValid) {
      onChange(result.url);
    }
    // Note: onChange is intentionally excluded - it's a callback that shouldn't trigger re-processing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, platform]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const displayLabel = label || getPlatformDisplayName(platform);
  const placeholder = getPlatformPlaceholder(platform);

  return (
    <div className={className}>
      <Label htmlFor={id} className="mb-2 block">{displayLabel}</Label>
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
    </div>
  );
};