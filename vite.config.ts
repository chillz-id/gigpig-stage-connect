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
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core libraries
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-core';
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          // Radix UI - Core (dialogs, dropdowns)
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-dropdown-menu')) {
            return 'ui-core';
          }
          // Radix UI - Forms (select, checkbox, etc.)
          if (id.includes('@radix-ui/react-select') || id.includes('@radix-ui/react-checkbox') ||
              id.includes('@radix-ui/react-radio') || id.includes('@radix-ui/react-switch')) {
            return 'ui-forms';
          }
          // Data fetching
          if (id.includes('@tanstack/react-query') || id.includes('@supabase/supabase-js')) {
            return 'data-fetching';
          }
          // Form validation
          if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('node_modules/zod')) {
            return 'form-validation';
          }
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          // Rich text editor
          if (id.includes('@tiptap/')) {
            return 'editor';
          }
          // Common utilities (excluding lucide-react which needs to be with react-core)
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'utils';
          }
          // Icon library - must be in same chunk as React to avoid forwardRef errors
          if (id.includes('node_modules/lucide-react')) {
            return 'react-core';
          }
          // Charts
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          // PDF generation
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'pdf';
          }
          // Mobile-specific components (separate chunk for lazy loading on mobile)
          if (id.includes('/mobile/') || id.includes('MobileFormWizard') ||
              id.includes('MobileFormSection') || id.includes('MobileDatePicker') ||
              id.includes('MobileSelect') || id.includes('useMobileLayout') ||
              id.includes('useSwipeGesture') || id.includes('usePullToRefresh') ||
              id.includes('AddToHomeScreen') || id.includes('CreateEventFormMobile')) {
            return 'mobile';
          }
          // PWA-specific components
          if (id.includes('/pwa/') || id.includes('pwaService')) {
            return 'pwa';
          }
          // Media/file handling
          if (id.includes('MediaLibraryManager') || id.includes('node_modules/browser-image-compression')) {
            return 'media';
          }
          // Keep other vendor chunks together
          if (id.includes('node_modules')) {
            return 'vendor';
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
