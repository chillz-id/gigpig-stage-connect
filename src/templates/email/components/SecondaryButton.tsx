import * as React from 'react';
import { Section } from '@react-email/components';
import { colors, fonts } from '../tokens';

interface SecondaryButtonProps {
  href: string;
  children: React.ReactNode;
  color?: string;
}

export function SecondaryButton({ href, children, color }: SecondaryButtonProps) {
  const accentColor = color || colors.brand.primary;

  return (
    <Section style={{ textAlign: 'center' as const, padding: '8px 0 24px 0' }}>
      <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: 'transparent',
                borderRadius: '8px',
                border: `2px solid ${accentColor}`,
                textAlign: 'center' as const,
              }}
            >
              <a
                href={href}
                style={{
                  display: 'inline-block',
                  padding: '12px 32px',
                  color: accentColor,
                  fontSize: '14px',
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
