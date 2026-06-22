module.exports = {
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
          900: '#111827', // dark background
          800: '#1F2937', // dark sidebar
          700: '#374151',
          600: '#4B5563',
        },
        // Accents
        primary: {
          500: '#3B82F6', // bright blue
          600: '#2563EB',
        },
        success: '#10B981', // green for positive/income
        danger: '#EF4444', // red for negative/expense
        warning: '#F59E0B',
        // Backgrounds
        softGray: '#F9FAFB',
        surface: '#FFFFFF',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%)',
        'dark-gradient': 'linear-gradient(135deg, #1F2937 0%, #111827 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
      }
    }
  },
  plugins: []
}
