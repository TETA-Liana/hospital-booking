/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eefbf8',
          100: '#d4f4ee',
          200: '#ade8de',
          300: '#79d5c8',
          400: '#45b9aa',
          500: '#279d8f',
          600: '#1c7e74',
          700: '#1a655e',
          800: '#19514c',
          900: '#194440',
          950: '#0a2725',
        },
        ink: {
          50: '#f5f6f7',
          100: '#e7e9ec',
          200: '#cbd0d8',
          300: '#a2abb8',
          400: '#727e91',
          500: '#556076',
          600: '#434c62',
          700: '#383f50',
          800: '#2f3444',
          900: '#292d3a',
          950: '#181a22',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
