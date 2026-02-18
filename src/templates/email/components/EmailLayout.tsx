import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Preview,
  Section,
} from '@react-email/components';
import { colors, fonts } from '../tokens';

interface EmailLayoutProps {
  previewText?: string;
  children: React.ReactNode;
}

export function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{`
          @media (prefers-color-scheme: dark) {
            body {
              background-color: ${colors.darkMode.background} !important;
              color: ${colors.darkMode.text} !important;
            }
            .email-card {
              background-color: ${colors.darkMode.surface} !important;
              border-color: #4a5568 !important;
            }
          }
          @media only screen and (max-width: 620px) {
            .email-container {
              width: 100% !important;
              padding: 8px !important;
            }
            .email-card {
              padding: 16px !important;
            }
          }
        `}</style>
      </Head>
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body
        style={{
          fontFamily: fonts.body,
          backgroundColor: colors.neutral.offWhite,
          color: colors.neutral.darkGray,
          margin: '0',
          padding: '0',
          WebkitTextSizeAdjust: '100%',
        }}
      >
        {/* Top spacer */}
        <Section style={{ height: '24px' }} />

        <Container
          className="email-container"
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0',
            backgroundColor: colors.neutral.white,
            borderRadius: '12px',
            overflow: 'hidden',
            border: `1px solid ${colors.neutral.lightGray}`,
          }}
        >
          {children}
        </Container>

        {/* Bottom spacer */}
        <Section style={{ height: '24px' }} />
      </Body>
    </Html>
  );
}
