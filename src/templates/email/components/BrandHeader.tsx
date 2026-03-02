import * as React from 'react';
import { Section, Heading, Text, Img } from '@react-email/components';
import { Divider } from './Divider';
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
          backgroundColor: colors.neutral.heading,
          borderRadius: '8px 8px 0 0',
        }}
      />

      <Section style={{ padding: '32px 48px 0 48px', textAlign: 'center' as const }}>
        {/* Brand logo — centered */}
        <Img
          src={businessInfo.logoBlack}
          width="72"
          height="72"
          alt="GigPigs"
          style={{ margin: '0 auto 20px auto' }}
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
            textAlign: 'center' as const,
          }}
        >
          {title}
        </Heading>

        {subtitle && (
          <Text
            style={{
              fontFamily: fonts.body,
              fontSize: '15px',
              color: colors.neutral.muted,
              marginTop: '6px',
              marginBottom: '0',
              lineHeight: '1.5',
              textAlign: 'center' as const,
            }}
          >
            {subtitle}
          </Text>
        )}
      </Section>

      <Divider spacing="24px" />
    </>
  );
}
