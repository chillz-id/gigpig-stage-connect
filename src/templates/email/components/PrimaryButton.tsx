import * as React from 'react';
import { Section } from '@react-email/components';
import { colors, fonts } from '../tokens';

interface PrimaryButtonProps {
  href: string;
  children: React.ReactNode;
  color?: string;
}

/**
 * Solid CTA button. One per email. Follows Stripe/Vercel pattern:
 * brand color fill, white text, subtle rounding, no shadow.
 */
export function PrimaryButton({ href, children, color }: PrimaryButtonProps) {
  const bgColor = color || colors.brand.primary;

  return (
    <Section style={{ textAlign: 'center' as const, padding: '28px 0' }}>
      <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: bgColor,
                borderRadius: '5px',
                textAlign: 'center' as const,
              }}
            >
              <a
                href={href}
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  color: colors.neutral.white,
                  fontSize: '15px',
                  fontWeight: 600,
                  fontFamily: fonts.body,
                  textDecoration: 'none',
                  lineHeight: '1',
                }}
              >
                {children}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
