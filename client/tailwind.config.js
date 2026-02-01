/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - Emerald Green (#2ECC71)
        primary: {
          50: '#e8f8f0',
          100: '#d1f1e1',
          200: '#a3e3c3',
          300: '#75d5a5',
          400: '#47c787',
          500: '#2ECC71',
          600: '#25a35a',
          700: '#1c7a44',
          800: '#12522d',
          900: '#092917',
        },
        // Secondary - Slate Gray (#2C3E50)
        secondary: {
          50: '#e8eaed',
          100: '#d1d5db',
          200: '#a3abb7',
          300: '#758193',
          400: '#47576f',
          500: '#2C3E50',
          600: '#233240',
          700: '#1a2530',
          800: '#121920',
          900: '#090c10',
        },
        // Accent - Teal (#1ABC9C)
        accent: {
          50: '#e6f7f4',
          100: '#ccefe9',
          200: '#99dfd3',
          300: '#66cfbd',
          400: '#33bfa7',
          500: '#1ABC9C',
          600: '#15967d',
          700: '#10715e',
          800: '#0a4b3e',
          900: '#05261f',
        },
        // Success - Green
        success: {
          50: '#e8f8f0',
          100: '#d1f1e1',
          200: '#a3e3c3',
          300: '#75d5a5',
          400: '#47c787',
          500: '#2ECC71',
          600: '#25a35a',
          700: '#1c7a44',
          800: '#12522d',
          900: '#092917',
        },
        // Warning - Amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Error - Red
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Neutral - Light Gray (#ECF0F1)
        neutral: {
          50: '#fafbfb',
          100: '#ECF0F1',
          200: '#d9dfe0',
          300: '#c6cecf',
          400: '#b3bdbe',
          500: '#95a5a6',
          600: '#7b8c8d',
          700: '#5d6d6e',
          800: '#3e4d4e',
          900: '#1f2627',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(44, 62, 80, 0.08)',
        'card-hover': '0 4px 16px rgba(44, 62, 80, 0.12)',
      },
      borderRadius: {
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
