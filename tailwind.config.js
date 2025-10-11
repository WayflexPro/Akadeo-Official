/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        akadeo: {
          primary: "#3056f5",
          secondary: "#1d3ed2",
          background: "#0f172a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "Inter", "system-ui"],
      },
    },
  },
  plugins: [],
};
