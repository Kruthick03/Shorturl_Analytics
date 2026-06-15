/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  safelist: [
    "bg-brand",
    "bg-brand-light",
    "bg-brand-dark",
    "hover:bg-brand-dark",
    "text-brand-dark",
    "border-brand",
    "focus:border-brand",
    "focus:ring-brand/10"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a", // Darker slate for premium contrast
        surface: "#f8fafc", // Modern soft background
        brand: {
          DEFAULT: "#10b981", // Emerald 500
          light: "#d1fae5",
          dark: "#047857"
        }
      },
      animation: {
        "fade-in-up": "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.3s ease-out forwards",
        "pulse-glow": "pulseGlow 2s infinite ease-in-out"
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)", filter: "drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))" }
        }
      }
    }
  },
  plugins: []
};
