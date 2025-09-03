/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './utils/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#f5b74e',  // gold accent
        background: 'rgb(15 23 42)',
        foreground: 'rgb(248 250 252)',
        secondary: 'rgb(30 64 175)',
        accent: 'rgb(182 131 55)',
        muted: 'rgb(100 116 139)',
        destructive: 'rgb(239 68 68)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
      },
      animation: {
        'gradient-shift': 'gradientShift 15s ease infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'fadeIn': 'fadeIn 0.5s ease-out',
        'slideInRight': 'slideInRight 0.5s ease-out',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          'from': { opacity: '0', transform: 'translateX(20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  safelist: [
    // keep status styles from being purged
    'bg-emerald-500/20','text-emerald-400','border-emerald-400/40',
    'bg-blue-500/20','text-blue-400','border-blue-400/40',
    'bg-yellow-500/20','text-yellow-400','border-yellow-400/40',
    'bg-orange-500/20','text-orange-400','border-orange-400/40'
  ],
  plugins: [],
}