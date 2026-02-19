import * as React from 'react';
import { Section, Link, Text } from '@react-email/components';
import { colors, fonts } from '../tokens';

interface SecondaryButtonProps {
  href: string;
  children: React.ReactNode;
}

/**
 * Secondary action as a plain text link — not a bordered button.
 * Follows Vercel's pattern of using links below the primary CTA.
 */
export function SecondaryButton({ href, children }: SecondaryButtonProps) {
  return (
    <Section style={{ textAlign: 'center' as const, paddingBottom: '8px' }}>
      <Text style={{ margin: '0', fontSize: '14px', fontFamily: fonts.body }}>
        or{' '}
        <Link
          href={href}
          style={{
            color: colors.brand.primary,
            textDecoration: 'none',
          }}
        >
          {children}
        </Link>
      </Text>
    </Section>
  );
}
