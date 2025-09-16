import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef9ff",
          100: "#d8f0ff",
          200: "#b5e4ff",
          300: "#84d3ff",
          400: "#4abbff",
          500: "#189bff",
          600: "#0f79e6",
          700: "#0f60b4",
          800: "#114f8e",
          900: "#123f6f"
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
