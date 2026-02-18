import * as React from 'react';
import { Section } from '@react-email/components';
import { colors, spacing } from '../tokens';

interface ContentCardProps {
  children: React.ReactNode;
  accentColor?: string;
  padding?: string;
}

export function ContentCard({ children, accentColor, padding }: ContentCardProps) {
  return (
    <Section
      className="email-card"
      style={{
        backgroundColor: colors.neutral.white,
        borderLeft: accentColor
          ? `4px solid ${accentColor}`
          : undefined,
        padding: padding || `${spacing.lg} ${spacing.lg}`,
        margin: '0',
        borderBottom: `1px solid ${colors.neutral.lightGray}`,
      }}
    >
      {children}
    </Section>
  );
}
