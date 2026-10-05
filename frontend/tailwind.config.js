/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#0284C7', hover: '#0369A1', soft: '#E0F2FE' },
        navy: '#0F172A',
        success: { DEFAULT: '#10B981', soft: '#ECFDF5' },
        neutral: '#64748B'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Plus Jakarta Sans', 'sans-serif']
      }
    },
  },
  plugins: [],
};
