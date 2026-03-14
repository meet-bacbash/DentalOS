import type { Config } from 'tailwindcss'

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#f7fbfb',
        primary: '#0D7377',
        amber: '#E8A317'
      },
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui']
      }
    },
  },
  plugins: [],
} satisfies Config
