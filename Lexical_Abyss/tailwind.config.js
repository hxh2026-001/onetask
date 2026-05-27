/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'pulse-fast': 'pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'burn': 'burn 2s ease-in-out infinite',
        'explode': 'explode 0.5s ease-out forwards',
        'glow': 'glow 1.5s ease-in-out infinite alternate',
        'flow': 'flow 2s linear infinite',
        'retreat': 'retreat 0.3s ease-out',
      },
      keyframes: {
        burn: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5', transform: 'scaleY(0.9)' },
        },
        explode: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 99, 71, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 99, 71, 0.8)' },
        },
        flow: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        retreat: {
          '0%': { backgroundColor: 'rgba(255, 0, 0, 0.8)' },
          '100%': { backgroundColor: 'rgba(255, 0, 0, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}
