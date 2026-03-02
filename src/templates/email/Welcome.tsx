import * as React from 'react';
import { Text, Link, render } from '@react-email/components';
import {
  EmailLayout,
  BrandHeader,
  BrandFooter,
  PrimaryButton,
  SecondaryButton,
  ContentCard,
  AlertBox,
  Divider,
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

      <ContentCard padding="20px 48px">
        <Text style={{ fontSize: '16px', lineHeight: '1.6', color: colors.neutral.heading, margin: '0 0 16px 0', fontWeight: 500 }}>
          Hey {data.userName},
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.7', color: colors.neutral.body, margin: '0' }}>
          You're in! GigPigs connects comedians, promoters, photographers,
          and the wider comedy industry in one place.
        </Text>
        <Text style={{ fontSize: '15px', lineHeight: '1.7', color: colors.neutral.body, margin: '12px 0 0 0' }}>
          Find gigs, manage bookings, and grow your career — all from
          one platform.
        </Text>
      </ContentCard>

      <Divider />

      <AlertBox variant="info">
        You've joined as a <strong>{roleLabel}</strong>.
      </AlertBox>

      <ContentCard padding="16px 48px">
        <Text style={{ fontSize: '13px', fontWeight: 600, color: colors.neutral.muted, margin: '0 0 12px 0', textTransform: 'uppercase' as const, letterSpacing: '0.5px' }}>
          Getting Started
        </Text>
        {steps.map((step, index) => (
          <Text
            key={index}
            style={{ fontSize: '15px', lineHeight: '1.7', color: colors.neutral.body, margin: '0 0 12px 0' }}
          >
            <span style={{ display: 'inline-block', width: '24px', fontWeight: 700, color: colors.brand.primary }}>{index + 1}.</span>
            {step}
          </Text>
        ))}
      </ContentCard>

      <PrimaryButton href={data.dashboardUrl}>
        Go to My Dashboard
      </PrimaryButton>
      <SecondaryButton href={data.profileUrl}>View My Profile</SecondaryButton>

      <Divider />

      <ContentCard padding="20px 48px 24px 48px">
        <Text style={{ fontSize: '14px', lineHeight: '1.6', color: colors.neutral.muted, margin: '0', textAlign: 'center' as const }}>
          Questions? Reach out at{' '}
          <Link
            href="mailto:team@gigpigs.app"
            style={{ color: colors.brand.primary, textDecoration: 'none' }}
          >
            team@gigpigs.app
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

export async function renderHtml(data: WelcomeEmailData): Promise<string> {
  return await render(<Welcome {...data} />);
}

export async function renderText(data: WelcomeEmailData): Promise<string> {
  return await render(<Welcome {...data} />, { plainText: true });
}

export default Welcome;
