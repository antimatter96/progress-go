const colors = require("tailwindcss/colors");
const plugin = require("tailwindcss/plugin");
const forms = require("@tailwindcss/forms");

module.exports = {
  content: ["*.html", "**/*.html", "*.ts", "**/*.ts"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      blue: colors.blue,
      gray: colors.gray,
      red: colors.red,
      lime: colors.lime,
      white: colors.white,
      black: colors.black,
      amber: colors.amber,
      orange: colors.orange,
      green: colors.green,
      yellow: colors.yellow,
    },
    extend: {
      fontFamily: {
        sans: ["Inconsolata", "sans-serif"],
        serif: ["Inconsolata", "serif"],
      },
    },
  },
  plugins: [
    plugin(function ({ addVariant, e }) {
      addVariant("invalid", ({ modifySelectors, separator }) => {
        modifySelectors(({ className }) => {
          return `.${e(`invalid${separator}${className}`)}:invalid`;
        });
      });
    }),
    forms({ strategy: 'class' }),
  ],
};
