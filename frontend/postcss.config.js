const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
  plugins: [
    purgecss({
      content: [
        './src/**/*.html',
        './src/**/*.js',
        './src/**/*.jsx',
        './public/index.html'
      ],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
      safelist: {
        standard: [
          'show', 'collapse', 'collapsing', 'fade', 'modal-backdrop',
          'dropdown-menu', 'dropdown-toggle', 'nav-link', 'active',
          'spinner-border', 'spinner-border-sm', 'btn-primary', 'btn-success'
        ],
        deep: [/^nav-/, /^dropdown-/, /^modal-/, /^btn-/, /^spinner-/],
        greedy: [/data-bs-/]
      },
      // Only run in production
      enabled: process.env.NODE_ENV === 'production'
    })
  ]
};