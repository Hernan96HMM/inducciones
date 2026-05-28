import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sica: {
          navy:  '#2E4272',
          blue:  '#1A9AD6',
          white: '#FFFFFF',
          light: '#F4F6F9',
          muted: '#8A9BBE',
          dark:  '#1A2A4A',
        },
      },
      fontFamily: {
        barlow:   ['Barlow Condensed', 'sans-serif'],
        inter:    ['Inter', 'sans-serif'],
        mono:     ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
