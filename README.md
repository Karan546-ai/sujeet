# Sujeet Kumar — Portfolio

A personal portfolio website for Sujeet Kumar, showcasing AI video editing,
motion design, content creation, and selected creative work.

## Preview

Open [`index.html`](./index.html) in a modern web browser. The site is a
standalone HTML page and does not require a build step or package installation.

## Project structure

```text
.
├── index.html
└── assets/
    ├── css/
    ├── fonts/
    ├── icon/
    ├── images/
    └── js/
```

The page loads stylesheets, scripts, fonts, and media from the local `assets/`
directory. Keep that directory alongside `index.html` when copying or deploying
the site.

## Run locally

1. Download or clone this repository.
2. Open `index.html` in a browser.

For local web-server preview, run this from the repository root:

```bash
python -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deployment

This static site can be hosted by GitHub Pages or any static web host. To use
GitHub Pages from this repository, configure the repository's **Pages** settings
to deploy from the `main` branch and the root (`/`) folder.
