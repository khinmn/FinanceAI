module.exports = {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0b1b3b',
        financeBlue: '#1e3a8a',
        financeGreen: '#10b981',
        softGray: '#f3f4f6'
      },
      borderRadius: {
        xl: '12px'
      }
    }
  },
  plugins: []
}
