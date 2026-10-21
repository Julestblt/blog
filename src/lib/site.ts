export const SITE = {
  author: "Jules THIBAULT",
  description: "Notes on security, infrastructure and AI agents, written while building them.",
  url: "https://blog.julez.cat",
  github: "https://github.com/Julestblt",
  portfolio: "https://julez.cat",
};

export const absoluteUrl = (path: string) => new URL(path, SITE.url).toString();

export const displayUrl = (url: string) => url.replace(/^https?:\/\//, "");
