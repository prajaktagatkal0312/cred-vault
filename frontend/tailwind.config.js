/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cv-bg': '#0B0D12',
        'cv-surface': '#14171F',
        'cv-redaction': '#1C1F27',
        'cv-accent': '#5B4FE0',
        'cv-success': '#3DDC84',
        'cv-pending': '#C98A3B',
        'cv-error': '#E0524F',
        'cv-text-primary': '#E8E9ED',
        'cv-text-secondary': '#8A8F9C',
        'cv-border': '#2A2E3A',
      },
      fontFamily: {
        'sans': ['"IBM Plex Sans"', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
        'hash': ['"IBM Plex Mono"', 'monospace'],
      },
      keyframes: {
        'redact-wipe': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(100%)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' }
        }
      },
      animation: {
        'redact-wipe': 'redact-wipe 0.6s cubic-bezier(0.8, 0, 0.2, 1) forwards',
        'shimmer': 'shimmer 2.5s infinite linear'
      }
    },
  },
  plugins: [],
}
