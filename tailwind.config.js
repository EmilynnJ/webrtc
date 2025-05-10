/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'psychic-purple': '#6a5acd',
        'psychic-indigo': '#483d8b',
        'psychic-midnight': '#191970',
        'psychic-mystic': '#9370db',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['ui-monospace', 'SFMono-Regular'],
      },
      backgroundImage: {
        'mystic-gradient': 'linear-gradient(to right, #4a00e0, #8e2de2)',
      },
    },
  },
  plugins: [],
}