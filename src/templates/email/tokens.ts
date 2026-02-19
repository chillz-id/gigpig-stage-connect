/**
 * Email Design Tokens
 *
 * Follows the Stripe/Vercel/Linear pattern: restrained palette,
 * one accent color, greyscale everything else.
 */

export const colors = {
  brand: {
    primary: '#635BFF',      // Indigo — buttons, links, accents only
    primaryDark: '#5851DB',  // Hover/dark mode variant
  },
  status: {
    success: '#16A34A',
    successBg: '#F0FDF4',
    warning: '#D97706',
    warningBg: '#FFFBEB',
    urgent: '#DC2626',
    urgentBg: '#FEF2F2',
    info: '#2563EB',
    infoBg: '#EFF6FF',
  },
  neutral: {
    white: '#FFFFFF',
    offWhite: '#F6F9FC',     // Stripe's signature background
    border: '#EAEAEA',       // Vercel's border color
    muted: '#8898AA',        // Labels, metadata
    body: '#525F7F',         // Body text — Stripe's exact color
    heading: '#1A1A2E',      // Headlines
    footer: '#9CA3AF',       // Footer text
  },
} as const;

export const fonts = {
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

export const businessInfo = {
  companyName: 'Stand Up Sydney',
  abn: '33 614 240 328',
  contactEmail: 'hello@standupsydney.com',
  websiteUrl: 'https://standupsydney.com',
  privacyUrl: 'https://standupsydney.com/privacy',
} as const;
