import rss from "@astrojs/rss";
import type { APIRoute } from "astro";
import { getLibrary } from "../lib/library";
import { SITE } from "../lib/site";

export const GET: APIRoute = async () => {
  const { articles } = await getLibrary();
  return rss({
    title: SITE.author,
    description: SITE.description,
    site: SITE.url,
    trailingSlash: false,
    items: articles.map((article) => ({
      title: article.title,
      description: article.description,
      pubDate: article.date,
      link: article.url,
      categories: [article.topic.title],
    })),
  });
};
