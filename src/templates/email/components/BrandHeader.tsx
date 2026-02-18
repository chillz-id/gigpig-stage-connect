import * as React from 'react';
import { Section, Heading, Text, Img } from '@react-email/components';
import { colors, fonts, spacing } from '../tokens';

interface BrandHeaderProps {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
}

export function BrandHeader({ title, subtitle, backgroundColor }: BrandHeaderProps) {
  const bgStyle = backgroundColor
    ? { backgroundColor }
    : { background: colors.brand.gradient };

  return (
    <Section
      style={{
        ...bgStyle,
        paddingTop: '40px',
        paddingBottom: '36px',
        paddingLeft: spacing.lg,
        paddingRight: spacing.lg,
        textAlign: 'center' as const,
      }}
    >
      {/* Brand name masthead */}
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: '11px',
          fontWeight: 700,
          color: 'rgba(255, 255, 255, 0.7)',
          letterSpacing: '3px',
          textTransform: 'uppercase' as const,
          margin: '0 0 16px 0',
        }}
      >
        STAND UP SYDNEY
      </Text>

      {/* Decorative divider */}
      <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto 16px auto' }}>
        <tbody>
          <tr>
            <td style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
            <td style={{ width: '8px' }} />
            <td style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.brand.accent }} />
            <td style={{ width: '8px' }} />
            <td style={{ width: '40px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
          </tr>
        </tbody>
      </table>

      <Heading
        as="h1"
        style={{
          fontFamily: fonts.body,
          fontSize: '26px',
          fontWeight: 700,
          color: colors.neutral.white,
          margin: '0',
          padding: '0',
          lineHeight: '1.3',
        }}
      >
        {title}
      </Heading>
      {subtitle && (
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: '15px',
            color: 'rgba(255, 255, 255, 0.85)',
            marginTop: '8px',
            marginBottom: '0',
            lineHeight: '1.4',
          }}
        >
          {subtitle}
        </Text>
      )}
    </Section>
  );
}
