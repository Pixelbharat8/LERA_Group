module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0a1a5c',
          navy600: '#13267a',
          orange: '#f59e0b',
          orange600: '#d97706',
        },
        ink: '#1a1a2e',
        mist: '#f6f7fb',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        // Navy-tinted, soft + deep — reads designed rather than the harsh gray default.
        soft: '0 2px 8px -2px rgba(10,26,92,0.06), 0 4px 16px -4px rgba(10,26,92,0.05)',
        card: '0 4px 24px -6px rgba(10,26,92,0.10)',
        lift: '0 16px 48px -12px rgba(10,26,92,0.18)',
      },
    },
  },
  plugins: [],
};
