import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'wow-orange': '#ff8000',
        'wow-purple': '#a335ee',
        'wow-blue': '#0070dd',
        'wow-green': '#1eff00',
        'wow-grey': '#9d9d9d',
        'stock-green': '#26a69a',
        'stock-red': '#ef5350',
        'stock-gold': '#ffa726',
        'bg-primary': '#0b0e11',
        'bg-secondary': '#131722',
        'bg-card': '#1c2030',
        'border-dim': '#2a2f45',
      },
    },
  },
  plugins: [],
}

export default config
