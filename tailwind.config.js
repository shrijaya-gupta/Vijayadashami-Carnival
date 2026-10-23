/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carnival: {
          maroon: '#801823',
          'maroon-dark': '#4D0E15',
          'maroon-light': '#A51F2D',
          gold: '#D4AF37',
          'gold-light': '#F3E5AB',
          'gold-dark': '#AA820A',
          saffron: '#FF9933',
          ivory: '#FFFDF9',
          charcoal: '#12111A',
          'charcoal-card': '#1C1A28',
          'charcoal-border': '#2D2A3E'
        }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        decorative: ['"Cinzel Decorative"', 'Cinzel', 'serif'],
        rozha: ['"Rozha One"', 'serif'],
        outfit: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'festive-gold': '0 8px 30px rgba(212, 175, 55, 0.25)',
        'festive-maroon': '0 8px 30px rgba(128, 24, 35, 0.35)',
      }
    },
  },
  plugins: [],
};
