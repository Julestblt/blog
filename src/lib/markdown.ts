import { defineHastPlugin } from "satteri";
import type { Element, ElementContent } from "hast";
import type { ShikiTransformer, ThemeRegistration } from "shiki";

export const monochromeTheme: ThemeRegistration = {
  name: "monochrome",
  type: "light",
  colors: {
    "editor.background": "#f6f6f6",
    "editor.foreground": "#111111",
  },
  tokenColors: [
    {
      settings: { foreground: "#111111" },
    },
    {
      scope: ["comment", "punctuation.definition.comment"],
      settings: { foreground: "#6b6b6b", fontStyle: "italic" },
    },
    {
      scope: ["keyword", "storage", "storage.type", "storage.modifier", "variable.language"],
      settings: { fontStyle: "bold" },
    },
  ],
};

export const semiboldKeywords: ShikiTransformer = {
  name: "semibold-keywords",
  span(node) {
    const style = node.properties.style;
    if (typeof style === "string") {
      node.properties.style = style.replace("font-weight:bold", "font-weight:600");
    }
  },
};

export const copyableCodeBlocks = defineHastPlugin({
  name: "copyable-code-blocks",
  element: {
    filter: ["pre"],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        raw: '<div class="code-block"><button type="button" class="code-copy" data-copy-code data-pagefind-ignore>Copy</button></div>',
      });
    },
  },
});

const isBlank = (node: ElementContent) => node.type === "text" && node.value.trim() === "";

const isImage = (node: ElementContent): node is Element => node.type === "element" && node.tagName === "img";

function caption(number: number, text: string): Element {
  return {
    type: "element",
    tagName: "figcaption",
    properties: {},
    children: [
      { type: "element", tagName: "span", properties: { className: ["figure-number"] }, children: [{ type: "text", value: `Figure ${number}.` }] },
      { type: "text", value: ` ${text}` },
    ],
  };
}

export const imageFigures = defineHastPlugin({
  name: "image-figures",
  before(_root, ctx) {
    ctx.data.figureCount = 0;
  },
  element: {
    filter: ["p"],
    visit(node, ctx) {
      const content = node.children.filter((child) => !isBlank(child));
      const [image] = content;
      if (content.length !== 1 || !isImage(image)) return;

      const title = image.properties.title;
      const children: ElementContent[] = [image];
      if (typeof title === "string" && title.length > 0) {
        ctx.data.figureCount = Number(ctx.data.figureCount) + 1;
        children.push(caption(Number(ctx.data.figureCount), title));
      }

      ctx.replaceNode(node, { type: "element", tagName: "figure", properties: {}, children });
    },
  },
});

export const scrollableTables = defineHastPlugin({
  name: "scrollable-tables",
  element: {
    filter: ["table"],
    visit(node, ctx) {
      ctx.wrapNode(node, {
        raw: '<div class="table-scroll" role="region" aria-label="Table, scrolls sideways" tabindex="0"></div>',
      });
    },
  },
});
