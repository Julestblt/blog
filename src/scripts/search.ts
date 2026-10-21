import { formatDayMonth, formatDayMonthYear } from "../lib/format";

type PagefindResult = {
  url: string;
  excerpt: string;
  meta: { title?: string; date?: string };
};

type Pagefind = {
  debouncedSearch: (query: string) => Promise<{ results: { data: () => Promise<PagefindResult> }[] } | null>;
};

const PAGEFIND_URL = "/pagefind/pagefind.js";
const EMPTY_MESSAGE = "Type to search every article.";

const input = document.querySelector<HTMLInputElement>("#search-input");
const status = document.querySelector<HTMLElement>("#search-status");
const list = document.querySelector<HTMLOListElement>("#search-results");
const template = document.querySelector<HTMLTemplateElement>("#search-result");

const pluralizeResults = (count: number) => `${count} ${count === 1 ? "result" : "results"}`;

function statusFor(query: string, count: number) {
  if (!query) return EMPTY_MESSAGE;
  if (count === 0) return `No articles match “${query}”.`;
  return `${pluralizeResults(count)} for “${query}”`;
}

function renderResult(result: PagefindResult, rowTemplate: HTMLTemplateElement) {
  const row = rowTemplate.content.cloneNode(true) as DocumentFragment;
  const link = row.querySelector("a");
  const time = row.querySelector("time");
  const date = result.meta.date ? new Date(result.meta.date) : undefined;

  link?.setAttribute("href", result.url.replace(/\.html$/, ""));
  if (date && time) {
    time.dateTime = result.meta.date ?? "";
    time.querySelector("[data-date-long]")!.textContent = formatDayMonthYear(date);
    time.querySelector("[data-date-short]")!.textContent = formatDayMonth(date);
  }
  row.querySelector("[data-row-title]")!.textContent = result.meta.title ?? "";
  row.querySelector("[data-row-text]")!.innerHTML = result.excerpt;
  return row;
}

function syncQueryParam(query: string) {
  const url = new URL(location.href);
  if (query) url.searchParams.set("q", query);
  else url.searchParams.delete("q");
  history.replaceState(null, "", url);
}

async function startSearch(searchInput: HTMLInputElement, statusLine: HTMLElement, results: HTMLOListElement, rowTemplate: HTMLTemplateElement) {
  const pagefind: Pagefind = await import(/* @vite-ignore */ PAGEFIND_URL);

  async function search() {
    const query = searchInput.value.trim();
    syncQueryParam(query);
    if (!query) {
      results.replaceChildren();
      statusLine.textContent = EMPTY_MESSAGE;
      return;
    }

    const response = await pagefind.debouncedSearch(query);
    if (!response) return;

    const matches = await Promise.all(response.results.map((result) => result.data()));
    results.replaceChildren(...matches.map((match) => renderResult(match, rowTemplate)));
    statusLine.textContent = statusFor(query, matches.length);
  }

  searchInput.addEventListener("input", search);
  searchInput.value = new URLSearchParams(location.search).get("q") ?? "";
  await search();
}

if (input && status && list && template) {
  startSearch(input, status, list, template).catch(() => {
    status.textContent = "Search is unavailable right now.";
  });
}
