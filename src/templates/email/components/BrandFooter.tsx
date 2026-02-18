import * as React from 'react';
import { Section, Text, Link, Hr } from '@react-email/components';
import { colors, fonts, spacing, businessInfo } from '../tokens';

interface BrandFooterProps {
  unsubscribeUrl?: string;
}

const footerText: React.CSSProperties = {
  fontFamily: fonts.body,
  fontSize: '12px',
  color: colors.neutral.mediumGray,
  margin: '0 0 6px 0',
  lineHeight: '1.6',
};

const footerLink: React.CSSProperties = {
  color: colors.brand.primary,
  textDecoration: 'none',
};

export function BrandFooter({ unsubscribeUrl }: BrandFooterProps) {
  return (
    <>
      {/* Brand gradient bar */}
      <Section
        style={{
          height: '4px',
          background: colors.brand.gradient,
          marginTop: '0',
        }}
      />

      <Section
        style={{
          textAlign: 'center' as const,
          padding: `${spacing.lg} ${spacing.lg} ${spacing.xl} ${spacing.lg}`,
          backgroundColor: colors.neutral.offWhite,
        }}
      >
        {/* Brand name */}
        <Text
          style={{
            ...footerText,
            fontSize: '13px',
            fontWeight: 600,
            color: colors.neutral.darkGray,
            margin: '0 0 4px 0',
          }}
        >
          {businessInfo.companyName}
        </Text>

        <Text style={footerText}>ABN {businessInfo.abn}</Text>

        {/* Links row */}
        <Text style={{ ...footerText, margin: '12px 0 0 0' }}>
          <Link href={businessInfo.websiteUrl} style={footerLink}>
            Website
          </Link>
          {' \u00B7 '}
          <Link href={`mailto:${businessInfo.contactEmail}`} style={footerLink}>
            Contact
          </Link>
          {' \u00B7 '}
          <Link href={businessInfo.privacyUrl} style={footerLink}>
            Privacy
          </Link>
          {unsubscribeUrl && (
            <>
              {' \u00B7 '}
              <Link href={unsubscribeUrl} style={footerLink}>
                Unsubscribe
              </Link>
            </>
          )}
        </Text>

        <Text
          style={{
            ...footerText,
            fontSize: '11px',
            margin: '16px 0 0 0',
            color: '#a0aec0',
          }}
        >
          &copy; {new Date().getFullYear()} {businessInfo.companyName}. All rights reserved.
        </Text>
      </Section>
    </>
  );
}
