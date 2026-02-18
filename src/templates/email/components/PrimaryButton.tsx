import * as React from 'react';
import { Section } from '@react-email/components';
import { colors, fonts } from '../tokens';

interface PrimaryButtonProps {
  href: string;
  children: React.ReactNode;
  color?: string;
}

export function PrimaryButton({ href, children, color }: PrimaryButtonProps) {
  const bgColor = color || colors.brand.primary;

  return (
    <Section style={{ textAlign: 'center' as const, padding: '24px 0' }}>
      <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
        <tbody>
          <tr>
            <td
              style={{
                backgroundColor: bgColor,
                borderRadius: '8px',
                textAlign: 'center' as const,
                boxShadow: `0 2px 4px rgba(0,0,0,0.1), 0 4px 12px ${bgColor}33`,
              }}
            >
              {/*[if mso]>
              <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="17%" stroke="f" fillcolor="${bgColor}">
              <w:anchorlock/>
              <center>
              <![endif]*/}
              <a
                href={href}
                style={{
                  display: 'inline-block',
                  padding: '16px 40px',
                  color: colors.neutral.white,
                  fontSize: '16px',
                  fontWeight: 700,
                  fontFamily: fonts.body,
                  textDecoration: 'none',
                  lineHeight: '1',
                  letterSpacing: '0.3px',
                }}
              >
                {children}
              </a>
              {/*[if mso]>
              </center>
              </v:roundrect>
              <![endif]*/}
            </td>
          </tr>
        </tbody>
      </table>
    </Section>
  );
}
