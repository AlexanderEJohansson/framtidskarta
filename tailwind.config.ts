import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "af-blue": "#0033A0",
        "af-blue-light": "#0070C0",
        "af-bg": "#F8F9FA",
        "af-green": "#00A651",
      },
    },
  },
  plugins: [],
};
export default config;
