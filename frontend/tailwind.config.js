/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff0f3',
          100: '#ffe0e7',
          200: '#ffc0d0',
          300: '#ff8fab',
          400: '#ff5a83',
          500: '#e94560', // primary
          600: '#d42a4a',
          700: '#b01e3a',
          800: '#921d36',
          900: '#7d1d33',
          950: '#470b19',
        },
        dark: {
          50:  '#f6f6f9',
          100: '#ededf3',
          200: '#d5d5e4',
          300: '#b0b0cc',
          400: '#8585af',
          500: '#666696',
          600: '#52527b',
          700: '#424265',
          800: '#393956',
          900: '#16213e', // surface
          950: '#0f3460', // card bg
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideDown: { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'shimmer-gradient': 'linear-gradient(90deg, #1e1e3a 25%, #2a2a50 50%, #1e1e3a 75%)',
      },
    },
  },
  plugins: [],
};
