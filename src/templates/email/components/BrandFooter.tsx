import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { Divider } from './Divider';
import { colors, fonts, businessInfo } from '../tokens';

interface BrandFooterProps {
  unsubscribeUrl?: string;
}

/**
 * Minimal footer following Stripe's pattern:
 * HR divider, company info, links in small muted text.
 */
export function BrandFooter({ unsubscribeUrl }: BrandFooterProps) {
  return (
    <>
      <Divider />

      <Section style={{ padding: '24px 48px 32px 48px', textAlign: 'center' as const }}>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: '12px',
            lineHeight: '1.6',
            color: colors.neutral.footer,
            margin: '0 0 8px 0',
          }}
        >
          {businessInfo.companyName} &middot; ABN {businessInfo.abn}
        </Text>

        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: '12px',
            lineHeight: '1.6',
            color: colors.neutral.footer,
            margin: '0',
          }}
        >
          <Link
            href={businessInfo.websiteUrl}
            style={{ color: colors.neutral.muted, textDecoration: 'none' }}
          >
            Website
          </Link>
          {' \u00B7 '}
          <Link
            href={`mailto:${businessInfo.contactEmail}`}
            style={{ color: colors.neutral.muted, textDecoration: 'none' }}
          >
            Contact
          </Link>
          {' \u00B7 '}
          <Link
            href={businessInfo.privacyUrl}
            style={{ color: colors.neutral.muted, textDecoration: 'none' }}
          >
            Privacy
          </Link>
          {unsubscribeUrl && (
            <>
              {' \u00B7 '}
              <Link
                href={unsubscribeUrl}
                style={{ color: colors.neutral.muted, textDecoration: 'none' }}
              >
                Unsubscribe
              </Link>
            </>
          )}
        </Text>
      </Section>
    </>
  );
}
