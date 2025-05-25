/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#81c7fa',
          400: '#41a7f6',
          500: '#1a8ee6',
          600: '#0771c9',
          700: '#095ca3',
          800: '#0c4d86',
          900: '#0f4171',
          950: '#092847',
        },
        secondary: {
          50: '#f8f8f9',
          100: '#f0f1f2',
          200: '#e6e8ea',
          300: '#d1d6da',
          400: '#b2bac1',
          500: '#8e99a3',
          600: '#717c87',
          700: '#5c6570',
          800: '#4e5660',
          900: '#42484f',
          950: '#25292e',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        }
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: true,
  },
} 