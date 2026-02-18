import * as React from 'react';
import { Section, Text } from '@react-email/components';
import { colors, spacing, fonts } from '../tokens';

type AlertVariant = 'warning' | 'urgent' | 'info' | 'success';

interface AlertBoxProps {
  variant: AlertVariant;
  children: React.ReactNode;
}

const variantMap: Record<AlertVariant, { background: string; border: string; icon: string; label: string }> = {
  warning: {
    background: colors.status.warningBg,
    border: colors.status.warning,
    icon: '\u26A0\uFE0F',
    label: 'Warning',
  },
  urgent: {
    background: colors.status.urgentBg,
    border: colors.status.urgent,
    icon: '\u{1F6A8}',
    label: 'Urgent',
  },
  info: {
    background: colors.status.infoBg,
    border: colors.status.info,
    icon: '\u2139\uFE0F',
    label: 'Info',
  },
  success: {
    background: colors.status.successBg,
    border: colors.status.success,
    icon: '\u2705',
    label: 'Success',
  },
};

export function AlertBox({ variant, children }: AlertBoxProps) {
  const { background, border, icon } = variantMap[variant];

  return (
    <Section
      style={{
        backgroundColor: background,
        borderLeft: `4px solid ${border}`,
        padding: `${spacing.md} ${spacing.lg}`,
        margin: '0',
        borderBottom: `1px solid ${colors.neutral.lightGray}`,
      }}
    >
      <table role="presentation" cellPadding="0" cellSpacing="0" width="100%">
        <tbody>
          <tr>
            <td style={{ width: '32px', verticalAlign: 'top', fontSize: '18px', paddingTop: '2px' }}>
              {icon}
            </td>
            <td style={{ verticalAlign: 'top' }}>
              {children}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
