/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        panel: "0 20px 45px rgba(15, 23, 42, 0.35)"
      },
      animation: {
        pulseGlow: "pulseGlow 2.6s ease-in-out infinite"
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(16, 185, 129, 0)" },
          "50%": { boxShadow: "0 0 24px rgba(16, 185, 129, 0.28)" }
        }
      }
    }
  },
  plugins: []
};
