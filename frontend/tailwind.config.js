/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        miso: { navy: "#0f2942", sky: "#0284c7", emerald: "#059669" },
      },
      boxShadow: {
        glow: "0 0 0 4px rgba(14, 165, 233, 0.12), 0 12px 35px rgba(15, 41, 66, 0.12)",
      },
    },
  },
  plugins: [],
};
