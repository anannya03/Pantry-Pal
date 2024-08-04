/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        // 'bert': '#66FCF1',
        // 'black': '#0B0C10',
        // 'dark-grey': '#1F2833',
        // 'light-grey': '#C5C6C7',
        // 'torquiose': '#45A296',
        'bert': '#75A47F',
        'black': '#FCFFE0',
        'pinkk': '#F5DAD2',
        'light-grey': '#C5C6C7',
        'torquiose': '#BACD92',
        'kohl': '#0B0C10'
      },
    },
  },
  plugins: [],
};
