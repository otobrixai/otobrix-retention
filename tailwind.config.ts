// tailwind.config.ts
import animate from 'tailwindcss-animate'
import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1.5rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1400px',
        '3xl': '1600px',
        'mobile': {'max': '767px'},
        'tablet': {'min': '768px', 'max': '1023px'},
        'desktop': {'min': '1024px'},
      },
    },
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1400px',
      '3xl': '1600px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Enterprise analytics colors
        enterprise: {
          green: '#10b981',    // Positive/recovery
          red: '#ef4444',      // Risk/churn
          amber: '#f59e0b',    // Warning/attention
          blue: '#3b82f6',     // Information
          purple: '#8b5cf6',   // Premium/featured
          slate: '#64748b',    // Neutral
          dark: '#0f172a',     // Dark background
          panel: '#1e293b',    // Panel background
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xs: 'calc(var(--radius) - 6px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
        'enterprise-mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace']
      },
      animation: {
        'enterprise-pulse': 'enterprise-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'enterprise-glow': 'enterprise-glow 2s ease-in-out infinite alternate',
        'enterprise-float': 'enterprise-float 3s ease-in-out infinite',
        'enterprise-fade-in': 'enterprise-fade-in 0.3s ease-in-out',
        'enterprise-slide-up': 'enterprise-slide-up 0.3s ease-in-out',
      },
      keyframes: {
        'enterprise-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'enterprise-glow': {
          'from': {
            'box-shadow': '0 0 20px -10px hsl(var(--primary))',
          },
          'to': {
            'box-shadow': '0 0 20px -5px hsl(var(--primary))',
          },
        },
        'enterprise-float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        'enterprise-fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'enterprise-slide-up': {
          'from': { transform: 'translateY(10px)', opacity: '0' },
          'to': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      backgroundImage: {
        'enterprise-grid': `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(100 116 139 / 0.1)'%3e%3cpath d='M0 .5H32M0 16.5H32M0 32.5H32M.5 0V32M16.5 0V32M31.5 0V32'/%3e%3c/svg%3e")`,
        'enterprise-gradient': 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        'financial-positive': 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
        'financial-risk': 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)',
        'financial-neutral': 'linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(100, 116, 139, 0.05) 100%)',
      },
      boxShadow: {
        'enterprise': '0 4px 20px rgba(0, 0, 0, 0.25)',
        'enterprise-lg': '0 10px 40px rgba(0, 0, 0, 0.35)',
        'enterprise-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
        'financial-positive': '0 0 20px rgba(16, 185, 129, 0.15)',
        'financial-risk': '0 0 20px rgba(239, 68, 68, 0.15)',
      },
      backdropBlur: {
        'enterprise': '12px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [animate],
} satisfies Config