import { useState, useRef, useCallback, KeyboardEvent } from 'react';
import { X, Plus, Tag, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useUserTags } from '@/hooks/useMediaTags';
import { cn } from '@/lib/utils';

interface MediaTagInputProps {
  /** Current tags on the media file */
  value: string[];
  /** Called when tags change */
  onChange: (tags: string[]) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disable editing */
  disabled?: boolean;
  /** Show inline (badges + input on same line) or stacked */
  variant?: 'inline' | 'stacked';
  /** Max tags allowed (0 = unlimited) */
  maxTags?: number;
  /** Class name for container */
  className?: string;
}

export function MediaTagInput({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  disabled = false,
  variant = 'inline',
  maxTags = 0,
  className,
}: MediaTagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { tags: suggestions, isLoading } = useUserTags(inputValue);

  // Filter out already-selected tags from suggestions
  const filteredSuggestions = suggestions.filter(
    s => !value.includes(s.tag.toLowerCase())
  );

  const addTag = useCallback((tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (!normalizedTag) return;
    if (value.includes(normalizedTag)) return;
    if (maxTags > 0 && value.length >= maxTags) return;

    onChange([...value, normalizedTag]);
    setInputValue('');
    setIsPopoverOpen(false);
  }, [value, onChange, maxTags]);

  const removeTag = useCallback((tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  }, [value, onChange]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      const lastTag = value[value.length - 1];
      if (lastTag) {
        removeTag(lastTag);
      }
    } else if (e.key === 'Escape') {
      setIsPopoverOpen(false);
      inputRef.current?.blur();
    }
  }, [inputValue, value, addTag, removeTag]);

  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    if (newValue.length > 0) {
      setIsPopoverOpen(true);
    }
  };

  const canAddMore = maxTags === 0 || value.length < maxTags;

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {/* Tags display */}
      {value.length > 0 && (
        <div className={cn(
          'flex flex-wrap gap-1',
          variant === 'inline' && 'mb-0'
        )}>
          {value.map(tag => (
            <Badge
              key={tag}
              variant="secondary"
              className="gap-1 pr-1 text-xs"
            >
              <Tag className="h-3 w-3" />
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      {/* Tag input with autocomplete */}
      {!disabled && canAddMore && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <div className="relative">
              <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={e => handleInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => inputValue && setIsPopoverOpen(true)}
                placeholder={placeholder}
                className="pl-9 pr-9 h-9"
                disabled={disabled}
              />
              {inputValue && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => addTag(inputValue)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </PopoverTrigger>
          <PopoverContent
            className="w-[var(--radix-popover-trigger-width)] p-0"
            align="start"
            onOpenAutoFocus={e => e.preventDefault()}
          >
            <Command>
              <CommandList>
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredSuggestions.length === 0 ? (
                  <CommandEmpty>
                    {inputValue ? (
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent rounded"
                        onClick={() => addTag(inputValue)}
                      >
                        <Plus className="h-4 w-4" />
                        Create "{inputValue}"
                      </button>
                    ) : (
                      'Type to search or create tags'
                    )}
                  </CommandEmpty>
                ) : (
                  <CommandGroup heading="Your tags">
                    {filteredSuggestions.map(suggestion => (
                      <CommandItem
                        key={suggestion.tag}
                        value={suggestion.tag}
                        onSelect={() => addTag(suggestion.tag)}
                        className="flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <Tag className="h-3 w-3" />
                          {suggestion.tag}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {suggestion.usage_count} {suggestion.usage_count === 1 ? 'use' : 'uses'}
                        </span>
                      </CommandItem>
                    ))}
                    {inputValue && !filteredSuggestions.some(s => s.tag === inputValue.toLowerCase()) && (
                      <CommandItem
                        value={`create-${inputValue}`}
                        onSelect={() => addTag(inputValue)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create "{inputValue}"
                      </CommandItem>
                    )}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

/**
 * Simplified tag display component (read-only)
 */
export function MediaTagDisplay({
  tags,
  maxDisplay = 3,
  className,
}: {
  tags: string[];
  maxDisplay?: number;
  className?: string;
}) {
  if (!tags || tags.length === 0) return null;

  const displayTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - maxDisplay;

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {displayTags.map(tag => (
        <Badge key={tag} variant="secondary" className="text-xs py-0 px-1.5">
          {tag}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="secondary" className="text-xs py-0 px-1.5">
          +{remainingCount}
        </Badge>
      )}
    </div>
  );
}

/**
 * Tag filter dropdown for filtering media by tags
 */
export function MediaTagFilter({
  selectedTags,
  onTagToggle,
  onClear,
  className,
}: {
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClear: () => void;
  className?: string;
}) {
  const [searchValue, setSearchValue] = useState('');
  const { tags, isLoading } = useUserTags(searchValue);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={cn('gap-2', className)}
        >
          <Tag className="h-4 w-4" />
          Tags
          {selectedTags.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
              {selectedTags.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search tags..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : tags.length === 0 ? (
              <CommandEmpty>No tags found</CommandEmpty>
            ) : (
              <CommandGroup>
                {tags.map(tag => (
                  <CommandItem
                    key={tag.tag}
                    value={tag.tag}
                    onSelect={() => onTagToggle(tag.tag)}
                    className="flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <div
                        className={cn(
                          'h-4 w-4 rounded border flex items-center justify-center',
                          selectedTags.includes(tag.tag)
                            ? 'bg-primary border-primary'
                            : 'border-input'
                        )}
                      >
                        {selectedTags.includes(tag.tag) && (
                          <span className="text-primary-foreground text-xs">✓</span>
                        )}
                      </div>
                      {tag.tag}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {tag.usage_count}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          {selectedTags.length > 0 && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={onClear}
              >
                Clear filters
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
