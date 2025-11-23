/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#050505',
          surface: '#0A0A0A',
          border: '#1F1F1F',
        },
        gold: {
          DEFAULT: '#FFD700',
          dim: '#B8860B',
          glow: 'rgba(255, 215, 0, 0.5)',
        },
        psy: {
          purple: '#9D00FF', // Architect
          blue: '#00E0FF',   // Debugger
          green: '#00FF94',  // Tester
          red: '#FF0055',    // Error
        }
      },
      fontFamily: {
        header: ['Cinzel', 'serif'],
        ui: ['Outfit', 'sans-serif'],
        code: ['Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(255, 215, 0, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), 0 0 10px rgba(255, 215, 0, 0.4)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
