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

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-AU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

export interface SpotCancelledEmailData {
  comedianName: string;
  comedianEmail: string;
  eventTitle: string;
  eventDate: string;
  venue: string;
  spotType: string;
  cancellationReason?: string;
  promoterName: string;
  promoterEmail: string;
  browseShowsUrl: string;
}

// ---------------------------------------------------------------------------
// Preview props
// ---------------------------------------------------------------------------

const previewProps: SpotCancelledEmailData = {
  comedianName: 'Jane Smith',
  comedianEmail: 'jane@example.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  venue: 'ID Comedy Club',
  spotType: '10-minute Set',
  cancellationReason: 'Unfortunately the show has been postponed due to venue availability.',
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@gigpigs.app',
  browseShowsUrl: 'https://gigpigs.app/shows',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SpotCancelled(props: SpotCancelledEmailData = previewProps) {
  const data = { ...previewProps, ...props };
  return (
    <EmailLayout
      previewText={`Your spot at ${data.eventTitle} has been cancelled`}
    >
      <BrandHeader
        title="Spot Cancelled"
        subtitle={`${data.spotType} \u2022 ${data.eventTitle}`}
      />

      <AlertBox variant="urgent">
        Your <strong>{data.spotType}</strong> spot at{' '}
        <strong>{data.eventTitle}</strong> has been cancelled by the promoter.
      </AlertBox>

      <Divider />

      <ContentCard>
        <DetailRow label="Event" value={data.eventTitle} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Venue" value={data.venue} />
        <DetailRow label="Cancelled Spot" value={data.spotType} highlight />
        <DetailRow label="Promoter" value={data.promoterName} />
      </ContentCard>

      {data.cancellationReason ? (
        <>
          <Divider />
          <ContentCard>
            <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.neutral.muted, margin: '0 0 8px 0' }}>
              Reason
            </Text>
            <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
              {data.cancellationReason}
            </Text>
          </ContentCard>
        </>
      ) : null}

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

      <Divider />

      <PrimaryButton href={data.browseShowsUrl}>
        Browse Other Shows
      </PrimaryButton>
      <SecondaryButton href={`mailto:${data.promoterEmail}`}>
        contact promoter
      </SecondaryButton>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export async function renderHtml(data: SpotCancelledEmailData): Promise<string> {
  return await render(<SpotCancelled {...data} />);
}

export async function renderText(data: SpotCancelledEmailData): Promise<string> {
  return await render(<SpotCancelled {...data} />, { plainText: true });
}

export default SpotCancelled;
