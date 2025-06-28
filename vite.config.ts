import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::", // Listen on all interfaces (important for Railway)
    port: 3000,  // Changed from 8080 to 3000 to avoid conflict with code-server
    strictPort: true, // Exit if port is already in use
    hmr: {
      port: 3001, // Use different port for HMR to avoid conflicts
    },
    watch: {
      usePolling: true, // Better for Docker/Railway environments
      interval: 1000, // Check for changes every second
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
  // Optimize for Railway deployment
  build: {
    outDir: "dist",
    sourcemap: mode === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
  // Environment variable validation
  define: {
    __DEV__: mode === 'development',
  },
}));
