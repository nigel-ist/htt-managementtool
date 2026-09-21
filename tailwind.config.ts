import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Tenant-overridable via CSS variables (set at runtime from tenant_branding)
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
        // IL platform base palette
        il: {
          50:  '#eef0ff',
          100: '#e0e3ff',
          200: '#c7ccfe',
          300: '#a5aafd',
          400: '#8880f9',
          500: '#5b6eff', // --il-accent
          600: '#4a55e6',
          700: '#3a42c4',
          800: '#30389e',
          900: '#2b337c',
        },
      },
      fontFamily: {
        // Overridable via CSS variable from tenant_branding
        heading: ['var(--font-heading)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'IBM Plex Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
    },
  },
  plugins: [],
}

export default config
