import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

marked.setOptions({ gfm: true, breaks: false });

export async function renderSafeMarkdown(markdown: string) {
  const html = await marked.parse(markdown, { async: true });
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "h1", "h2", "del", "table", "thead", "tbody", "tr", "th", "td", "input", "details", "summary"],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, a: ["href", "name", "target", "rel"], img: ["src", "alt", "title", "width", "height"], input: ["type", "checked", "disabled"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "nofollow noopener noreferrer", target: "_blank" }, true) },
  });
}
