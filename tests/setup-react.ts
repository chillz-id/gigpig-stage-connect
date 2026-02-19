import '@testing-library/jest-dom';

// Mock for Web APIs not available in jsdom
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock import.meta for Jest (Vite uses this, but Node.js/Jest doesn't support it)
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://test.supabase.co',
        VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'test-anon-key',
        VITE_APP_URL: process.env.VITE_APP_URL || 'http://localhost:8080',
        MODE: 'test',
        DEV: false,
        PROD: false,
      },
    },
  },
  configurable: true,
});