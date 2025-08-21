import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Filter } from 'lucide-react';

export type TemplateCategory = 
  | 'all'
  | 'open-mic'
  | 'showcase'
  | 'pro-show'
  | 'comedy-night'
  | 'workshop'
  | 'competition'
  | 'other';

interface TemplateCategoryFilterProps {
  selectedCategory: TemplateCategory;
  onCategoryChange: (category: TemplateCategory) => void;
  categoryCounts?: Record<TemplateCategory, number>;
}

const categoryLabels: Record<TemplateCategory, string> = {
  all: 'All Templates',
  'open-mic': 'Open Mic',
  showcase: 'Showcase',
  'pro-show': 'Professional Show',
  'comedy-night': 'Comedy Night',
  workshop: 'Workshop',
  competition: 'Competition',
  other: 'Other'
};

const categoryDescriptions: Record<TemplateCategory, string> = {
  all: 'Show all available templates',
  'open-mic': 'Beginner-friendly open mic templates',
  showcase: 'Curated performer showcase templates',
  'pro-show': 'Professional comedy show templates',
  'comedy-night': 'General comedy night templates',
  workshop: 'Educational workshop templates',
  competition: 'Comedy competition templates',
  other: 'Miscellaneous templates'
};

export const EventTemplateCategoryFilter: React.FC<TemplateCategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  categoryCounts = {}
}) => {
  return (
    <div className="space-y-2">
      <Select value={selectedCategory} onValueChange={onCategoryChange}>
        <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
          <Filter className="w-4 h-4 mr-2" />
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent className="bg-white border-gray-200">
          {Object.entries(categoryLabels).map(([category, label]) => {
            const count = categoryCounts[category as TemplateCategory] || 0;
            return (
              <SelectItem 
                key={category} 
                value={category}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span>{label}</span>
                  {category !== 'all' && count > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {count}
                    </Badge>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      
      {selectedCategory !== 'all' && (
        <p className="text-xs text-gray-300">
          {categoryDescriptions[selectedCategory]}
        </p>
      )}
    </div>
  );
};

// Utility function to categorize templates automatically
export const categorizeTemplate = (templateData: any): TemplateCategory => {
  const title = templateData.title?.toLowerCase() || '';
  const description = templateData.description?.toLowerCase() || '';
  const showType = templateData.showType?.toLowerCase() || '';
  
  // Check for specific keywords
  if (title.includes('open mic') || description.includes('open mic')) {
    return 'open-mic';
  }
  
  if (title.includes('showcase') || description.includes('showcase')) {
    return 'showcase';
  }
  
  if (title.includes('workshop') || description.includes('workshop') || 
      title.includes('masterclass') || description.includes('masterclass')) {
    return 'workshop';
  }
  
  if (title.includes('competition') || description.includes('competition') ||
      title.includes('contest') || description.includes('contest')) {
    return 'competition';
  }
  
  if (showType === 'professional' || templateData.isPaid === true) {
    return 'pro-show';
  }
  
  if (title.includes('comedy night') || description.includes('comedy night')) {
    return 'comedy-night';
  }
  
  return 'other';
};