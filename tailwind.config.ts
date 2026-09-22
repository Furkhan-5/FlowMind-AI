import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bloom: {
          bg: "#eef0f5",
          card: "#ffffff",
          dark: "#16132a",
          darkCard: "#1f1b3a",
          accent: "#8b5cf6",
          purpleLight: "#e9d5ff",
          textDark: "#0f172a",
          textMuted: "#64748b",
          subtleBorder: "#e2e8f0",
        },
      },
      borderRadius: {
        '4xl': '32px',
        '3xl': '24px',
        '2xl': '16px',
      },
      boxShadow: {
        'bloom': '0 20px 40px -15px rgba(0, 0, 0, 0.05)',
        'bloom-lg': '0 25px 50px -12px rgba(22, 19, 42, 0.12)',
      },
      animation: {
        "float-slow": "floatSlow 5s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
