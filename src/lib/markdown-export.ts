import type { Article } from "./library";
import { formatIsoDate } from "./format";
import { absoluteUrl } from "./site";

export function toMarkdownDocument(article: Article) {
  return [
    `# ${article.title}`,
    `> ${article.description}`,
    `Published ${formatIsoDate(article.date)} · ${absoluteUrl(article.url)}`,
    (article.entry.body ?? "").trim(),
  ].join("\n\n");
}
