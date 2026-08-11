import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brandDark: "#050505",
        brandCard: "#0d0d14",
        purpleNeon: "#7C3AED",
        pinkNeon: "#EC4899",
        blueElectric: "#2563EB",
        greenNeon: "#22C55E",
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        'glow-purple': '0 0 25px rgba(124, 58, 237, 0.5), 0 0 50px rgba(124, 58, 237, 0.2)',
        'glow-pink': '0 0 25px rgba(236, 72, 153, 0.5), 0 0 50px rgba(236, 72, 153, 0.2)',
        'glow-green': '0 0 25px rgba(34, 197, 94, 0.5), 0 0 50px rgba(34, 197, 94, 0.2)',
        'glow-blue': '0 0 25px rgba(37, 99, 235, 0.5), 0 0 50px rgba(37, 99, 235, 0.2)',
      }
    },
  },
  plugins: [],
};
export default config;
