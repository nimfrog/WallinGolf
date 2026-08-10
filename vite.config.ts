/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
// Vid produktionsbygge (GitHub Pages) serveras appen under /WallinGolf/.
// Under `npm run dev` används roten (/) så att localhost fungerar som vanligt.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/WallinGolf/' : '/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
}));
