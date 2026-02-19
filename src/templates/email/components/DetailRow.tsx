import * as React from 'react';
import { colors, fonts } from '../tokens';

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

/**
 * Key-value row for event details, invoice fields, etc.
 * Clean two-column table with subtle separator.
 */
export function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0">
      <tbody>
        <tr>
          <td
            style={{
              color: colors.neutral.muted,
              fontSize: '13px',
              fontFamily: fonts.body,
              width: '120px',
              verticalAlign: 'top',
              padding: '8px 0',
              borderBottom: `1px solid ${colors.neutral.border}`,
            }}
          >
            {label}
          </td>
          <td
            style={{
              color: highlight ? colors.neutral.heading : colors.neutral.body,
              fontSize: '14px',
              fontWeight: highlight ? 600 : 400,
              fontFamily: fonts.body,
              verticalAlign: 'top',
              padding: '8px 0',
              borderBottom: `1px solid ${colors.neutral.border}`,
            }}
          >
            {value}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
