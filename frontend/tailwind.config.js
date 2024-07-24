/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      width: {
        '18': '70px',
      },
      colors: {
        color:{
          "lighter-gray": "#f3f4f6",
          "light-gray": "#cbd5e1", 
          "gray": "#94a3b8",
          "dark-gray":"#374151",
          "darker-gray":"#111827",
          "dark-red":"#991b1b",
          "light-red":"#fee2e2",
          "red": "#e11d48",
          "darker-red":"#450a0a",
          "white": "#ffffff",
          
        }
      },
      fontFamily: {
        body: [
          'Inter', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'system-ui', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
        ],
        sans: [
          'Inter', 
          'ui-sans-serif', 
          'system-ui', 
          '-apple-system', 
          'system-ui', 
          'Segoe UI', 
          'Roboto', 
          'Helvetica Neue', 
          'Arial', 
          'Noto Sans', 
          'sans-serif', 
          'Apple Color Emoji', 
          'Segoe UI Emoji', 
          'Segoe UI Symbol', 
          'Noto Color Emoji'
        ]
      }
    }
  },
  plugins: [
    require('flowbite/plugin')
  ],
}
