/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Premium FinTech Color Palette
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c084fc',
          400: '#a855f7',
          500: '#8b5cf6', // Indigo-Purple Primary
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#0f0b21',
        },
        slate: {
          850: '#141b2d',
          900: '#0d1321', // Dark blue-slate background
          950: '#070a13',
        },
        income: '#10b981',  // Emerald Green
        expense: '#f43f5e', // Rose/Coral Red
        transfer: '#3b82f6', // Bright Blue
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.5)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.15)',
        'glow-success': '0 0 20px rgba(16, 185, 129, 0.15)',
        'glow-danger': '0 0 20px rgba(244, 63, 94, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
