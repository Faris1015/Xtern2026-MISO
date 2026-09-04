/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        miso: { ink: "#17324d", teal: "#007c83", sand: "#f5f1e8", rust: "#d4773c" },
        canvas: "#f7f8f6",
      },
      boxShadow: {
        subtle: "0 4px 20px rgba(23, 50, 77, 0.07)",
        panel: "0 12px 40px rgba(23, 50, 77, 0.10)",
      },
    },
  },
  plugins: [],
};
