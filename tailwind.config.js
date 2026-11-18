/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      colors: {
        ink: { 950: '#0b0d12', 900: '#12151c', 850: '#171b24', 800: '#1d222d', 700: '#2a303d', 600: '#3a4252' },
        sky: { accent: '#bcd9f5' },
        brand: { 50: '#eef1ff', 100: '#dfe5ff', 300: '#a5b3ff', 400: '#8193f7', 500: '#5c6ee8', 600: '#4a59d4', 700: '#3c48ad' },
      },
      boxShadow: {
        glass: '0 10px 40px -12px rgba(15, 23, 42, 0.25)',
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 20px 50px -20px rgba(92,110,232,0.45)',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        fadeUp: { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'fade-up': 'fadeUp .45s ease both',
      },
    },
  },
  plugins: [],
};
