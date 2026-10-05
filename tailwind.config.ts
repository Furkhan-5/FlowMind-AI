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
          bg: "var(--bloom-bg)",
          card: "var(--bloom-card)",
          dark: "var(--bloom-dark)",
          darkCard: "var(--bloom-darkCard)",
          accent: "#8b5cf6",
          purpleLight: "#e9d5ff",
          textDark: "var(--bloom-textDark)",
          textMuted: "var(--bloom-textMuted)",
          subtleBorder: "var(--bloom-subtleBorder)",
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
