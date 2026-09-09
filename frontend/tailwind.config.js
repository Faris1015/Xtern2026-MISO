/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Open Sans", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        miso: {
          navy: "#0B2E4F",
          sky: "#0082CA",
          cyan: "#5BC2E7",
          emerald: "#347A3A",
          slate: "#203746",
          amber: "#A76500",
          red: "#B42318",
          purple: "#6554C0",
          card: "#F4F7F9",
          soft: "#EAF5FA",
          border: "#D5DEE5",
          muted: "#516774",
          ink: "#0B2E4F",
        },
        canvas: "#F4F7F9",
      },
      boxShadow: {
        subtle: "0 3px 12px rgba(11, 46, 79, 0.06)",
        panel: "0 12px 32px rgba(11, 46, 79, 0.12)",
      },
    },
  },
};
