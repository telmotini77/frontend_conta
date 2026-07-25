/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        text: {
          primary: '#020617',   // Very dark (oscurísimo)
          secondary: '#0f172a', // Also very dark
          muted: '#1e293b',
        }
      }
    },
  },
  plugins: [],
}
