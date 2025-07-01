
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomShowTypes } from '@/hooks/useCustomShowTypes';
import { ShowLevelTypeSection } from './EventRequirementsSection/ShowLevelTypeSection';
import { CustomShowTypeInput } from './EventRequirementsSection/CustomShowTypeInput';
import { RequirementsManager } from './EventRequirementsSection/RequirementsManager';
import { EventSettingsSection } from './EventRequirementsSection/EventSettingsSection';

interface EventRequirementsSectionProps {
  formData: {
    requirements: string[];
    allowRecording: boolean;
    ageRestriction: string;
    dresscode: string;
    showLevel: string;
    showType: string;
    customShowType: string;
  };
  onFormDataChange: (updates: Partial<EventRequirementsSectionProps['formData']>) => void;
}

export const EventRequirementsSection: React.FC<EventRequirementsSectionProps> = ({
  formData,
  onFormDataChange
}) => {
  const { customShowTypes, saveCustomShowType } = useCustomShowTypes();

  const handleShowTypeChange = (value: string) => {
    onFormDataChange({ showType: value });
    if (value !== 'custom') {
      onFormDataChange({ customShowType: '' });
    }
  };

  const handleCustomShowTypeSubmit = () => {
    if (formData.customShowType.trim()) {
      saveCustomShowType(formData.customShowType.trim());
    }
  };

  return (
    <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
      <CardHeader>
        <CardTitle>Requirements & Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ShowLevelTypeSection
          showLevel={formData.showLevel}
          showType={formData.showType}
          customShowTypes={customShowTypes}
          onShowLevelChange={(value) => onFormDataChange({ showLevel: value })}
          onShowTypeChange={handleShowTypeChange}
        />

        {formData.showType === 'custom' && (
          <CustomShowTypeInput
            customShowType={formData.customShowType}
            onCustomShowTypeChange={(value) => onFormDataChange({ customShowType: value })}
            onSubmit={handleCustomShowTypeSubmit}
          />
        )}

        <RequirementsManager
          requirements={formData.requirements}
          onRequirementsChange={(requirements) => onFormDataChange({ requirements })}
        />

        <EventSettingsSection
          allowRecording={formData.allowRecording}
          ageRestriction={formData.ageRestriction}
          dresscode={formData.dresscode}
          onAllowRecordingChange={(checked) => onFormDataChange({ allowRecording: checked })}
          onAgeRestrictionChange={(value) => onFormDataChange({ ageRestriction: value })}
          onDresscodeChange={(value) => onFormDataChange({ dresscode: value })}
        />
      </CardContent>
    </Card>
  );
};
