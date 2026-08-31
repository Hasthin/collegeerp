/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "Arial", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 10px rgba(22, 43, 76, 0.06)",
      },
    },
  },
  plugins: [],
};
