import * as React from 'react';
import { Text, Link, Hr, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  PrimaryButton,
  DetailRow,
  ContentCard,
  AlertBox,
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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

export interface SpotDeclinedEmailData {
  promoterName: string;
  promoterEmail: string;
  comedianName: string;
  eventTitle: string;
  eventDate: string;
  spotType: string;
  declineReason?: string;
  eventUrl: string;
}

// ---------------------------------------------------------------------------
// Preview props
// ---------------------------------------------------------------------------

const previewProps: SpotDeclinedEmailData = {
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@gigpigs.app',
  comedianName: 'Jane Smith',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  spotType: '10-minute Set',
  declineReason: 'Unfortunately I have a prior commitment that evening.',
  eventUrl: 'https://gigpigs.app/events/friday-night-comedy',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpotDeclined(props: SpotDeclinedEmailData = previewProps) {
  const data = { ...previewProps, ...props };
  return (
    <EmailLayout
      previewText={`${data.comedianName} declined their spot at ${data.eventTitle}`}
    >
      <BrandHeader
        title="Spot Declined"
        subtitle={`${data.comedianName} \u2022 ${data.eventTitle}`}
      />

      <AlertBox variant="warning">
        <strong>{data.comedianName}</strong> has declined their{' '}
        <strong>{data.spotType}</strong> spot at{' '}
        <strong>{data.eventTitle}</strong>.
      </AlertBox>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <DetailRow label="Event" value={data.eventTitle} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Declined Spot" value={data.spotType} highlight />
        <DetailRow label="Comedian" value={data.comedianName} />
      </ContentCard>

      {data.declineReason ? (
        <>
          <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />
          <ContentCard>
            <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.neutral.muted, margin: '0 0 8px 0' }}>
              Reason
            </Text>
            <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
              {data.declineReason}
            </Text>
          </ContentCard>
        </>
      ) : null}

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <PrimaryButton href={data.eventUrl}>
        View Event and Reassign Spot
      </PrimaryButton>

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          Need to follow up with {data.comedianName}? Reach out directly
          through GigPigs or view the event to reassign the spot.
        </Text>
      </ContentCard>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export async function renderHtml(data: SpotDeclinedEmailData): Promise<string> {
  return await render(<SpotDeclined {...data} />);
}

export async function renderText(data: SpotDeclinedEmailData): Promise<string> {
  return await render(<SpotDeclined {...data} />, { plainText: true });
}

export default SpotDeclined;
