import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

const serverEnv = dotenv.config({ path: path.resolve(__dirname, '../Check_it_registry_back/.env') })
const backendPort = serverEnv.parsed?.PORT || process.env.PORT || '3006'
const backendUrl = `http://localhost:${backendPort}`

export default defineConfig({
  plugins: [react(),
    process.env.ANALYZE === 'true' ? visualizer({ open: true, gzipSize: true }) : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      'framer-motion': path.resolve(__dirname, 'node_modules/framer-motion/dist/cjs/index.js'),
    },
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules/@tsparticles')) return 'vendor-particles'
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons'
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
