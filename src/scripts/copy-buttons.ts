const RESET_DELAY_MS = 1600;

async function copyWithFeedback(button: HTMLButtonElement, text: string, copiedLabel: string) {
  await navigator.clipboard.writeText(text);
  const label = button.textContent;
  button.textContent = copiedLabel;
  button.disabled = true;
  setTimeout(() => {
    button.textContent = label;
    button.disabled = false;
  }, RESET_DELAY_MS);
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy-code]")) {
  button.addEventListener("click", () => {
    const code = button.closest(".code-block")?.querySelector("pre")?.textContent ?? "";
    copyWithFeedback(button, code, "Copied");
  });
}

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy-link]")) {
  button.addEventListener("click", () => {
    copyWithFeedback(button, `${location.origin}${location.pathname}`, "Link copied");
  });
}
