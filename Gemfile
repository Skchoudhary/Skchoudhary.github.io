source "https://rubygems.org"

# For GitHub Pages, use github-pages gem which includes Jekyll and compatible plugins
gem "github-pages", group: :jekyll_plugins

# Alternatively, if you want to use the theme directly:
# gem "jekyll", "~> 3.9"
# gem "no-style-please"

# GitHub Pages compatible plugins
group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
end

# Windows and JRuby does not include zoneinfo files, so bundle the tzinfo-data gem
# and associated library.
platforms :mingw, :x64_mingw, :mswin, :jruby do
  gem "tzinfo", "~> 1.2"
  gem "tzinfo-data"
end

# Performance-booster for watching directories on Windows
gem "wdm", "~> 0.1.1", :platforms => [:mingw, :x64_mingw, :mswin]
