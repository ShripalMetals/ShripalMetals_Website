/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [ "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [react()],
  server: {
  host: '0.0.0.0',
  port: process.env.PORT || 4000,
  }
}

