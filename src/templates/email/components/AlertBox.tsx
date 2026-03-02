import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, fonts } from '../tokens';

type AlertVariant = 'warning' | 'urgent' | 'info' | 'success';

interface AlertBoxProps {
  variant: AlertVariant;
  children: React.ReactNode;
}

const variantStyles: Record<AlertVariant, { background: string; border: string }> = {
  warning: { background: colors.status.warningBg, border: colors.status.warning },
  urgent: { background: colors.status.urgentBg, border: colors.status.urgent },
  info: { background: colors.status.infoBg, border: colors.status.info },
  success: { background: colors.status.successBg, border: colors.status.success },
};

/**
 * Subtle alert box with tinted background and left border.
 * No emoji icons — just content. Clean and professional.
 */
export function AlertBox({ variant, children }: AlertBoxProps) {
  const vs = variantStyles[variant];

  return (
    <Section style={{ padding: '0 48px 4px 48px' }}>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: vs.background,
                borderLeft: `3px solid ${vs.border}`,
                padding: '16px 24px',
                borderRadius: '4px',
              }}
            >
              {children}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
