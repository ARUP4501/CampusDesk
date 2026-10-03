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
          // Centralized Hierarchy Tokens:
          // BACKGROUND: #0A0A0A (Dark) / #FAF3E1 (Light)
          // RAIL: #080808 (Dark) / #F5E7C6 (Light)
          // SECONDARY: #101010 (Dark) / #F5E7C6 (Light)
          // ELEVATED: #141414 (Dark) / #EDE1C4 (Light)
          // ACCENT: #FF6D1F (Electric Tangerine)
          bg: "var(--bg-main)",
          black: "var(--bg-main)",
          rail: "var(--bg-rail)",
          dark: "var(--bg-secondary)",
          darker: "var(--bg-rail)",
          charcoal: "var(--bg-elevated)",
          charcoalLight: "var(--bg-hover)",
          surface: "var(--bg-surface)",
          surfaceWarm: "var(--bg-elevated)",
          surfaceDark: "var(--bg-secondary)",
          card: "var(--bg-card)",
          cardHover: "var(--bg-hover)",
          elevated: "var(--bg-elevated)",
          border: "var(--border-subtle)",
          borderHover: "var(--border-focus)",
          borderLight: "var(--border-medium)",
          linen: "#FAF3E1",
          cotton: "#F5E7C6",
          orange: "#FF6D1F",
          accent: "#FF6D1F",
          accentLight: "#FF8A47",
          accentDark: "#E05307",
          btnPrimary: "#FF6D1F",
          btnHover: "#FF8238",
          text: "var(--text-primary)",
          textLight: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
          success: "#34D399",
          warning: "#FBBF24",
          danger: "#F87171",
          error: "#F87171",
          info: "#60A5FA"
        }
      },
      borderRadius: {
        DEFAULT: "10px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "18px",
        '2xl': "22px",
        '3xl': "26px",
        full: "9999px"
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "sans-serif"
        ],
        mono: [
          '"JetBrains Mono"',
          '"SF Mono"',
          "ui-monospace",
          "monospace"
        ]
      },
      boxShadow: {
        'subtle': '0 2px 8px 0 rgba(0, 0, 0, 0.35)',
        'elevated': '0 12px 32px -4px rgba(0, 0, 0, 0.55)',
        'panel': '0 4px 20px rgba(0, 0, 0, 0.40)',
        'orange-glow': '0 0 24px rgba(255, 109, 31, 0.25)',
        'tangerine': '0 4px 16px rgba(255, 109, 31, 0.30)'
      }
    },
  },
  plugins: [],
}
