/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          bg: '#FAF9F6',        // Warm off-white
          sage: '#DCE9DF',      // Soft sage green
          mint: '#E8F3ED',      // Pale mint
          sky: '#E5EFFB',       // Light sky blue
          lavender: '#EEE8F8',  // Muted lavender
          peach: '#F9E8DE',     // Soft peach
          forest: '#315C4B',    // Dark forest green for primary actions
          charcoal: '#29332F',  // Dark charcoal for main text
          muted: '#6B7A74',     // Muted text
          border: '#E2EBE5',    // Subtle border
          card: '#FFFFFF',      // Pure white card
        },
        civic: {
          50: '#FAF9F6',
          100: '#E8F3ED',
          200: '#DCE9DF',
          300: '#B6D4C0',
          400: '#6FA485',
          500: '#315C4B',
          600: '#284C3E',
          700: '#203E33',
          800: '#1A3229',
          900: '#14261F',
        }
      },
      boxShadow: {
        'soft': '0 2px 10px -2px rgba(41, 51, 47, 0.05), 0 1px 3px 0 rgba(41, 51, 47, 0.03)',
        'card': '0 4px 20px -2px rgba(49, 92, 75, 0.06), 0 2px 6px -1px rgba(49, 92, 75, 0.03)',
      }
    },
  },
  plugins: [],
}
