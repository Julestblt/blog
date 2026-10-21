import { defineConfig } from "astro/config";
import { satteri } from "@astrojs/markdown-satteri";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { copyableCodeBlocks, imageFigures, monochromeTheme, semiboldKeywords } from "./src/lib/markdown";

export default defineConfig({
  site: "https://blog.julez.cat",
  trailingSlash: "never",
  build: { format: "file" },
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: monochromeTheme,
      transformers: [semiboldKeywords],
    },
    processor: satteri({ hastPlugins: [copyableCodeBlocks, imageFigures] }),
  },
  vite: { plugins: [tailwindcss()] },
});
