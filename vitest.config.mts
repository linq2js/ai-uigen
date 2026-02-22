import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      'server-only': `${__dirname}/src/__mocks__/server-only.ts`,
      '@/lib/prisma': `${__dirname}/src/__mocks__/prisma.ts`,
    },
  },
  test: {
    environment: 'jsdom',
  },
})