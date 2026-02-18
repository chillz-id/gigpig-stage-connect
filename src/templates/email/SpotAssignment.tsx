import * as React from 'react';
import { Text, Link, Section, render } from '@react-email/components';
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
import { colors, fonts } from './tokens';

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
        <Text style={{ margin: '0 0 12px 0', fontSize: '16px', lineHeight: '1.5' }}>
          Hey {data.comedianName},
        </Text>
        <Text style={{ margin: '0', fontSize: '15px', lineHeight: '1.6', color: colors.neutral.darkGray }}>
          Great news — you've been assigned a <strong>{data.spotType}</strong> spot
          at <strong>{data.eventTitle}</strong>. Confirm your spot below to lock it in.
        </Text>
      </ContentCard>

      <ContentCard>
        <Text
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: colors.neutral.mediumGray,
            textTransform: 'uppercase' as const,
            letterSpacing: '1.5px',
            margin: '0 0 12px 0',
          }}
        >
          Event Details
        </Text>
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

      <AlertBox variant="warning">
        <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
          <strong>Confirm by {formatDeadline(data.confirmationDeadline)}</strong>
          <br />
          Your spot will be released if not confirmed by the deadline.
        </Text>
      </AlertBox>

      <Section style={{ backgroundColor: colors.neutral.white, borderBottom: `1px solid ${colors.neutral.lightGray}` }}>
        <PrimaryButton href={data.confirmationUrl} color={colors.status.success}>
          Confirm My Spot
        </PrimaryButton>
        <SecondaryButton href={data.eventUrl}>View Event Details</SecondaryButton>
      </Section>

      {data.specialInstructions ? (
        <ContentCard accentColor={colors.brand.accent}>
          <Text
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: colors.neutral.mediumGray,
              textTransform: 'uppercase' as const,
              letterSpacing: '1.5px',
              margin: '0 0 8px 0',
            }}
          >
            Special Instructions
          </Text>
          <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
            {data.specialInstructions}
          </Text>
        </ContentCard>
      ) : null}

      <ContentCard>
        <Text style={{ margin: '0', fontSize: '14px', color: colors.neutral.mediumGray }}>
          Questions? Reach out to <strong style={{ color: colors.neutral.darkGray }}>{data.promoterName}</strong> at{' '}
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
