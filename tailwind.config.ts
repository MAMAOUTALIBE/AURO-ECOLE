import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      // Point de rupture pour les très grands écrans (au-delà du 2xl=1536px de Tailwind).
      screens: {
        "3xl": "1920px"
      },
      colors: {
        loden: {
          50: "#ecfeff",
          100: "#cffafe",
          200: "#a5f3fc",
          300: "#67e8f9",
          400: "#22d3ee",
          500: "#08AEB8",
          600: "#0891a0",
          700: "#0e7490",
          800: "#155e75",
          900: "#164e63",
          ink: "#142126",
          muted: "#64747a",
          fog: "#f5f8f8",
          pearl: "#fbfdfc",
          petrol: "#e7f4f3"
        }
      },
      boxShadow: {
        premium: "0 24px 80px rgba(20, 33, 38, 0.10)",
        soft: "0 14px 40px rgba(20, 33, 38, 0.08)"
      },
      borderRadius: {
        "2xl": "1.25rem"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
