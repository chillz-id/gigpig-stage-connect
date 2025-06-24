
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';
import { useEventTemplates } from '@/hooks/useEventTemplates';

interface EventTemplateLoaderProps {
  onLoadTemplate: (template: any) => void;
}

export const EventTemplateLoader: React.FC<EventTemplateLoaderProps> = ({
  onLoadTemplate
}) => {
  const { templates } = useEventTemplates();

  if (templates.length === 0) {
    return null;
  }

  return (
    <Select onValueChange={(value) => {
      const template = templates.find(t => t.id === value);
      if (template) onLoadTemplate(template);
    }}>
      <SelectTrigger className="bg-white/10 border-white/20 text-white w-48">
        <FileText className="w-4 h-4 mr-2" />
        <SelectValue placeholder="Load Template" />
      </SelectTrigger>
      <SelectContent>
        {templates.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
