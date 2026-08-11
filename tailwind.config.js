/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary-orange': 'var(--primary-orange)',
        'button-orange': 'var(--button-orange)',
        'hover-orange': 'var(--hover-orange)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'input-bg': 'var(--input-bg)',
        'light-border': 'var(--light-border)',
        'orange-border': 'var(--orange-border)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-placeholder': 'var(--text-placeholder)',
      },
    },
  },
  plugins: [],
}
