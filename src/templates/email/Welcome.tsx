import * as React from 'react';
import { Text, Link, Hr, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  PrimaryButton,
  SecondaryButton,
  ContentCard,
  AlertBox,
} from './components';
import { colors } from './tokens';

// ---------------------------------------------------------------------------
// Data interface
// ---------------------------------------------------------------------------

export type ProfileType =
  | 'comedian'
  | 'photographer'
  | 'videographer'
  | 'manager'
  | 'organization';

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  profileType: ProfileType;
  dashboardUrl: string;
  profileUrl: string;
}

// ---------------------------------------------------------------------------
// Preview props
// ---------------------------------------------------------------------------

const previewProps: WelcomeEmailData = {
  userName: 'Jane Smith',
  userEmail: 'jane@example.com',
  profileType: 'comedian',
  dashboardUrl: 'https://gigpigs.app/dashboard',
  profileUrl: 'https://gigpigs.app/comedian/jane-smith',
};

// ---------------------------------------------------------------------------
// Role-specific getting started steps
// ---------------------------------------------------------------------------

const gettingStartedSteps: Record<ProfileType, string[]> = {
  comedian: [
    'Complete your comedian profile with bio and social links',
    'Upload a headshot so promoters can recognise you',
    'Browse upcoming shows and apply for spots',
  ],
  photographer: [
    'Complete your photographer profile and add your portfolio',
    'List the type of events you cover',
    'Connect with promoters looking for event photographers',
  ],
  videographer: [
    'Set up your videographer profile and add sample reels',
    'Specify your equipment and production capabilities',
    'Browse events looking for videography coverage',
  ],
  manager: [
    'Complete your manager profile and list your roster',
    'Add the comedians you represent',
    'Browse shows and submit booking requests on their behalf',
  ],
  organization: [
    'Set up your organisation profile with venue details',
    'Create your first event and publish it to the platform',
    'Invite comedians to apply or assign spots directly',
  ],
};

const roleLabels: Record<ProfileType, string> = {
  comedian: 'Comedian',
  photographer: 'Photographer',
  videographer: 'Videographer',
  manager: 'Manager',
  organization: 'Organisation',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function Welcome(props: WelcomeEmailData = previewProps) {
  // React Email dev server passes {} instead of undefined, so merge with defaults
  const data = { ...previewProps, ...props };
  const steps = gettingStartedSteps[data.profileType] ?? gettingStartedSteps.comedian;
  const roleLabel = roleLabels[data.profileType] ?? 'Comedian';

  return (
    <EmailLayout previewText={`Welcome to GigPigs, ${data.userName}!`}>
      <BrandHeader
        title="Welcome to GigPigs"
        subtitle="The comedy industry platform"
      />

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.heading, margin: '0 0 12px 0' }}>
          Hey {data.userName},
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          You're in. GigPigs connects comedians, promoters, photographers, and
          the wider comedy industry in one place — making it easier to find
          gigs, manage bookings, and grow your career.
        </Text>
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <AlertBox variant="info">
        You've joined as a <strong>{roleLabel}</strong>. Here's how to get started:
      </AlertBox>

      <ContentCard>
        {steps.map((step, index) => (
          <Text
            key={index}
            style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0 0 10px 0' }}
          >
            <span style={{ fontWeight: 600, color: colors.brand.primary }}>{index + 1}.</span>{' '}
            {step}
          </Text>
        ))}
      </ContentCard>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <PrimaryButton href={data.dashboardUrl}>
        Go to My Dashboard
      </PrimaryButton>
      <SecondaryButton href={data.profileUrl}>View My Profile</SecondaryButton>

      <Hr style={{ borderColor: colors.neutral.border, margin: '0 48px' }} />

      <ContentCard>
        <Text style={{ fontSize: '15px', lineHeight: '1.6', color: colors.neutral.body, margin: '0' }}>
          Questions or feedback? Reach out to us at{' '}
          <Link
            href="mailto:team@gigpigs.app"
            style={{ color: colors.brand.primary, textDecoration: 'none' }}
          >
            team@gigpigs.app
          </Link>
          {' '}— we'd love to hear from you.
        </Text>
      </ContentCard>

      <BrandFooter />
    </EmailLayout>
  );
}

// ---------------------------------------------------------------------------
// Render helpers
// ---------------------------------------------------------------------------

export async function renderHtml(data: WelcomeEmailData): Promise<string> {
  return await render(<Welcome {...data} />);
}

export async function renderText(data: WelcomeEmailData): Promise<string> {
  return await render(<Welcome {...data} />, { plainText: true });
}

export default Welcome;
