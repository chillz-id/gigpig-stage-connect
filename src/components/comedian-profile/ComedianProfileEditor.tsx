import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { User, Image as ImageIcon, Mail, Building, Trophy, FileText, Link as LinkIcon } from 'lucide-react';
import { ProfileInformation } from '@/components/ProfileInformation';
import ComedianMedia from '@/components/comedian-profile/ComedianMedia';
import { ContactInformation } from '@/components/ContactInformation';
import { FinancialInformation } from '@/components/FinancialInformation';
import { PressReviewsManager } from '@/components/profile/PressReviewsManager';
import { CareerHighlightsManager } from '@/components/profile/CareerHighlightsManager';
import { CustomLinksManager } from '@/components/comedian-profile/CustomLinksManager';

interface ComedianProfileEditorProps {
  userId: string;
  user?: any;
  onSave?: (data: any) => Promise<void>;
}

export const ComedianProfileEditor: React.FC<ComedianProfileEditorProps> = ({
  userId,
  user,
  onSave
}) => {
  return (
    <Card className="professional-card">
      <CardContent className="p-6">
        <Accordion type="multiple" defaultValue={['personal']} className="w-full">

          {/* Personal Information Section */}
          <AccordionItem value="personal">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span>Personal Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <ProfileInformation user={user} onSave={onSave} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Media Portfolio Section */}
          <AccordionItem value="media">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <span>Media Portfolio</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <ComedianMedia comedianId={userId} isOwnProfile={true} />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Contact Information Section */}
          <AccordionItem value="contact">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                <span>Contact Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <ContactInformation />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Financial Information Section */}
          <AccordionItem value="financial">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                <span>Financial Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <FinancialInformation />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Career Highlights Section */}
          <AccordionItem value="career-highlights">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span>Career Highlights</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <CareerHighlightsManager />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Press Reviews Section */}
          <AccordionItem value="press-reviews">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Press Reviews</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <PressReviewsManager />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Custom Links Section */}
          <AccordionItem value="custom-links">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-primary" />
                <span>Custom Links</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pt-4">
                <CustomLinksManager />
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </CardContent>
    </Card>
  );
};
