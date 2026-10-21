import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const base = "./src/content/articles";

const idFromPath = ({ entry }: { entry: string }) => entry.replace(/(\/_(series|topic))?\.md$/, "");

const articles = defineCollection({
  loader: glob({ base, pattern: ["**/*.md", "!**/_*.md"], generateId: idFromPath }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
  }),
});

const series = defineCollection({
  loader: glob({ base, pattern: "*/*/_series.md", generateId: idFromPath }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

const topics = defineCollection({
  loader: glob({ base, pattern: "*/_topic.md", generateId: idFromPath }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const collections = { articles, series, topics };
