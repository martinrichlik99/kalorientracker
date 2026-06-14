/** Tailwind v3 — lokaler Build (ersetzt cdn.tailwindcss.com).
 *  Config 1:1 aus dem früheren Inline-Block in index.html.
 *  Rebuild nach Klassen-Änderungen:  npm run build:css
 */
module.exports = {
  content: ['./index.html', './js/**/*.js'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'outline-variant': '#bbcabf', 'on-primary-fixed': '#002113',
        'on-error': '#ffffff', 'primary': '#006c49',
        'surface-container-high': '#e2e7ff', 'on-primary-container': '#00422b',
        'background': '#faf8ff', 'on-secondary': '#ffffff',
        'on-background': '#131b2e', 'surface-variant': '#dae2fd',
        'error-container': '#ffdad6', 'inverse-surface': '#283044',
        'on-surface': '#131b2e', 'inverse-primary': '#4edea3',
        'surface-dim': '#d2d9f4', 'surface-container-low': '#f2f3ff',
        'on-tertiary-container': '#00367a', 'on-error-container': '#93000a',
        'on-surface-variant': '#3c4a42', 'surface-container': '#eaedff',
        'tertiary': '#005ac2', 'surface': '#faf8ff', 'outline': '#6c7a71',
        'surface-container-highest': '#dae2fd', 'surface-container-lowest': '#ffffff',
        'on-primary': '#ffffff', 'on-tertiary': '#ffffff',
        'secondary-container': '#fea619', 'surface-bright': '#faf8ff',
        'error': '#ba1a1a', 'on-secondary-container': '#684000',
        'inverse-on-surface': '#eef0ff', 'tertiary-container': '#71a1ff',
        'secondary': '#855300', 'primary-container': '#10b981',
        'primary-fixed-dim': '#4edea3',
      },
      borderRadius: { DEFAULT: '0.25rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' },
      spacing: { 'max-width': '600px', 'container-margin': '20px' },
      fontFamily: { sans: ['Hanken Grotesk', 'sans-serif'] },
      fontSize: {
        display: ['40px', { lineHeight: '48px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg': ['28px', { lineHeight: '34px', fontWeight: '700' }],
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-md': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'label-sm': ['12px', { lineHeight: '16px', letterSpacing: '0.02em', fontWeight: '500' }],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries'),
  ],
};
