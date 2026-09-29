/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: "var(--bg-main)",
          card: "var(--bg-card)",
          text: "var(--text-main)",
          muted: "var(--text-muted)",
          border: "var(--border-color)",
          primary: "var(--primary-color)",
          primaryHover: "var(--primary-hover)",
          danger: "var(--danger-color)",
          warning: "var(--warning-color)",
          success: "var(--success-color)",
          accent: "var(--accent-color)"
        }
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "2px",
        md: "4px",
        lg: "6px",
        xl: "6px"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif"
        ]
      }
    },
  },
  plugins: [],
}
