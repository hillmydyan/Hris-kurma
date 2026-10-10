/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        subtle: 'var(--bg-subtle)',
        border: {
          default: 'var(--border-default)',
          input: 'var(--border-input)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          placeholder: 'var(--text-placeholder)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          soft: 'var(--primary-soft)',
          ring: 'var(--primary-ring)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          hover: 'var(--danger-hover)',
        },
        success: {
          bg: 'var(--success-bg)',
          fg: 'var(--success-fg)',
        },
        warning: {
          bg: 'var(--warning-bg)',
          fg: 'var(--warning-fg)',
        },
        info: {
          bg: 'var(--info-bg)',
          fg: 'var(--info-fg)',
        },
        violet: {
          bg: 'var(--violet-bg)',
          fg: 'var(--violet-fg)',
        },
        sky: {
          bg: 'var(--sky-bg)',
          fg: 'var(--sky-fg)',
        },
        orange: {
          bg: 'var(--orange-bg)',
          fg: 'var(--orange-fg)',
        },
        neutral: {
          bg: 'var(--neutral-bg)',
          fg: 'var(--neutral-fg)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      }
    },
  },
  plugins: [],
}
