/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'pogo-blue': '#0077BE',
        'pogo-blue-light': '#00A7E5',
        'pogo-cyan': '#00D4FF',
        'pogo-yellow': '#FFD700',
      },
      animation: {
        'gradient': 'gradientShift 15s ease infinite',
      },
      keyframes: {
        gradientShift: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
      },
    },
  },
  plugins: [],
}
