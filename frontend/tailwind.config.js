/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0d1117',
          surface: '#161b22',
          border: '#30363d',
          hover: '#21262d',
        },
        accent: {
          blue: '#58a6ff',
          green: '#3fb950',
          purple: '#bc8cff',
          orange: '#f0883e',
          red: '#f85149',
        }
      }
    },
  },
  plugins: [],
}
