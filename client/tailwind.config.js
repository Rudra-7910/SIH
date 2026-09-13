/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          page:          '#F4F6F9',
          surface:       '#FFFFFF',
          'surface-alt': '#F0F4F8',
          border:        '#D1D9E3',
          'border-strong':'#9AADBE',
          navy:          '#1A3A5C',
          'navy-dark':   '#0F2540',
          'navy-light':  '#2558A0',
          'navy-bg':     '#EBF3FB',
          saffron:       '#B45309',
          'saffron-border': '#D97706',
          'saffron-bg':  '#FEF3C7',
          pass:          '#15803D',
          'pass-bg':     '#F0FDF4',
          'pass-border': '#86EFAC',
          review:        '#92400E',
          'review-bg':   '#FFFBEB',
          'review-border':'#FCD34D',
          breach:        '#991B1B',
          'breach-bg':   '#FEF2F2',
          'breach-border':'#FECACA',
          text:          '#1A202C',
          'text-secondary': '#4A5568',
          'text-muted':  '#718096',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Noto Sans', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'label': ['11px', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        'cite':  ['10px', { lineHeight: '1.4', fontStyle: 'italic' }],
      },
      boxShadow: {
        'gov': '0 1px 3px rgba(0,0,0,0.08)',
        'gov-md': '0 2px 6px rgba(0,0,0,0.10)',
      },
      borderRadius: {
        'gov': '4px',
        'badge': '2px',
      },
    },
  },
  plugins: [],
};
