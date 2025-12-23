import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProfileInformation } from '@/components/ProfileInformation';
import { ContactInformation } from '@/components/ContactInformation';
import { FinancialInformation } from '@/components/FinancialInformation';
import { CareerHighlightsManager } from '@/components/profile/CareerHighlightsManager';
import { PressReviewsManager } from '@/components/profile/PressReviewsManager';
import { CustomLinksManager } from '@/components/comedian-profile/CustomLinksManager';
import type { ProfileType, ProfileConfig } from '@/types/universalProfile';
import {
  User,
  Phone,
  Building,
  Trophy,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';

interface UniversalProfileTabsProps {
  profileType: ProfileType;
  config: ProfileConfig;
  user: any;
  onSave: (data: any) => Promise<void>;
  organizationId?: string;
}

export const UniversalProfileTabs: React.FC<UniversalProfileTabsProps> = ({
  profileType,
  config,
  user,
  onSave,
  organizationId,
}) => {
  // Map section keys to their components
  const sectionComponents: Record<string, React.ReactNode> = {
    personal: (
      <ProfileInformation
        user={user}
        onSave={onSave}
        profileType={profileType}
        config={config}
      />
    ),
    contact: (
      <ContactInformation
        profileType={profileType}
        config={config}
        user={user}
        organizationId={organizationId}
        onSave={onSave}
      />
    ),
    financial: (
      <FinancialInformation
        profileType={profileType}
        config={config}
        user={user}
        organizationId={organizationId}
        onSave={onSave}
      />
    ),
    highlights: config.tables.accomplishments ? (
      <CareerHighlightsManager
        tableName={config.tables.accomplishments}
        userId={organizationId ? undefined : user?.id}
        organizationId={organizationId}
      />
    ) : null,
    reviews: config.tables.reviews ? (
      <PressReviewsManager
        tableName={config.tables.reviews}
        userId={organizationId ? undefined : user?.id}
        organizationId={organizationId}
      />
    ) : null,
    links: config.tables.links ? (
      <CustomLinksManager
        tableName={config.tables.links}
        userId={organizationId ? undefined : user?.id}
        organizationId={organizationId}
      />
    ) : null,
    media: (
      <div className="p-6 bg-muted/20 rounded-lg text-center">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">
          Media portfolio component coming soon
        </p>
      </div>
    ),
  };

  // Map section keys to their icons
  const sectionIcons: Record<string, React.ReactNode> = {
    personal: <User className="w-4 h-4" />,
    contact: <Phone className="w-4 h-4" />,
    financial: <Building className="w-4 h-4" />,
    highlights: <Trophy className="w-4 h-4" />,
    reviews: <FileText className="w-4 h-4" />,
    links: <LinkIcon className="w-4 h-4" />,
    media: <ImageIcon className="w-4 h-4" />,
  };

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue="personal"
      className="space-y-4"
    >
      {config.sections.map((section) => {
        const component = sectionComponents[section];
        const icon = sectionIcons[section];
        const label = config.labels[section as keyof typeof config.labels] || section;

        // Skip sections without components
        if (!component) return null;

        return (
          <AccordionItem
            key={section}
            value={section}
            className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50 backdrop-blur-sm shadow-sm"
          >
            <AccordionTrigger className="px-6 py-4 hover:bg-slate-700/50 transition-colors text-white">
              <div className="flex items-center gap-3">
                {icon}
                <span className="font-semibold text-lg">{label}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6 pt-2">
              {component}
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
};
