/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        railway: {
          navy: "#0a192f",
          blue: "#1e3a8a",
          dark: "#0f172a",
          card: "#1e293b",
          border: "#334155",
          accent: "#38bdf8",
          track: "#10b981",    // Engineering / Track Green
          ohe: "#f59e0b",      // TRD / OHE Amber
          signal: "#8b5cf6",   // S&T Purple
          emergency: "#ef4444" // Emergency Red
        }
      }
    },
  },
  plugins: [],
}
