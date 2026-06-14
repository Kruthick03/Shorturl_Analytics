/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211a",
        surface: "#f7f8f5",
        brand: "#147a4b"
      }
    }
  },
  plugins: []
};
