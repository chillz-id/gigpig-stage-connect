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
            body { background-color: #1a1a2e !important; }
            .email-container { background-color: #2d2d44 !important; border-color: #404060 !important; }
          }
          @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
          }
        `}</style>
      </Head>
      {previewText ? <Preview>{previewText}</Preview> : null}
      <Body
        style={{
          fontFamily: fonts.body,
          backgroundColor: colors.neutral.offWhite,
          margin: '0',
          padding: '0',
          WebkitTextSizeAdjust: '100%',
        }}
      >
        <Section style={{ height: '40px' }} />

        <Container
          className="email-container"
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            backgroundColor: colors.neutral.white,
            border: `1px solid ${colors.neutral.border}`,
            borderRadius: '8px',
          }}
        >
          {children}
        </Container>

        <Section style={{ height: '40px' }} />
      </Body>
    </Html>
  );
}
