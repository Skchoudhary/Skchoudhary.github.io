# sandeepk.dev

Personal website of Sandeep Choudhary, built with Jekyll using the [no-style-please](https://github.com/riggraz/no-style-please) theme.

## About

This site has been migrated from a static HTML site to Jekyll for better organization and maintainability. The theme focuses on minimal styling and fast loading times.

## Local Development

To run this site locally:

```bash
bundle install
bundle exec jekyll serve
```

The site will be available at `http://localhost:4000`.

## Features

- **Products first**: the homepage leads with the four shipped products
- **Fast Loading**: one small custom stylesheet on top of the theme
- **Fixed light palette**: the theme's OS dark-mode inversion is disabled
- **Responsive**: works from 320px up
- **SEO Optimized**: Jekyll SEO tag, sitemap, and per-page social images

## Structure

- `_config.yml` - Site configuration
- `index.md` - Homepage: products, about, and footer links
- `writing.md` - `/writing/`, index of engineering and personal posts
- `work.md` - `/work/`, role history and independent work
- `privacy.md` - `/privacy/`, analytics note
- `404.html` - Not-found page served by GitHub Pages
- `projects.html` - Redirect from the old `/projects.html` to the homepage
- `_includes/site-header.html` - Shared header
- `_includes/head.html` - Head override: theme CSS, then `portfolio.css`
- `assets/css/portfolio.css` - All custom styling
- `_data/menu.yml` - Legacy theme menu data
