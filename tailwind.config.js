/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f0f11",
          raised: "#18181c",
          overlay: "#222228",
          border: "#2e2e38",
        },
        accent: {
          DEFAULT: "#e8ff47",
          dim: "#b8cc2a",
          glow: "rgba(232,255,71,0.15)",
        },
        text: {
          primary: "#f0f0f5",
          secondary: "#9090a8",
          muted: "#55556a",
        },
        danger: "#ff4757",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Fira Code'", "monospace"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        glow: "0 0 12px rgba(232,255,71,0.25)",
        card: "0 2px 8px rgba(0,0,0,0.4)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
