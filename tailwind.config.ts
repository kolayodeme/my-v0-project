import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        shine: {
          "0%": { transform: "translateX(-100%) skewX(-15deg)" },
          "100%": { transform: "translateX(200%) skewX(-15deg)" }
        },
        "shine-slow": {
          "0%": { transform: "translateX(-100%) skewX(-15deg)" },
          "100%": { transform: "translateX(200%) skewX(-15deg)" }
        },
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-5px)" },
          "100%": { transform: "translateY(0px)" }
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        tilt: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" }
        },
        "scale-up": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" }
        },
        "border-glow": {
          "0%": { borderColor: "rgba(74,222,128,0.2)" },
          "50%": { borderColor: "rgba(74,222,128,0.5)" },
          "100%": { borderColor: "rgba(74,222,128,0.2)" }
        },
        "border-glow-orange": {
          "0%": { borderColor: "rgba(251,146,60,0.3)", boxShadow: "0 0 10px rgba(251,146,60,0.2)" },
          "50%": { borderColor: "rgba(251,146,60,0.6)", boxShadow: "0 0 20px rgba(251,146,60,0.4)" },
          "100%": { borderColor: "rgba(251,146,60,0.3)", boxShadow: "0 0 10px rgba(251,146,60,0.2)" }
        },
        "border-glow-green": {
          "0%": { borderColor: "rgba(34,197,94,0.3)", boxShadow: "0 0 10px rgba(34,197,94,0.2)" },
          "50%": { borderColor: "rgba(34,197,94,0.6)", boxShadow: "0 0 20px rgba(34,197,94,0.4)" },
          "100%": { borderColor: "rgba(34,197,94,0.3)", boxShadow: "0 0 10px rgba(34,197,94,0.2)" }
        },
        neon: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" }
        },
        spin: {
          "from": { transform: "rotate(0deg)" },
          "to": { transform: "rotate(360deg)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        shine: "shine 1.5s ease-in-out infinite",
        "shine-slow": "shine-slow 3s ease-in-out infinite",
        float: "float 3s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
        tilt: "tilt 10s ease-in-out infinite",
        "scale-up": "scale-up 2s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite"
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-shimmer': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        'gradient-fade': 'linear-gradient(to right, transparent, var(--tw-gradient-stops), transparent)',
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
        'gradient-shine': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
        'neon-glow': 'radial-gradient(circle at 50% 50%, var(--tw-gradient-stops))',
        'neon-pulse': 'radial-gradient(circle at 50% 120%, var(--tw-gradient-stops))'
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
