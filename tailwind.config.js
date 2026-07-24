/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#0A0A10',
        floor: '#141220',
        uv: '#8B5CF6',
        strobe: '#22D3EE',
        'door-red': '#E23B5A',
        'paper-text': '#EDF8F5',
        muted: '#8A87A3',
      },
      fontFamily: {
        display: ['Archivo Black', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      borderRadius: {
        physical: '0px',
        interface: '12px',
      },
      backgroundImage: {
        'club-grid': 'linear-gradient(rgba(139,92,246,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,.06) 1px, transparent 1px)',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(600%)' },
        },
        pulseSeal: {
          '0%, 100%': { transform: 'scale(1) rotate(-4deg)', opacity: '1' },
          '50%': { transform: 'scale(1.05) rotate(3deg)', opacity: '.72' },
        },
      },
      animation: {
        scan: 'scan 2.5s linear infinite',
        'pulse-seal': 'pulseSeal 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
