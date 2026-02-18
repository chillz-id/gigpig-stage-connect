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

export interface DeadlineReminderEmailData {
  comedianName: string;
  spotType: string;
  eventName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  hoursRemaining: number;
  confirmationUrl: string;
  deadline: string;
  newDeadline?: string;
  reason?: string;
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

const sectionHeading: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 700,
  color: colors.neutral.mediumGray,
  textTransform: 'uppercase' as const,
  letterSpacing: '1.5px',
  margin: '0 0 12px 0',
};

const previewProps: DeadlineReminderEmailData = {
  comedianName: 'Jane Smith',
  spotType: '10-minute Set',
  eventName: 'Friday Night Comedy at ID Comedy Club',
  eventDate: '2026-03-06T19:30:00',
  eventTime: '7:30 PM',
  venue: 'ID Comedy Club',
  hoursRemaining: 24,
  confirmationUrl: 'https://standupsydney.com/confirm/abc123',
  deadline: '2026-03-04T17:00:00',
  newDeadline: '2026-03-05T17:00:00',
  reason: 'Scheduling conflict resolved.',
};

// ---------------------------------------------------------------------------
// 24-hour reminder
// ---------------------------------------------------------------------------

export function DeadlineReminder24Hour(data: DeadlineReminderEmailData = previewProps) {
  return (
    <EmailLayout previewText={`24 hours to confirm your ${data.spotType} spot at ${data.eventName}`}>
      <BrandHeader
        title="Reminder"
        subtitle="Confirm your spot — 24 hours left"
        backgroundColor={colors.status.info}
      />

      <ContentCard>
        <Text style={{ margin: '0 0 12px 0', fontSize: '15px', lineHeight: '1.5' }}>
          Hey {data.comedianName},
        </Text>
        <Text style={{ margin: '0', fontSize: '15px', lineHeight: '1.6' }}>
          Just a heads up — you have <strong>24 hours</strong> to confirm your{' '}
          <strong>{data.spotType}</strong> spot. Don't miss out!
        </Text>
      </ContentCard>

      <ContentCard>
        <Text style={sectionHeading}>Event Details</Text>
        <DetailRow label="Event" value={data.eventName} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Venue" value={data.venue} />
      </ContentCard>

      <Section style={{ backgroundColor: colors.neutral.white, borderBottom: `1px solid ${colors.neutral.lightGray}` }}>
        <PrimaryButton href={data.confirmationUrl} color={colors.status.info}>
          Confirm My Spot
        </PrimaryButton>
      </Section>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// 6-hour reminder (urgent)
// ---------------------------------------------------------------------------

export function DeadlineReminder6Hour(data: DeadlineReminderEmailData = { ...previewProps, hoursRemaining: 6 }) {
  return (
    <EmailLayout previewText={`URGENT: Only ${data.hoursRemaining} hours left to confirm — ${data.eventName}`}>
      <BrandHeader
        title="Time Running Out"
        subtitle={`Only ${data.hoursRemaining} hours left`}
        backgroundColor={colors.status.warning}
      />

      <AlertBox variant="warning">
        <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
          <strong>Only {data.hoursRemaining} hours remaining</strong> to confirm your{' '}
          {data.spotType} spot. Act now to avoid losing it.
        </Text>
      </AlertBox>

      <ContentCard>
        <Text style={sectionHeading}>Event Details</Text>
        <DetailRow label="Event" value={data.eventName} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Venue" value={data.venue} />
      </ContentCard>

      <Section style={{ backgroundColor: colors.neutral.white, borderBottom: `1px solid ${colors.neutral.lightGray}` }}>
        <PrimaryButton href={data.confirmationUrl} color={colors.status.warning}>
          Confirm Now
        </PrimaryButton>
      </Section>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// 1-hour reminder (final notice)
// ---------------------------------------------------------------------------

export function DeadlineReminder1Hour(data: DeadlineReminderEmailData = { ...previewProps, hoursRemaining: 1 }) {
  return (
    <EmailLayout previewText={`FINAL NOTICE: Last chance to confirm your spot at ${data.eventName}`}>
      <BrandHeader
        title="Final Notice"
        subtitle="This is your last chance to confirm"
        backgroundColor={colors.status.urgent}
      />

      <AlertBox variant="urgent">
        <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
          <strong>This is your final notice.</strong> Your {data.spotType} spot will be
          automatically released if you do not confirm immediately.
        </Text>
      </AlertBox>

      <ContentCard>
        <Text style={sectionHeading}>Event Details</Text>
        <DetailRow label="Event" value={data.eventName} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Venue" value={data.venue} />
      </ContentCard>

      <Section style={{ backgroundColor: colors.neutral.white, borderBottom: `1px solid ${colors.neutral.lightGray}` }}>
        <PrimaryButton href={data.confirmationUrl} color={colors.status.urgent}>
          Confirm Now — Last Chance
        </PrimaryButton>
      </Section>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Extended deadline (positive)
// ---------------------------------------------------------------------------

export function DeadlineReminderExtended(data: DeadlineReminderEmailData = previewProps) {
  return (
    <EmailLayout previewText={`Good news: Your confirmation deadline has been extended for ${data.eventName}`}>
      <BrandHeader
        title="Good News!"
        subtitle="Your deadline has been extended"
        backgroundColor={colors.status.success}
      />

      <AlertBox variant="success">
        <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.5' }}>
          Your deadline has been extended to{' '}
          <strong>{data.newDeadline ? formatDate(data.newDeadline) : 'a new date'}</strong>.
        </Text>
      </AlertBox>

      {data.reason ? (
        <ContentCard accentColor={colors.status.success}>
          <Text style={{ ...sectionHeading, color: colors.status.success }}>
            Reason for Extension
          </Text>
          <Text style={{ margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
            {data.reason}
          </Text>
        </ContentCard>
      ) : null}

      <ContentCard>
        <Text style={sectionHeading}>Event Details</Text>
        <DetailRow label="Event" value={data.eventName} highlight />
        <DetailRow label="Date" value={formatDate(data.eventDate)} />
        <DetailRow label="Time" value={formatTime(data.eventDate)} />
        <DetailRow label="Venue" value={data.venue} />
      </ContentCard>

      <Section style={{ backgroundColor: colors.neutral.white, borderBottom: `1px solid ${colors.neutral.lightGray}` }}>
        <PrimaryButton href={data.confirmationUrl} color={colors.status.success}>
          Confirm My Spot
        </PrimaryButton>
      </Section>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export async function render24HourHtml(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminder24Hour {...data} />);
}

export async function render24HourText(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminder24Hour {...data} />, { plainText: true });
}

export async function render6HourHtml(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminder6Hour {...data} />);
}

export async function render6HourText(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminder6Hour {...data} />, { plainText: true });
}

export async function render1HourHtml(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminder1Hour {...data} />);
}

export async function render1HourText(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminder1Hour {...data} />, { plainText: true });
}

export async function renderExtendedHtml(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminderExtended {...data} />);
}

export async function renderExtendedText(data: DeadlineReminderEmailData): Promise<string> {
  return await render(<DeadlineReminderExtended {...data} />, { plainText: true });
}

export default DeadlineReminder24Hour;
