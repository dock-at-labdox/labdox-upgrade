import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces — deep blacks with a green-tinted elevation ramp
        void: "#050505",
        surface: "#0B0F0C",
        overlay: "#101511",
        hairline: "#1E2A20",

        // Phosphor green family (primary accent)
        phosphor: {
          DEFAULT: "#00FF41",
          dim: "#00C433",
          soft: "#0A3D1B",
          text: "#7CFFA0",
        },

        // Electric blue family (Blue Pill identity — DEC-041)
        electric: {
          DEFAULT: "#00A6FF",
          dim: "#0077C2",
          soft: "#062B40",
        },

        // Crimson family (Red Pill identity — DEC-041; not phosphor)
        crimson: {
          DEFAULT: "#FF2B2B",
          dim: "#C41E1E",
          soft: "#3A0A0A",
        },

        // Text
        ink: "#E8F0E9",
        "ink-dim": "#9DB3A2",

        // Signals (unchanged semantics)
        success: "#3FA46A",
        error: "#FF5C5C",
      },
      fontFamily: {
        mono: ["var(--font-jetbrains)", "JetBrains Mono", "ui-monospace", "monospace"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-green": "0 0 12px 0 rgba(0, 255, 65, 0.25)",
        "glow-blue": "0 0 12px 0 rgba(0, 166, 255, 0.25)",
        "glow-red": "0 0 12px 0 rgba(255, 43, 43, 0.28)",
      },
      keyframes: {
        "cursor-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "block-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scanline-sweep": {
          from: { transform: "translateY(-100%)" },
          to: { transform: "translateY(100vh)" },
        },
      },
      animation: {
        "cursor-blink": "cursor-blink 1.1s step-end infinite",
        "block-in": "block-in 250ms cubic-bezier(0.2, 0, 0, 1) both",
      },
    },
  },
  plugins: [],
} satisfies Config;
