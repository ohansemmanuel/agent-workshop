// Tailwind CSS v4 is wired up entirely through this PostCSS plugin.
// No tailwind.config.js is required — v4 auto-detects the files it should scan.
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
