/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        'card-foreground': 'var(--card-foreground)',
        popover: 'var(--popover)',
        'popover-foreground': 'var(--popover-foreground)',
        primary: 'var(--primary)',
        'primary-hover': 'var(--primary-hover)',
        'primary-foreground': 'var(--primary-foreground)',
        secondary: 'var(--secondary)',
        'secondary-badge': 'var(--secondary-badge)',
        'secondary-foreground': 'var(--secondary-foreground)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        border: 'var(--border)',
        'border-orange': 'var(--border-orange)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        sidebar: 'var(--sidebar)',

        // explicit mappings
        'primary-orange': 'var(--primary-orange)',
        'button-orange': 'var(--button-orange)',
        'hover-orange': 'var(--hover-orange)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'light-bg': 'var(--light-bg)',
        'input-bg': 'var(--input-bg)',
        'light-border': 'var(--light-border)',
        'orange-border': 'var(--orange-border)',
        'primary-text': 'var(--primary-text)',
        'secondary-text': 'var(--secondary-text)',
        'placeholder-color': 'var(--placeholder-color)',
        white: 'var(--white)',

        // backward compatibility for currently used classes
        'text-primary': 'var(--primary-text)',
        'text-secondary': 'var(--secondary-text)',
        'text-placeholder': 'var(--placeholder-color)',
      },
    },
  },
  plugins: [],
}
