import type { APIRoute, GetStaticPaths } from "astro";
import { getLibrary, type Article } from "../../lib/library";
import { toMarkdownDocument } from "../../lib/markdown-export";

export const getStaticPaths = (async () => {
  const { articles } = await getLibrary();
  return articles.map((article) => ({
    params: { path: article.url.replace(/^\/articles\//, "") },
    props: { article },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ article: Article }> = ({ props }) =>
  new Response(toMarkdownDocument(props.article), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
