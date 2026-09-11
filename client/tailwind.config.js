/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#0B132B',
          alt: '#0F172A',
        },
        lmed: {
          card: '#162238',
          elevated: '#1A2744',
          border: '#2B3D5E',
          navy: '#1C3D5A',
          blue: '#1E3A8A',
          saffron: '#D97706',
          'saffron-dark': '#B45309',
          pass: '#047857',
          review: '#B45309',
          breach: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'IBM Plex Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      maxWidth: {
        desk: '1600px',
      },
    },
  },
  plugins: [],
};
