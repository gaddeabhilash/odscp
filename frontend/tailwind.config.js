/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          50: '#f8f7f5',
          100: '#efebdd',
          200: '#e1d7be',
          300: '#d0be97',
          400: '#bf9e69',
          500: '#b48a4c',
          600: '#a3723f',
          700: '#855635',
          800: '#6f4731',
          900: '#5a3b2a',
          950: '#342016',
        },
      }
    },
  },
  plugins: [],
}
