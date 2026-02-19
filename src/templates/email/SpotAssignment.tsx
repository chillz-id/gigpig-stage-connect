import * as React from 'react';
import { Text, Link, Hr, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  PrimaryButton,
  SecondaryButton,
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

function formatDeadline(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

export interface SpotAssignmentEmailData {
  comedianName: string;
  comedianEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  confirmationDeadline: string;
  confirmationUrl: string;
  eventUrl: string;
  promoterName: string;
  promoterEmail: string;
  performanceDuration?: string;
  specialInstructions?: string;
}

// ---------------------------------------------------------------------------
// Preview props
// ---------------------------------------------------------------------------

const previewProps: SpotAssignmentEmailData = {
  comedianName: 'Jane Smith',
  comedianEmail: 'jane@example.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  confirmationDeadline: '2026-03-04T17:00:00',
  confirmationUrl: 'https://standupsydney.com/confirm/abc123',
  eventUrl: 'https://standupsydney.com/events/friday-night-comedy',
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@standupsydney.com',
  performanceDuration: '10 minutes',
  specialInstructions: 'Please arrive by 6:30 PM for sound check. Clean material only.',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpotAssignment(data: SpotAssignmentEmailData = previewProps) {
  return (
    <EmailLayout
      previewText={`You've got a spot! ${data.spotType} at ${data.eventTitle}`}
    >
      <BrandHeader
        title="You've Got a Spot!"
        subtitle={`${data.spotType} \u2022 ${data.eventTitle}`}
      />

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.heading, margin: '0 0 12px 0' }}>
          Hey {data.comedianName},
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          You've been assigned a <strong>{data.spotType}</strong> spot at{' '}
          <strong>{data.eventTitle}</strong>. Confirm below.
        </Text>
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <DetailRow label="Event" value={data.eventTitle} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Venue" value={data.venue} />
        <DetailRow label="Address" value={data.address} />
        <DetailRow label="Your Spot" value={data.spotType} highlight />
        {data.performanceDuration ? (
          <DetailRow label="Duration" value={data.performanceDuration} />
        ) : null}
        <DetailRow label="Promoter" value={data.promoterName} />
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <AlertBox variant="warning">
        Confirm by {formatDeadline(data.confirmationDeadline)} — your spot will be released if not confirmed.
      </AlertBox>

      <PrimaryButton href={data.confirmationUrl} color={colors.status.success}>
        Confirm My Spot
      </PrimaryButton>
      <SecondaryButton href={data.eventUrl}>view event details</SecondaryButton>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      {data.specialInstructions ? (
        <>
          <ContentCard>
            <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.neutral.muted, margin: '0 0 8px 0' }}>
              Note
            </Text>
            <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
              {data.specialInstructions}
            </Text>
          </ContentCard>
          <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />
        </>
      ) : null}

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

export async function renderHtml(data: SpotAssignmentEmailData): Promise<string> {
  return await render(<SpotAssignment {...data} />);
}

export async function renderText(data: SpotAssignmentEmailData): Promise<string> {
  return await render(<SpotAssignment {...data} />, { plainText: true });
}

export default SpotAssignment;
