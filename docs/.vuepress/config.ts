import { defineUserConfig } from 'vuepress'
import { defaultTheme } from '@vuepress/theme-default'
import { viteBundler } from '@vuepress/bundler-vite'

export default defineUserConfig({
  lang: 'fr-FR',
  title: 'FILM-IA Docs',
  description: 'Documentation interne pour la plateforme Moovies par IA',
  base: process.env.BASE || '/',
  head: [
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    ['meta', { name: 'theme-color', content: '#111827' }],
  ],
  theme: defaultTheme({
    docsDir: 'docs',
    editLink: false,
    lastUpdated: false,
    contributors: false,
    navbar: [
      { text: 'Accueil', link: '/' },
    ],
    sidebar: false,
  }),
  bundler: viteBundler({
  }),
  // Expose auth endpoints at build-time for the AuthGate component.
  define: {
    __AUTH_ORIGIN__: process.env.VITE_AUTH_ORIGIN || 'https://auth.keyops.fr',
    __AUTH_PATH__: process.env.VITE_AUTH_PATH || '/api/auth',
  },
})
