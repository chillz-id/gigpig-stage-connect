import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: parseInt(process.env.PORT || "8080"), // Use Railway's dynamic port
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
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'react-router': ['react-router-dom'],
          'ui-core': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'ui-forms': ['@radix-ui/react-select', '@radix-ui/react-checkbox'],
          'data-fetching': ['@tanstack/react-query', '@supabase/supabase-js'],
          'form-validation': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-utils': ['date-fns'],
          'editor': ['@tiptap/react', '@tiptap/starter-kit'],
          'utils': ['clsx', 'tailwind-merge', 'lucide-react'],
          'charts': ['recharts'],
          'pdf': ['jspdf', 'jspdf-autotable', 'html2canvas'],
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
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
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ]
  },
  // Asset optimization
  assetsInclude: ['**/*.webp', '**/*.avif'],
}));
