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

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

export interface LineupPublishedEmailData {
  comedianName: string;
  comedianEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  performanceOrder?: number;
  promoterName: string;
  promoterEmail: string;
  eventUrl: string;
}

// ---------------------------------------------------------------------------
// Preview props
// ---------------------------------------------------------------------------

const previewProps: LineupPublishedEmailData = {
  comedianName: 'Jane Smith',
  comedianEmail: 'jane@example.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  performanceOrder: 3,
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@gigpigs.app',
  eventUrl: 'https://gigpigs.app/events/friday-night-comedy',
};

// ---------------------------------------------------------------------------
// Ordinal helper
// ---------------------------------------------------------------------------

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0] ?? 'th');
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LineupPublished(props: LineupPublishedEmailData = previewProps) {
  const data = { ...previewProps, ...props };
  return (
    <EmailLayout
      previewText={`The lineup is live for ${data.eventTitle} — you're on the bill!`}
    >
      <BrandHeader
        title="The Lineup is Live!"
        subtitle={`${data.eventTitle}`}
      />

      <AlertBox variant="success">
        You're on the bill. The official lineup for{' '}
        <strong>{data.eventTitle}</strong> has been published.
        {data.performanceOrder !== undefined && data.performanceOrder !== null ? (
          <> You're performing <strong>{ordinal(data.performanceOrder)}</strong> on the night.</>
        ) : null}
      </AlertBox>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.heading, margin: '0 0 12px 0' }}>
          Hey {data.comedianName},
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          The lineup is locked in and published. Review the details below and
          make sure you arrive early — doors and sound checks won't wait.
        </Text>
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <DetailRow label="Event" value={data.eventTitle} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Showtime" value={data.eventTime} />
        <DetailRow label="Venue" value={data.venue} />
        <DetailRow label="Address" value={data.address} />
        <DetailRow label="Your Spot" value={data.spotType} highlight />
        {data.performanceOrder !== undefined && data.performanceOrder !== null ? (
          <DetailRow label="Performance Order" value={ordinal(data.performanceOrder)} highlight />
        ) : null}
        <DetailRow label="Promoter" value={data.promoterName} />
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.neutral.muted, margin: '0 0 8px 0' }}>
          Arrival Reminder
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          Plan to arrive at least <strong>45 minutes before showtime</strong> to
          allow time for sign-in and any last-minute changes to the running order.
        </Text>
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <PrimaryButton href={data.eventUrl}>
        View Full Lineup
      </PrimaryButton>

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

export async function renderHtml(data: LineupPublishedEmailData): Promise<string> {
  return await render(<LineupPublished {...data} />);
}

export async function renderText(data: LineupPublishedEmailData): Promise<string> {
  return await render(<LineupPublished {...data} />, { plainText: true });
}

export default LineupPublished;
