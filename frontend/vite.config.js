import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      include: "**/*.{jsx,js}"
    }),
  ],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
        ws: true,
        headers: {
          'Accept': 'application/json',
        },
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
            
            // Ensure headers are set correctly for API requests
            if (!req.headers['content-type']) {
              proxyReq.setHeader('Content-Type', 'application/json');
            }
            if (!req.headers['accept']) {
              proxyReq.setHeader('Accept', 'application/json');
            }
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
  },
  optimizeDeps: {
    include: ['react/jsx-runtime'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
// This configuration sets up Vite with React support and configures the server to run on port 5173. It also explicitly configures the JSX loader for .js files to resolve build errors related to JSX syntax processing.
