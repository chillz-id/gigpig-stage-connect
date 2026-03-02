import * as React from 'react';
import { Section, Hr } from '@react-email/components';
import { colors } from '../tokens';

interface DividerProps {
  spacing?: string;
}

/**
 * Email-safe horizontal divider. Wraps <Hr> in a padded Section
 * to avoid the width:100% + margin overflow bug in email clients.
 */
export function Divider({ spacing = '12px' }: DividerProps) {
  return (
    <Section style={{ padding: '0 48px' }}>
      <Hr style={{ borderColor: colors.neutral.border, margin: `${spacing} 0` }} />
    </Section>
  );
}
