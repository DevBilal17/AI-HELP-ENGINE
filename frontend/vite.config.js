import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    lib: {
      entry: './src/widget-entry.jsx', // Custom entry point
      name: 'ITHelpDeskWidget',
      fileName: () => 'it-helpdesk-widget.js',
      formats: ['umd'], 
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'it-helpdesk-widget.css';
          }
          return assetInfo.name;
        },
      },
    },
  },
})