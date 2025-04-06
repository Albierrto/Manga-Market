/** @type {import('tailwindcss').Config} */ 
module.exports = { 
  content: [ 
    "./src/**/*.{js,jsx,ts,tsx}", 
  ], 
  theme: { 
    extend: { 
      colors: { 
        primary: '#6a1b9a', 
        secondary: '#9c27b0', 
        light: '#e1bee7', 
        dark: '#4a148c', 
      }, 
    }, 
  }, 
  plugins: [], 
} 
