import * as React from 'react';
import { colors, fonts } from '../tokens';

interface DetailRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <table
      role="presentation"
      width="100%"
      cellPadding="0"
      cellSpacing="0"
    >
      <tbody>
        <tr>
          <td
            style={{
              color: colors.neutral.mediumGray,
              fontSize: '12px',
              fontWeight: 600,
              fontFamily: fonts.body,
              width: '130px',
              verticalAlign: 'top',
              padding: '8px 12px 8px 0',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              borderBottom: `1px solid ${colors.neutral.lightGray}`,
            }}
          >
            {label}
          </td>
          <td
            style={{
              color: highlight ? colors.brand.primary : colors.neutral.darkGray,
              fontSize: '14px',
              fontWeight: highlight ? 600 : 'normal',
              fontFamily: fonts.body,
              verticalAlign: 'top',
              padding: '8px 0',
              borderBottom: `1px solid ${colors.neutral.lightGray}`,
            }}
          >
            {value}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
