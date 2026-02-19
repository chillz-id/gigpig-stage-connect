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

export interface SpotConfirmationEmailData {
  comedianName: string;
  comedianEmail: string;
  promoterName: string;
  promoterEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  eventUrl: string;
  lineupUrl: string;
  performanceDuration?: string;
  arrivalTime?: string;
  soundCheckTime?: string;
  additionalInfo?: string;
  isPromoterEmail?: boolean;
}

// ---------------------------------------------------------------------------
// Preview props
// ---------------------------------------------------------------------------

const previewProps: SpotConfirmationEmailData = {
  comedianName: 'Jane Smith',
  comedianEmail: 'jane@example.com',
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@standupsydney.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  eventUrl: 'https://standupsydney.com/events/friday-night-comedy',
  lineupUrl: 'https://standupsydney.com/events/friday-night-comedy/lineup',
  performanceDuration: '10 minutes',
  arrivalTime: '6:30 PM',
  soundCheckTime: '6:45 PM',
  additionalInfo: 'Green room is on the second floor. Water and snacks provided.',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpotConfirmation(data: SpotConfirmationEmailData = previewProps) {
  const isPromoter = data.isPromoterEmail === true;

  if (!isPromoter) {
    // ----- Comedian variant -----
    return (
      <EmailLayout previewText={`Confirmed! ${data.spotType} at ${data.eventTitle}`}>
        <BrandHeader
          title="You're Confirmed"
          subtitle={`${data.spotType} \u2022 ${data.eventTitle}`}
        />

        <AlertBox variant="success">
          Your <strong>{data.spotType}</strong> spot at{' '}
          <strong>{data.eventTitle}</strong> is confirmed.
        </AlertBox>

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

        {data.arrivalTime || data.soundCheckTime ? (
          <>
            <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />
            <ContentCard>
              <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.neutral.muted, margin: '0 0 8px 0' }}>
                Arrival
              </Text>
              {data.arrivalTime ? (
                <DetailRow label="Arrive By" value={data.arrivalTime} highlight />
              ) : null}
              {data.soundCheckTime ? (
                <DetailRow label="Sound Check" value={data.soundCheckTime} />
              ) : null}
            </ContentCard>
          </>
        ) : null}

        {data.additionalInfo ? (
          <>
            <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />
            <ContentCard>
              <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.neutral.muted, margin: '0 0 8px 0' }}>
                Note
              </Text>
              <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
                {data.additionalInfo}
              </Text>
            </ContentCard>
          </>
        ) : null}

        <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

        <PrimaryButton href={data.eventUrl}>View Event</PrimaryButton>

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

  // ----- Promoter variant -----
  return (
    <EmailLayout previewText={`${data.comedianName} confirmed for ${data.eventTitle}`}>
      <BrandHeader
        title="Spot Confirmed"
        subtitle={`${data.comedianName} has confirmed their spot`}
      />

      <AlertBox variant="success">
        <strong>{data.comedianName}</strong> has confirmed their{' '}
        <strong>{data.spotType}</strong> spot at <strong>{data.eventTitle}</strong>.
      </AlertBox>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <DetailRow label="Event" value={data.eventTitle} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Venue" value={data.venue} />
        <DetailRow label="Comedian" value={data.comedianName} highlight />
        <DetailRow label="Spot Type" value={data.spotType} />
        {data.performanceDuration ? (
          <DetailRow label="Duration" value={data.performanceDuration} />
        ) : null}
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <PrimaryButton href={data.lineupUrl}>View Lineup</PrimaryButton>

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          Need to reach {data.comedianName}?{' '}
          <Link
            href={`mailto:${data.comedianEmail}`}
            style={{ color: colors.brand.primary, textDecoration: 'none' }}
          >
            {data.comedianEmail}
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

export async function renderHtml(data: SpotConfirmationEmailData): Promise<string> {
  return await render(<SpotConfirmation {...data} />);
}

export async function renderText(data: SpotConfirmationEmailData): Promise<string> {
  return await render(<SpotConfirmation {...data} />, { plainText: true });
}

export default SpotConfirmation;
