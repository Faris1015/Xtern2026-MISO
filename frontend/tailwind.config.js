/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        miso: {
          navy: "#0F2942",
          sky: "#0284C7",
          emerald: "#059669",
          slate: "#1E293B",
          amber: "#D97706",
          red: "#DC2626",
          card: "#F8FAFC",
          border: "#E2E8F0",
          muted: "#64748B",
          ink: "#0F2942",
        },
        canvas: "#F8FAFC",
      },
      boxShadow: {
        subtle: "0 4px 20px rgba(15, 41, 66, 0.07)",
        panel: "0 12px 40px rgba(15, 41, 66, 0.10)",
      },
    },
  },
  plugins: [],
};
