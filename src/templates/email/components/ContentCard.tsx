import * as React from 'react';
import { Section } from '@react-email/components';

interface ContentCardProps {
  children: React.ReactNode;
  padding?: string;
}

/**
 * Simple padded content section. No borders, no accents.
 * Content sections are separated by HR dividers in the parent template.
 */
export function ContentCard({ children, padding }: ContentCardProps) {
  return (
    <Section style={{ padding: padding || '0 48px' }}>
      {children}
    </Section>
  );
}
