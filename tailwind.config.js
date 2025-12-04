/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#273C66',
        secondary: '#2DB4DE',
        accent: '#FBF8CC',
        neutral: '#FFFFFF',
      },
    },
  },
  plugins: [],
}

