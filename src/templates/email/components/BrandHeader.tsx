import * as React from 'react';
import { Section, Heading, Text, Hr, Img } from '@react-email/components';
import { colors, fonts, businessInfo } from '../tokens';

interface BrandHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Clean header: thin brand-color top bar + brand name + title.
 * Follows the Stripe/Vercel pattern — no gradient, no hero banner.
 */
export function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  return (
    <>
      {/* Thin accent bar at top */}
      <Section
        style={{
          height: '4px',
          backgroundColor: colors.brand.primary,
          borderRadius: '8px 8px 0 0',
        }}
      />

      <Section style={{ padding: '32px 48px 0 48px' }}>
        {/* Brand logo */}
        <Img
          src={businessInfo.logoBlack}
          width="100"
          height="100"
          alt="GigPigs"
          style={{ margin: '0 0 16px 0' }}
        />

        {/* Title */}
        <Heading
          as="h1"
          style={{
            fontFamily: fonts.body,
            fontSize: '24px',
            fontWeight: 600,
            color: colors.neutral.heading,
            margin: '0',
            padding: '0',
            lineHeight: '1.35',
          }}
        >
          {title}
        </Heading>

        {subtitle && (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: '15px',
              color: colors.neutral.body,
              marginTop: '8px',
              marginBottom: '0',
              lineHeight: '1.5',
            }}
          >
            {subtitle}
          </Text>
        )}
      </Section>

      <Hr style={{ borderColor: colors.neutral.border, margin: '24px 48px' }} />
    </>
  );
}
