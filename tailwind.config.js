/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
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
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "player": {
          "0%, 100%": { 
            transform: "translate(0, 0)",
            animationTimingFunction: "ease-in-out"
          },
          "25%": { 
            transform: "translate(15px, -10px)",
            animationTimingFunction: "ease-in"
          },
          "50%": { 
            transform: "translate(5px, 5px)",
            animationTimingFunction: "ease-out"
          },
          "75%": { 
            transform: "translate(-10px, -5px)",
            animationTimingFunction: "ease-in"
          }
        },
        "player-reverse": {
          "0%, 100%": { 
            transform: "translate(0, 0)",
            animationTimingFunction: "ease-in-out"
          },
          "25%": { 
            transform: "translate(-15px, 10px)",
            animationTimingFunction: "ease-in"
          },
          "50%": { 
            transform: "translate(-5px, -5px)",
            animationTimingFunction: "ease-out"
          },
          "75%": { 
            transform: "translate(10px, 5px)",
            animationTimingFunction: "ease-in"
          }
        },
        "goalkeeper": {
          "0%, 100%": { 
            transform: "translate(0, 0)",
            animationTimingFunction: "ease-in-out"
          },
          "25%": { 
            transform: "translate(0, -5px)",
            animationTimingFunction: "ease-in"
          },
          "50%": { 
            transform: "translate(0, 0)",
            animationTimingFunction: "ease-out"
          },
          "75%": { 
            transform: "translate(0, 5px)",
            animationTimingFunction: "ease-in"
          }
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        "spin-fast": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(720deg)" }
        },
        "slide-down": {
          "0%": { 
            transform: "translateY(-100%)",
            opacity: "0" 
          },
          "100%": { 
            transform: "translateY(0)",
            opacity: "1" 
          }
        },
        "sparkle": {
          "0%": { 
            transform: "scale(0) rotate(0deg)",
            opacity: "0" 
          },
          "50%": { 
            transform: "scale(1) rotate(180deg)",
            opacity: "0.9" 
          },
          "100%": { 
            transform: "scale(0) rotate(360deg)",
            opacity: "0" 
          }
        },
        "gold-shimmer": {
          "0%": {
            backgroundPosition: "0% 50%"
          },
          "50%": {
            backgroundPosition: "100% 50%"
          },
          "100%": {
            backgroundPosition: "0% 50%"
          }
        },
        "gold-pulse": {
          "0%, 100%": { 
            transform: "scale(1)",
            filter: "brightness(1)",
            opacity: "1" 
          },
          "50%": { 
            transform: "scale(1.1)",
            filter: "brightness(1.3)",
            opacity: "0.9" 
          }
        },
        "coin-flip": {
          "0%": { 
            transform: "rotateY(0deg) scale(1)"
          },
          "50%": { 
            transform: "rotateY(180deg) scale(1.2)"
          },
          "100%": { 
            transform: "rotateY(360deg) scale(1)"
          }
        },
        "gold-rain": {
          "0%": { 
            transform: "translateY(-20px) rotate(0deg)",
            opacity: "0" 
          },
          "50%": { 
            transform: "translateY(0) rotate(180deg)",
            opacity: "1" 
          },
          "100%": { 
            transform: "translateY(20px) rotate(360deg)",
            opacity: "0" 
          }
        },
        "pulse-slow": {
          "0%, 100%": { 
            transform: "scale(1)",
            opacity: "1" 
          },
          "50%": { 
            transform: "scale(1.1)",
            opacity: "0.8" 
          }
        },
        "pass": {
          "0%": { 
            transform: "translate(0, 0) scale(1)",
            opacity: "1"
          },
          "50%": { 
            transform: "translate(var(--pass-x), var(--pass-y)) scale(0.8)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "translate(calc(var(--pass-x) * 2), calc(var(--pass-y) * 2)) scale(1)",
            opacity: "1"
          }
        },
        "shot": {
          "0%": { 
            transform: "scale(1) translateX(0)",
            opacity: "1"
          },
          "50%": { 
            transform: "scale(0.8) translateX(-40px)",
            opacity: "0.8"
          },
          "100%": { 
            transform: "scale(1.5) translateX(-80px)",
            opacity: "0"
          }
        },
        "ping-fast": {
          "0%": {
            transform: "scale(0.2)",
            opacity: "1"
          },
          "80%, 100%": {
            transform: "scale(1.2)",
            opacity: "0"
          }
        },
        "ping-slow": {
          "0%": {
            transform: "scale(0.2)",
            opacity: "0.8"
          },
          "80%, 100%": {
            transform: "scale(1.5)",
            opacity: "0"
          }
        },
        "ping-slower": {
          "0%": {
            transform: "scale(0.2)",
            opacity: "0.6"
          },
          "80%, 100%": {
            transform: "scale(2)",
            opacity: "0"
          }
        },
        "bounce-text": {
          "0%, 100%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)"
          },
          "50%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)"
          }
        },
        "fade-in-out": {
          "0%": { opacity: 0 },
          "10%": { opacity: 1 },
          "90%": { opacity: 1 },
          "100%": { opacity: 0 }
        },
        "confetti": {
          "0%": { 
            transform: "translateY(0) rotate(0deg)",
            opacity: 1
          },
          "100%": { 
            transform: "translateY(100vh) rotate(720deg)",
            opacity: 0
          }
        },
        "goal-text": {
          "0%": {
            transform: "scale(0.1) rotate(-30deg)",
            opacity: 0
          },
          "50%": {
            transform: "scale(1.2) rotate(5deg)",
            opacity: 1
          },
          "100%": {
            transform: "scale(1) rotate(0deg)",
            opacity: 1
          }
        },
        "flash": {
          "0%, 100%": {
            opacity: 0
          },
          "50%": {
            opacity: 1
          }
        },
        'attack-trail': {
          '0%': { opacity: 0.2, transform: 'scaleX(0.7)' },
          '50%': { opacity: 0.7, transform: 'scaleX(1.1)' },
          '100%': { opacity: 0.2, transform: 'scaleX(0.7)' }
        },
        'burst': {
          '0%': { opacity: 0.7, transform: 'scale(0.7)' },
          '80%': { opacity: 0.2, transform: 'scale(1.5)' },
          '100%': { opacity: 0, transform: 'scale(2)' }
        },
        'attack-label': {
          '0%': { opacity: 0, transform: 'scale(0.7)' },
          '40%': { opacity: 1, transform: 'scale(1.1)' },
          '100%': { opacity: 1, transform: 'scale(1)' }
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "player": "player 5s infinite",
        "player-reverse": "player-reverse 5s infinite",
        "goalkeeper": "goalkeeper 3s infinite",
        "spin-slow": "spin-slow 8s linear infinite",
        "spin-fast": "spin-fast 2s linear infinite",
        "pass": "pass 0.8s ease-in-out forwards",
        "shot": "shot 0.6s ease-in-out forwards",
        "ping-fast": "ping-fast 1s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-slow": "ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ping-slower": "ping-slower 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "bounce-text": "bounce-text 1s ease-in-out infinite",
        "fade-in-out": "fade-in-out 3s ease-in-out forwards",
        "confetti": "confetti 3s ease-in-out forwards",
        "goal-text": "goal-text 1s ease-in-out forwards",
        "flash": "flash 0.5s ease-in-out infinite",
        "attack-trail": "attack-trail 1.5s ease-in-out infinite",
        "burst": "burst 1s ease-out forwards",
        "attack-label": "attack-label 0.5s ease-out forwards",
        "slide-down": "slide-down 0.5s ease-out forwards",
        "sparkle": "sparkle 2s ease-in-out infinite",
        "gold-shimmer": "gold-shimmer 3s ease-in-out infinite",
        "gold-pulse": "gold-pulse 2s ease-in-out infinite",
        "coin-flip": "coin-flip 4s ease-in-out infinite",
        "gold-rain": "gold-rain 3s ease-in-out infinite",
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
      },
      textShadow: {
        sm: '0 1px 2px var(--tw-shadow-color)',
        DEFAULT: '0 2px 4px var(--tw-shadow-color)',
        lg: '0 0 8px var(--tw-shadow-color), 0 0 16px var(--tw-shadow-color)'
      }
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        },
        '.text-shadow-md': {
          textShadow: '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.5)'
        },
        '.text-shadow-lg': {
          textShadow: '0 8px 16px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.6)'
        },
        '.text-shadow-none': {
          textShadow: 'none'
        }
      }
      addUtilities(newUtilities)
    }
  ]
} 