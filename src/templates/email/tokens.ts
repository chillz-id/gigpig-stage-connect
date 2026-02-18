export const colors = {
  brand: {
    primary: '#667eea',
    primaryDark: '#5a67d8',
    secondary: '#764ba2',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    gradientDark: 'linear-gradient(135deg, #5a67d8 0%, #6b3fa0 100%)',
    accent: '#f6ad55', // warm amber accent for highlights
  },
  status: {
    success: '#38a169',
    successLight: '#c6f6d5',
    successBg: '#f0fff4',
    warning: '#dd6b20',
    warningLight: '#feebc8',
    warningBg: '#fffaf0',
    urgent: '#e53e3e',
    urgentLight: '#fed7d7',
    urgentBg: '#fff5f5',
    info: '#3182ce',
    infoLight: '#bee3f8',
    infoBg: '#ebf8ff',
  },
  neutral: {
    white: '#ffffff',
    offWhite: '#f7fafc',
    lightGray: '#e2e8f0',
    mediumGray: '#718096',
    darkGray: '#2d3748',
    nearBlack: '#1a202c',
  },
  darkMode: {
    background: '#1a202c',
    surface: '#2d3748',
    text: '#e2e8f0',
    muted: '#a0aec0',
  },
} as const;

export const fonts = {
  body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const businessInfo = {
  companyName: 'Stand Up Sydney',
  abn: '33 614 240 328',
  contactEmail: 'hello@standupsydney.com',
  websiteUrl: 'https://standupsydney.com',
  privacyUrl: 'https://standupsydney.com/privacy',
} as const;
