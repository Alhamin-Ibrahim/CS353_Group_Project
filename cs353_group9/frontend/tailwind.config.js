/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // includes CSS files so @apply in .css files is scanned
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}