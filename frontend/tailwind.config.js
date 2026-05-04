/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Disco-derived palette
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#1A1A1A",
          muted: "#5A5A5A",
          subtle: "#A0A0A0",
        },
        canvas: {
          DEFAULT: "#F8F9FB",
          raised: "#FFFFFF",
          sunk: "#F1F2F5",
        },
        line: {
          DEFAULT: "#E6E8EC",
          soft: "#EFF1F4",
        },
        // Brand gradient stops (purple -> blue)
        brand: {
          purple: "#7B5CFF",
          blue: "#3B82F6",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5.5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.025em", fontWeight: "800" }],
        "display-lg": ["clamp(2rem, 4vw, 2.75rem)", { lineHeight: "1.08", letterSpacing: "-0.022em", fontWeight: "800" }],
        "display":    ["1.75rem", { lineHeight: "1.15", letterSpacing: "-0.02em", fontWeight: "700" }],
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #7B5CFF 0%, #3B82F6 100%)",
        "brand-gradient-soft": "linear-gradient(135deg, rgba(123,92,255,0.08) 0%, rgba(59,130,246,0.08) 100%)",
        "dot-grid": "radial-gradient(circle, #D8DCE3 1px, transparent 1px)",
      },
      boxShadow: {
        "brand": "0 4px 24px -4px rgba(123, 92, 255, 0.25)",
        "brand-strong": "0 8px 32px -4px rgba(123, 92, 255, 0.4)",
        "card": "0 1px 2px rgba(10,10,10,0.04), 0 0 0 1px rgba(10,10,10,0.04)",
        "card-raised": "0 4px 16px -2px rgba(10,10,10,0.06), 0 0 0 1px rgba(10,10,10,0.04)",
        "input-focus": "0 0 0 4px rgba(123,92,255,0.12)",
      },
      borderRadius: {
        "pill": "9999px",
        "card": "16px",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 300ms ease-out",
        "slide-up": "slideUp 400ms cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
