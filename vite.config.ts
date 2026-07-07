import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// `base` matches the repo name so assets resolve when served from
// https://tagpro.github.io/roi/ via GitHub Pages.
export default defineConfig({
  base: '/roi/',
  plugins: [react()],
})
