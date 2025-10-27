/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Colors
        primary: {
          DEFAULT: '#2C5F7C',
          hover: '#244F67',
          light: '#E8F1F5',
        },
        secondary: {
          DEFAULT: '#C9704F',
          hover: '#B35F3F',
          light: '#F5EBE6',
        },
        accent: {
          DEFAULT: '#D4AF37',
          hover: '#B8952E',
          light: '#F9F4E6',
        },

        // Clan Colors
        clan: {
          military: {
            DEFAULT: '#CD7F32',
            light: '#F5EDE5',
          },
          merchants: {
            DEFAULT: '#DAA520',
            light: '#F9F3E3',
          },
          philosophers: {
            DEFAULT: '#6A5ACD',
            light: '#EEEAF9',
          },
          landlords: {
            DEFAULT: '#8FBC8F',
            light: '#F0F7F0',
          },
          bankers: {
            DEFAULT: '#4682B4',
            light: '#E8F1F7',
          },
          artificers: {
            DEFAULT: '#BC8F8F',
            light: '#F5EFEF',
          },
        },

        // Neutrals - Stone & Parchment
        neutral: {
          50: '#F9F8F6',
          100: '#F0EDE8',
          200: '#E2DCD3',
          700: '#3D3A36',
          900: '#1A1A1A',
        },

        // Semantic Colors
        success: {
          DEFAULT: '#4A7C59',
          50: '#F0F7F2',
          100: '#D4E8DA',
          600: '#4A7C59',
          700: '#3D6649',
        },
        warning: {
          DEFAULT: '#C97435',
          50: '#FDF6F0',
          100: '#F9E8D9',
          200: '#F2D4B8',
          600: '#C97435',
          700: '#A85F2C',
          900: '#6B3D1C',
        },
        danger: {
          DEFAULT: '#B94A48',
          50: '#FCF0F0',
          100: '#F7D9D8',
          200: '#F0B3B1',
          600: '#B94A48',
          700: '#9A3E3C',
          900: '#6B2B2A',
        },
        error: '#B94A48',
      },

      fontFamily: {
        heading: ['Cinzel', 'Georgia', 'serif'],
        body: ['Inter', 'Lato', 'sans-serif'],
      },

      fontSize: {
        display: '2rem',      // 32px
        h1: '1.5rem',         // 24px
        h2: '1.25rem',        // 20px
        h3: '1.125rem',       // 18px
        body: '1rem',         // 16px
        small: '0.875rem',    // 14px
        tiny: '0.75rem',      // 12px
      },

      spacing: {
        1: '0.25rem',   // 4px
        2: '0.5rem',    // 8px
        3: '0.75rem',   // 12px
        4: '1rem',      // 16px
        6: '1.5rem',    // 24px
        8: '2rem',      // 32px
        12: '3rem',     // 48px
        16: '4rem',     // 64px
      },

      borderRadius: {
        sm: '0.25rem',  // 4px
        md: '0.5rem',   // 8px
        lg: '0.75rem',  // 12px
        full: '9999px',
      },

      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },

      transitionDuration: {
        base: '250ms',
      },

      transitionTimingFunction: {
        base: 'cubic-bezier(0.4,0,0.2,1)',
      },
    },
  },
  plugins: [],
}
