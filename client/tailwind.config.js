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
          // Warm Palette:
          // BACKGROUND: #F9E6A8
          // DARK FONT / PRIMARY TEXT: #4D2A00
          // SECONDARY FONT / ACCENT TEXT: #CC6F00
          // PRIMARY BUTTON: #FDB773
          bg: "#F9E6A8",
          bgLight: "#FDF1C8",
          bgDark: "#EED78E",
          surface: "rgba(255, 250, 225, 0.58)",
          surfaceWarm: "rgba(253, 244, 214, 0.75)",
          surfaceDark: "rgba(77, 42, 0, 0.05)",
          card: "rgba(255, 252, 240, 0.52)",
          cardHover: "rgba(255, 255, 255, 0.85)",
          elevated: "rgba(255, 255, 255, 0.7)",
          border: "rgba(77, 42, 0, 0.08)",
          borderHover: "rgba(204, 111, 0, 0.30)",
          accent: "#CC6F00",
          accentLight: "#FDB773",
          accentDark: "#A65A00",
          btnPrimary: "#FDB773",
          btnHover: "#FED3A2",
          peach: "#FDB773",
          gold: "#CC6F00",
          goldLight: "#FDB773",
          text: "#4D2A00",
          textLight: "#4D2A00",
          secondary: "#6C420D",
          muted: "#8C581E",
          success: "#2E7D32",
          warning: "#CC6F00",
          danger: "#C62828",
          error: "#C62828",
          info: "#CC6F00"
        }
      },
      borderRadius: {
        DEFAULT: "12px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        '2xl': "24px",
        '3xl': "28px",
        full: "9999px"
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Text"',
          '"SF Pro Display"',
          "Inter",
          '"Segoe UI"',
          "Roboto",
          "sans-serif"
        ],
        serif: [
          '"Playfair Display"',
          '"Newsreader"',
          "Georgia",
          "Cambria",
          '"Times New Roman"',
          "serif"
        ],
        display: [
          '"Playfair Display"',
          '"Newsreader"',
          "Georgia",
          "serif"
        ],
        mono: [
          '"SF Mono"',
          '"JetBrains Mono"',
          "ui-monospace",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace"
        ]
      },
      boxShadow: {
        'subtle': '0 2px 10px 0 rgba(77, 42, 0, 0.04)',
        'elevated': '0 12px 36px -4px rgba(77, 42, 0, 0.08)',
        'glass': '0 10px 30px rgba(77, 42, 0, 0.06)',
        'navbar': '0 12px 40px rgba(77, 42, 0, 0.08)',
        'card': '0 4px 18px rgba(77, 42, 0, 0.05)',
        'btn': '0 3px 12px rgba(77, 42, 0, 0.08)',
        'btn-hover': '0 6px 18px rgba(77, 42, 0, 0.12)'
      }
    },
  },
  plugins: [],
}
