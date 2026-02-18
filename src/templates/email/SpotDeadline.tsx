import * as React from 'react';
import { Text, Section } from '@react-email/components';
import { render } from '@react-email/components';
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

export interface SpotDeadlineEmailData {
  comedianName: string;
  comedianEmail: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  address: string;
  spotType: string;
  hoursRemaining: number;
  confirmationUrl: string;
  eventUrl: string;
  promoterName: string;
  promoterEmail: string;
}

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

type UrgencyLevel = 'urgent' | 'warning' | 'info';

function getUrgency(hoursRemaining: number): {
  level: UrgencyLevel;
  headerColor: string;
  subtitle: string;
  buttonColor: string;
  buttonLabel: string;
} {
  if (hoursRemaining <= 2) {
    return {
      level: 'urgent',
      headerColor: colors.status.urgent,
      subtitle: 'Immediate action required',
      buttonColor: colors.status.urgent,
      buttonLabel: 'Confirm Now',
    };
  }
  if (hoursRemaining <= 6) {
    return {
      level: 'warning',
      headerColor: colors.status.warning,
      subtitle: 'Time is running out',
      buttonColor: colors.status.success,
      buttonLabel: 'Confirm My Spot',
    };
  }
  return {
    level: 'info',
    headerColor: colors.status.info,
    subtitle: 'Please confirm your spot',
    buttonColor: colors.status.success,
    buttonLabel: 'Confirm My Spot',
  };
}

const previewProps: SpotDeadlineEmailData = {
  comedianName: 'Jane Smith',
  comedianEmail: 'jane@example.com',
  eventTitle: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  address: '88 Foveaux St, Surry Hills NSW 2010',
  spotType: '10-minute Set',
  hoursRemaining: 2,
  confirmationUrl: 'https://standupsydney.com/confirm/abc123',
  eventUrl: 'https://standupsydney.com/events/friday-night-comedy',
  promoterName: 'Dave Johnson',
  promoterEmail: 'dave@standupsydney.com',
};

export function SpotDeadline(data: SpotDeadlineEmailData = previewProps) {
  const urgency = getUrgency(data.hoursRemaining);
  const previewText = `${data.hoursRemaining}h left to confirm your spot at ${data.eventTitle}`;

  return (
    <EmailLayout previewText={previewText}>
      <BrandHeader
        title="Confirmation Reminder"
        subtitle={urgency.subtitle}
        backgroundColor={urgency.headerColor}
      />

      <AlertBox variant={urgency.level}>
        <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
          <strong>{data.hoursRemaining} hours remaining</strong> to confirm your{' '}
          <strong>{data.spotType}</strong> spot at {data.eventTitle}.
          {data.hoursRemaining <= 2 && (
            <><br />Your spot will be released if not confirmed.</>
          )}
        </Text>
      </AlertBox>

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
        <DetailRow label="Your Spot" value={data.spotType} highlight />
      </ContentCard>

      <Section style={{ backgroundColor: colors.neutral.white, borderBottom: `1px solid ${colors.neutral.lightGray}` }}>
        <PrimaryButton
          href={data.confirmationUrl}
          color={urgency.buttonColor}
        >
          {urgency.buttonLabel}
        </PrimaryButton>
      </Section>

      <BrandFooter />
    </EmailLayout>
  );
}

export async function renderHtml(data: SpotDeadlineEmailData): Promise<string> {
  return await render(<SpotDeadline {...data} />);
}

export async function renderText(data: SpotDeadlineEmailData): Promise<string> {
  return await render(<SpotDeadline {...data} />, { plainText: true });
}

export default SpotDeadline;
