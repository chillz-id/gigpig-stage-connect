import * as React from 'react';
import { Text, Link, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  PrimaryButton,
  SecondaryButton,
  DetailRow,
  ContentCard,
  AlertBox,
  Divider,
} from './components';
import { colors } from './tokens';

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

export interface ApplicationAcceptedEmailData {
  comedianName: string;
  comedianEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  promoterName: string;
  promoterEmail: string;
  confirmationUrl: string;
  eventUrl: string;
}

// ---------------------------------------------------------------------------
// Preview props
// ---------------------------------------------------------------------------

const previewProps: ApplicationAcceptedEmailData = {
  comedianName: 'Jane Smith',
  comedianEmail: 'jane@example.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@gigpigs.app',
  confirmationUrl: 'https://gigpigs.app/confirm/abc123',
  eventUrl: 'https://gigpigs.app/events/friday-night-comedy',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ApplicationAccepted(props: ApplicationAcceptedEmailData = previewProps) {
  const data = { ...previewProps, ...props };
  return (
    <EmailLayout
      previewText={`Your application to ${data.eventTitle} has been accepted!`}
    >
      <BrandHeader
        title="Application Accepted!"
        subtitle={`${data.spotType} \u2022 ${data.eventTitle}`}
      />

      <AlertBox variant="success">
        Your application for a <strong>{data.spotType}</strong> spot at{' '}
        <strong>{data.eventTitle}</strong> has been accepted.<br />Confirm your spot
        below before it expires.
      </AlertBox>

      <Divider />

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.heading, margin: '0 0 12px 0' }}>
          Hey {data.comedianName},
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          Great news — <strong>{data.promoterName}</strong> has accepted your
          application. Review the show details and confirm your spot to lock it in.
        </Text>
      </ContentCard>

      <Divider />

      <ContentCard>
        <DetailRow label="Event" value={data.eventTitle} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={data.eventTime} />
        <DetailRow label="Venue" value={data.venue} />
        <DetailRow label="Address" value={data.address} />
        <DetailRow label="Your Spot" value={data.spotType} highlight />
        <DetailRow label="Promoter" value={data.promoterName} />
      </ContentCard>

      <Divider />

      <PrimaryButton href={data.confirmationUrl} color={colors.status.success}>
        Confirm My Spot
      </PrimaryButton>
      <SecondaryButton href={data.eventUrl}>view event details</SecondaryButton>

      <Divider />

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          Questions? Contact <strong>{data.promoterName}</strong> at{' '}
          <Link
            href={`mailto:${data.promoterEmail}`}
            style={{ color: colors.brand.primary, textDecoration: 'none' }}
          >
            {data.promoterEmail}
          </Link>
        </Text>
      </ContentCard>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export async function renderHtml(data: ApplicationAcceptedEmailData): Promise<string> {
  return await render(<ApplicationAccepted {...data} />);
}

export async function renderText(data: ApplicationAcceptedEmailData): Promise<string> {
  return await render(<ApplicationAccepted {...data} />, { plainText: true });
}

export default ApplicationAccepted;
