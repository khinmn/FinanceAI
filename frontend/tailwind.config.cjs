module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Dark theme colors
        dark: {
          950: '#07090E', // deepest black — used for footer bg and borders
          900: '#0F1115', // near-black
          850: '#141720', // between 800 and 900
          800: '#1A1D24',
          700: '#2A2E39',
          600: '#4B5563',
          500: '#6B7280',
          450: '#828EA0', // between 400 and 500
          400: '#9CA3AF',
          300: '#D1D5DB', // light gray for secondary texts
          200: '#E5E7EB', // lighter gray
          100: '#F3F4F6', // very light gray
        },
        // Advapay-inspired premium brand colors
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },
        accent: {
          blue: '#3B82F6',
          cyan: '#06B6D4',
          pink: '#EC4899'
        },
        primary: {
          500: '#3B82F6',
          600: '#2563EB',
        },
        success: '#10B981',
        danger: '#EF4444',
        warning: '#F59E0B',
        softGray: '#FAFAFA',
        surface: '#FFFFFF',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.7) 0%, rgba(255, 255, 255, 0.3) 100%)',
        'glass-gradient-dark': 'linear-gradient(135deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
        'glass-hover': '0 12px 48px 0 rgba(31, 38, 135, 0.1)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'soft': '0 20px 40px -15px rgba(0,0,0,0.05)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      animation: {
        'blob': 'blob 10s infinite',
        'blob-reverse': 'blob-reverse 12s infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        'blob-reverse': {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(-30px, 50px) scale(1.2)' },
          '66%': { transform: 'translate(20px, -20px) scale(0.8)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    }
  },
  plugins: []
}
