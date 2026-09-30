/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        campus: {
          bg: "#07090B",
          surface: "#0D1013",
          card: "#14181C",
          elevated: "#181D22",
          border: "rgba(255, 255, 255, 0.08)",
          borderSolid: "#252B31",
          borderHover: "rgba(255, 255, 255, 0.15)",
          gold: "#D6A84F",
          goldLight: "#F0C86A",
          goldMuted: "#8F7030",
          text: "#F3F4F6",
          secondary: "#A7ADB5",
          muted: "#6F7781",
          success: "#10B981",
          warning: "#F59E0B",
          danger: "#EF4444",
          error: "#EF4444",
          info: "#3B82F6"
        }
      },
      borderRadius: {
        DEFAULT: "4px",
        sm: "3px",
        md: "4px",
        lg: "6px",
        xl: "8px"
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "sans-serif"
        ],
        mono: [
          '"JetBrains Mono"',
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'elevated': '0 8px 24px -4px rgba(0, 0, 0, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'gold-glow': '0 0 25px -5px rgba(214, 168, 79, 0.15)',
        'gold-glow-subtle': '0 0 15px -3px rgba(214, 168, 79, 0.08)'
      }
    },
  },
  plugins: [],
}
