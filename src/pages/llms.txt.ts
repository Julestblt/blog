import type { APIRoute } from "astro";
import { getLibrary } from "../lib/library";
import { SITE, absoluteUrl } from "../lib/site";

export const GET: APIRoute = async () => {
  const { articles, topics } = await getLibrary();
  const sections = topics.map((topic) => {
    const links = articles
      .filter((article) => article.topic === topic)
      .map((article) => `- [${article.title}](${absoluteUrl(article.markdownUrl)}): ${article.description}`);
    return `## ${topic.title}\n\n${links.join("\n")}`;
  });

  const document = [`# ${SITE.author}`, `> ${SITE.description}`, ...sections].join("\n\n");
  return new Response(`${document}\n`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
};
