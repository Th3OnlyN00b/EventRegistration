const defaultTheme = require("tailwindcss/defaultTheme");
const colors = require("tailwindcss/colors");
module.exports = {
  content: ["./src/**/*.{ts,js,tsx,jsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Lora", ...defaultTheme.fontFamily.sans]
      },
      colors: {
        primary: colors.rose,
        secondary: colors.gray
      }
    }
  },
  plugins: [require("@tailwindcss/typography"), require("@tailwindcss/forms")]
};
