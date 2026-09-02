import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3010,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Split out every npm package into its own chunk
            const packageName = id.toString().split('node_modules/')[1].split('/')[0].toString();

            // Group extremely tiny or related packages if necessary, but leaving them separate
            // maximizes cacheability and keeps chunk sizes tiny.
            return `vendor-${packageName}`;
          }
        }
      }
    }
  }
})
