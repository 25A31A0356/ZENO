/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        zeno: {
          bg: '#0c0e12',
          surface: '#151821',
          card: '#1b202c',
          border: '#2a3142',
          muted: '#8e9bb0',
          accent: '#06b6d4',
          glow: '#00f0ff',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          purple: '#8b5cf6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        lcd: ['"VT323"', 'monospace', 'Courier New'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 2s linear infinite',
        'soundwave': 'soundwave 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        soundwave: {
          '0%': { height: '8px' },
          '100%': { height: '40px' },
        }
      }
    },
  },
  plugins: [],
}
