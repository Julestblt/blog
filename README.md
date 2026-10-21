# blog.julez.cat

Personal blog of Jules THIBAULT, built with [Astro](https://astro.build) and Tailwind CSS. Every page is static and rebuilt on each push.

## Writing an article

Articles are Markdown files under `src/content/articles`. The folder layout defines topics, series and URLs:

```
src/content/articles/
  homelab/
    _topic.md                         topic metadata
    some-article.md                   /articles/homelab/some-article
    private-first-homelab/            a folder inside a topic is a series
      _series.md                      series metadata
      01-homelab-architecture.md      /articles/homelab/private-first-homelab/homelab-architecture
      02-networking-and-exposure.md
```

- A numeric prefix such as `01-` sets the order of an article inside its series and is removed from the URL.
- Every topic needs a `_topic.md` and every series a `_series.md`, both with a `title` and a `description`.
- Images live next to the articles and are optimized at build time. `![Alt text](./images/diagram.png "Caption")` renders a numbered figure with that caption.

Each article starts with:

```yaml
---
title: "Article title"
description: "One sentence shown under the title and in listings."
date: 2026-10-21
---
```

## Generated files

- `/articles/<path>.md`: raw Markdown of each article
- `/rss.xml`, `/sitemap-index.xml` and `/llms.txt`

## Development

Astro needs Node.js 22.22 or later.

```bash
npm install
npm run dev
```

## Deployment

The `Dockerfile` builds the site and serves it with nginx on port 80.

```bash
docker build -t blog .
docker run -p 8080:80 blog
```
