import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['logo.png', 'vite.svg'],
      manifest: {
        name: 'Expense Tracker',
        short_name: 'Expenses',
        id: '/',
        scope: '/',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#070911',
        theme_color: '#6366f1',
        description: 'Premium Expense Tracker Application',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  server: {
    host: true
  }
})
