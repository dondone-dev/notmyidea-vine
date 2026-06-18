# notmyidea-vine

[中文](README.zh.md)

A Pelican theme derived from the default `notmyidea` theme and tuned for a personal blog with archives, category views, multilingual filters, media layouts, comments, analytics, and a small set of static browser tools.

## Features

- Responsive Pelican templates for articles, pages, archives, tags, authors, categories, and period archives.
- Optional media layout helpers for galleries, carousels, image grids, single-image layouts, and portrait rows.
- Lazy-loaded Giscus comments plus optional legacy Disqus, Changyan, and Duoshuo support.
- Optional analytics integrations for Google Analytics, VerCount, Umami, and GoatCounter.
- Optional footer badges for RSS, site status, and Not By AI.
- Internationalization support (i18n) via Babel/gettext with bundled English, French, and Japanese translations.

## Installation

Clone this repository into your Pelican theme directory:

```bash
git clone https://github.com/your-org/notmyidea-vine.git themes/notmyidea-vine
```

Then enable it in `pelicanconf.py`:

```python
THEME = "themes/notmyidea-vine"
CSS_FILE = "main.css"
```

## Common Settings

```python
SITENAME = "Example Blog"
SITE_DESCRIPTION = "Notes, essays, and experiments."
SITESUBTITLE = "Optional subtitle"

THEME_STATIC_DIR = "theme"
THEME_ENABLE_IMAGE_HINTS = True
THEME_ENABLE_IMAGE_SKELETON = True
THEME_ENABLE_LAZY_COMMENTS = True

GISCUS_REPO = ""
GISCUS_REPO_ID = ""
GISCUS_CATEGORY = ""
GISCUS_CATEGORY_ID = ""
GISCUS_MAPPING = "pathname"
GISCUS_LANG = "en"

GOOGLE_ADSENSE = False
GOOGLE_ADSENSE_CLIENT = ""

FOOTER_NOT_BY_AI = True
FOOTER_STATUS_URL = ""

READING_NOTICE_HTML = ""
MORE_PAGE_SECTIONS = []
```

## About Page Settings

These settings are used by the `page_about` template:

```python
AUTHOR_AVATAR = "/path/to/avatar.jpg"   # URL or path to avatar image
THEME_CONTACT_EMAIL = ""                # Enables the Contact button on the about page
THEME_ABOUT_MORE_LINKS = [              # Cards shown in the "More" section
    {"title": "Blog", "url": "/", "css_class": ""},
]
```

`THEME_ABOUT_MORE_LINKS` entries support `title`, `url`, and an optional `css_class` field.

## Homepage Image Settings

The optional homepage banner image is configured via `template_filters.py` (see [Plugin Setup](#plugin-setup)):

```python
INDEX_IMAGE = "/theme/images/banner.jpg"

# Override the image on specific calendar dates (MM-DD format)
INDEX_IMAGE_DAYS = {
    "01-01": "/theme/images/new-year.jpg",
    "12-25": "/theme/images/christmas.jpg",
}
```

The computed value is exposed to templates as `INDEX_IMAGE_BY_DATE`. You can also set the aspect ratio of the homepage image:

```python
THEME_HOMEPAGE_IMAGE_RATIO = "1600 / 520"   # default
```

## Plugin Setup

`template_filters.py` is a small Pelican plugin that resolves the date-aware homepage image. To enable it, copy or symlink it into your plugins directory and add it to `PLUGINS` in `pelicanconf.py`:

```python
PLUGINS = ["template_filters"]
```

Or use an absolute path:

```python
import sys
sys.path.insert(0, "themes/notmyidea-vine")
PLUGINS = ["template_filters"]
```

## Testing

The repository uses Node's built-in test runner:

```bash
npm test
```

No npm runtime dependencies are required for the retained tests.

## Third-party assets

The following vendored files are included in `static/js/`:

| File | Library | License |
|------|---------|---------|
| `glightbox.min.js` | [GLightbox](https://biati-digital.github.io/glightbox/) | MIT |

## Troubleshooting

**Theme static files not found** — ensure `THEME_STATIC_DIR` matches the directory name Pelican generates (default is `theme`).

**Comments not loading** — Giscus requires a public GitHub repository. Check that all four `GISCUS_*` values are set and that the Giscus app is installed on the repo.

**`INDEX_IMAGE_BY_DATE` not available in templates** — the `template_filters` plugin is not loaded. See [Plugin Setup](#plugin-setup).

## License

GPL-3.0. See [LICENSE](LICENSE).
