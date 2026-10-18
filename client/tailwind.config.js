/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0a0b0d',
          900: '#101216',
          800: '#15181d',
          700: '#1c2027',
        },
        brand: {
          50: '#f9fee6',
          100: '#f1fdc9',
          200: '#e4fb9e',
          300: '#d3f862',
          400: '#c6f135',
          500: '#afe010',
          600: '#8dc009',
          700: '#6b960d',
          800: '#577712',
          900: '#496316',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(198,241,53,0.14), 0 12px 36px -14px rgba(198,241,53,0.4)',
        'glow-soft': '0 10px 30px -16px rgba(0,0,0,0.9)',
        glass: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 18px 44px -28px rgba(0,0,0,0.85)',
      },
      animation: {
        'float-slow': 'float 16s ease-in-out infinite',
        'float-slower': 'float 20s ease-in-out infinite reverse',
        shimmer: 'shimmer 2.2s linear infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%': { transform: 'translate3d(30px,-40px,0) scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.55 },
          '50%': { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
};
