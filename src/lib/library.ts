import { getCollection, type CollectionEntry } from "astro:content";

export type Topic = {
  id: string;
  title: string;
  description: string;
  url: string;
};

export type Series = {
  id: string;
  title: string;
  description: string;
  url: string;
  topic: Topic;
  articles: Article[];
};

export type Article = {
  id: string;
  title: string;
  description: string;
  date: Date;
  url: string;
  markdownUrl: string;
  topic: Topic;
  series?: Series;
  part?: number;
  entry: CollectionEntry<"articles">;
};

export type Library = {
  articles: Article[];
  topics: Topic[];
  series: Series[];
};

const ORDER_PREFIX = /^\d+-/;
const MAX_DEPTH = 3;

const slugOf = (segment: string) => segment.replace(ORDER_PREFIX, "");

const byFileOrder = (a: Article, b: Article) => a.id.localeCompare(b.id, "en", { numeric: true });

const byNewest = (a: Article, b: Article) => b.date.getTime() - a.date.getTime() || byFileOrder(a, b);

const latestDate = (series: Series) => Math.max(...series.articles.map((article) => article.date.getTime()));

function required<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}

function toTopic(entry: CollectionEntry<"topics">): Topic {
  return {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    url: `/articles/${slugOf(entry.id)}`,
  };
}

function toSeries(entry: CollectionEntry<"series">, topics: Map<string, Topic>): Series {
  const [topicId, folder] = entry.id.split("/");
  const topic = required(topics.get(topicId), `Missing _topic.md for topic "${topicId}"`);
  return {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    url: `${topic.url}/${slugOf(folder)}`,
    topic,
    articles: [],
  };
}

function toArticle(
  entry: CollectionEntry<"articles">,
  topics: Map<string, Topic>,
  series: Map<string, Series>,
): Article {
  const segments = entry.id.split("/");
  if (segments.length > MAX_DEPTH) {
    throw new Error(`Article "${entry.id}" is nested too deep: use <topic>/<article> or <topic>/<series>/<article>`);
  }

  const [topicId, ...rest] = segments;
  const topic = required(topics.get(topicId), `Missing _topic.md for topic "${topicId}"`);
  const seriesId = rest.length === 2 ? `${topicId}/${rest[0]}` : undefined;
  const parent = seriesId ? required(series.get(seriesId), `Missing _series.md for series "${seriesId}"`) : undefined;
  const url = `${parent?.url ?? topic.url}/${slugOf(rest.at(-1) ?? "")}`;

  return {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    date: entry.data.date,
    url,
    markdownUrl: `${url}.md`,
    topic,
    series: parent,
    entry,
  };
}

function attachToSeries(articles: Article[]) {
  for (const article of [...articles].sort(byFileOrder)) {
    if (!article.series) continue;
    article.series.articles.push(article);
    article.part = article.series.articles.length;
  }
}

export async function getLibrary(): Promise<Library> {
  const [articleEntries, seriesEntries, topicEntries] = await Promise.all([
    getCollection("articles"),
    getCollection("series"),
    getCollection("topics"),
  ]);

  const topics = new Map(topicEntries.map((entry) => [entry.id, toTopic(entry)]));
  const series = new Map(seriesEntries.map((entry) => [entry.id, toSeries(entry, topics)]));
  const articles = articleEntries.map((entry) => toArticle(entry, topics, series));
  attachToSeries(articles);

  const publishedTopics = new Set(articles.map((article) => article.topic));

  return {
    articles: articles.sort(byNewest),
    topics: [...topics.values()].filter((topic) => publishedTopics.has(topic)).sort((a, b) => a.title.localeCompare(b.title)),
    series: [...series.values()].filter((item) => item.articles.length > 0).sort((a, b) => latestDate(b) - latestDate(a)),
  };
}

export function groupByYear(articles: Article[]) {
  const years = new Map<number, Article[]>();
  for (const article of articles) {
    const year = article.date.getUTCFullYear();
    years.set(year, [...(years.get(year) ?? []), article]);
  }
  return [...years].map(([year, items]) => ({ year, articles: items }));
}
