import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: parseInt(process.env.PORT || "8080"), // Use Railway's dynamic port
    hmr: {
      // Fix WebSocket connection for HMR
      clientPort: parseInt(process.env.PORT || "8080"),
      host: 'localhost',
    },
    headers: {
      // Security headers for development
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Optimize build output
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
    },
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize chunk splitting - keep vendor dependencies together to avoid load order issues
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // All vendor dependencies in one chunk to ensure proper load order
          // React and React-dependent packages must load together
          if (id.includes('node_modules')) {
            return 'vendor';
          }
          // App-specific lazy-loaded chunks (these import from vendor, so load order is safe)
          if (id.includes('/mobile/') || id.includes('MobileFormWizard') ||
              id.includes('MobileFormSection') || id.includes('MobileDatePicker') ||
              id.includes('MobileSelect') || id.includes('useMobileLayout') ||
              id.includes('useSwipeGesture') || id.includes('usePullToRefresh') ||
              id.includes('AddToHomeScreen') || id.includes('CreateEventFormMobile')) {
            return 'mobile';
          }
          if (id.includes('/pwa/') || id.includes('pwaService')) {
            return 'pwa';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          // Sanitize filename to remove invalid characters (colon, quotes, <, >, |, *, ?, \r, \n)
          const sanitized = facadeModuleId.replace(/[:"<>|*?\r\n]/g, '-');
          return `assets/js/${sanitized}-[hash].js`;
        },
        // Optimize asset file names for caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? ['asset'];
          const ext = info[info.length - 1];
          // Images get their own directory
          if (/\.(png|jpe?g|svg|gif|webp|avif|ico)$/i.test(assetInfo.name ?? '')) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          // Fonts
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name ?? '')) {
            return `assets/fonts/[name]-[hash].${ext}`;
          }
          // CSS
          if (ext === 'css') {
            return `assets/css/[name]-[hash].${ext}`;
          }
          return `assets/[name]-[hash].${ext}`;
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Better tree shaking
    reportCompressedSize: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react',
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ]
  },
  // Asset optimization
  assetsInclude: ['**/*.webp', '**/*.avif'],
}));
