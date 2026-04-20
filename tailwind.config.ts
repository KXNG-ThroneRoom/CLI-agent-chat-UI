import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        ink: {
          950: "#07070b",
          900: "#0a0a0f",
          800: "#10111a",
          700: "#181a26",
          600: "#1f2232",
          500: "#2a2e44",
        },
        violet: {
          DEFAULT: "#6366f1",
          glow: "#818cf8",
          deep: "#4f46e5",
        },
        cyan: {
          DEFAULT: "#22d3ee",
          glow: "#67e8f9",
        },
        border: "rgba(255,255,255,0.08)",
        input: "rgba(255,255,255,0.06)",
        ring: "#6366f1",
        background: "#0a0a0f",
        foreground: "#e7e9f5",
        muted: {
          DEFAULT: "#151724",
          foreground: "#8b90a8",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        "pulse-border": {
          "0%, 100%": { borderColor: "rgba(99,102,241,0.6)" },
          "50%": { borderColor: "rgba(34,211,238,0.9)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 12px rgba(99,102,241,0.45)" },
          "50%": { boxShadow: "0 0 24px rgba(34,211,238,0.55)" },
        },
        "dot-pulse": {
          "0%, 80%, 100%": { opacity: "0.2", transform: "scale(0.8)" },
          "40%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "pulse-border": "pulse-border 2s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.35s ease-out",
        shimmer: "shimmer 2.5s linear infinite",
        glow: "glow 2.4s ease-in-out infinite",
        "dot-pulse": "dot-pulse 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
