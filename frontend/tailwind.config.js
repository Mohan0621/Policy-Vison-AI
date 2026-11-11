/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        grotesk: ['Space Grotesk', 'sans-serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      colors: {
        dark: {
          950: '#050607',
          900: '#08090A',
          850: '#0C0D0F',
          800: '#121417',
          700: '#1C1F24',
          600: '#2A2E36',
        },
        accent: {
          cyan: '#38BDF8',
          lime: '#D4FF00',
          emerald: '#10B981',
          rose: '#F43F5E',
        },
        paper: '#EDE8DE',
      },
      backgroundImage: {
        'noise-glow': 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.08) 0%, transparent 60%)',
        'emerald-glow': 'radial-gradient(circle at 100% 100%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)',
      }
    },
  },
  plugins: [],
}

