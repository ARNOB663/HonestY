import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "p", "br", "hr",
  "ul", "ol", "li",
  "strong", "em", "b", "i", "u", "s",
  "blockquote", "code", "pre",
  "a", "img",
  "table", "thead", "tbody", "tr", "td", "th",
  "figure", "figcaption",
];

const options = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  disallowedTagsMode: "discard",
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: "a",
      attribs: { ...attribs, rel: "noopener noreferrer", target: attribs.target || "_blank" },
    }),
  },
};

export function sanitizePageBody(dirty) {
  if (!dirty) return "";
  return sanitizeHtml(String(dirty), options);
}
