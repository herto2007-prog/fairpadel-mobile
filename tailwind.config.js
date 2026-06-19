/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#df2531',
        background: '#0B0E14',
        card: '#151921',
        border: '#232838',
        dark: {
          100: '#1a1f2a',
          200: '#2d3444',
          300: '#3d4556',
        },
      },
    },
  },
  plugins: [],
};
