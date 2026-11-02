import daisyui from 'daisyui';

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
        primary: {
          DEFAULT: '#00e676',
          foreground: '#032314',
        },
        secondary: {
          DEFAULT: '#f3f4f6',
          foreground: '#1f2937',
        },
        accent: {
          DEFAULT: '#00e676',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        light: {
          "primary": "#00e676",
          "primary-content": "#032314",
          "secondary": "#f3f4f6",
          "accent": "#00e676",
          "neutral": "#1f2937",
          "base-100": "#ffffff",
          "base-200": "#f5f8f6",
          "base-300": "#e4ebe6",
          "base-content": "#0f172a",
        },
        dark: {
          "primary": "#00e676",
          "primary-content": "#032314",
          "secondary": "#1f2937",
          "accent": "#00e676",
          "neutral": "#091712",
          "base-100": "#040c08",
          "base-200": "#020704",
          "base-300": "#0a1c14",
          "base-content": "#f8fafc",
        },
      },
    ],
  },
}
