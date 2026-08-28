/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef7ff',
          100: '#d7ebff',
          200: '#b5d8ff',
          300: '#86b9ff',
          400: '#4f8dff',
          500: '#2662ff',
          600: '#1f51db',
          700: '#1a42b3',
          800: '#173986',
          900: '#152f67'
        }
      }
    }
  },
  plugins: []
};
