const ACTIVATION_OFFSET_PX = 120;

const links = [...document.querySelectorAll<HTMLAnchorElement>("[data-margin-contents] a")];
const sections = links
  .map((link) => ({ link, heading: document.getElementById(decodeURIComponent(link.hash.slice(1))) }))
  .filter((section): section is { link: HTMLAnchorElement; heading: HTMLElement } => section.heading !== null);

function highlightCurrentSection() {
  const reached = sections.filter(({ heading }) => heading.getBoundingClientRect().top <= ACTIVATION_OFFSET_PX);
  const current = reached.at(-1) ?? sections[0];
  for (const { link } of sections) {
    if (link === current?.link) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

let frame = 0;
addEventListener(
  "scroll",
  () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(highlightCurrentSection);
  },
  { passive: true },
);
highlightCurrentSection();
