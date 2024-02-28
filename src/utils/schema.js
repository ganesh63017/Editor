import { Schema } from "prosemirror-model";

const pDOM = ["p", 0],
  blockquoteDOM = ["blockquote", 0],
  hrDOM = ["hr"],
  preDOM = ["pre", ["code", 0]],
  brDOM = ["br"];

// :: Object
// [Specs](#model.NodeSpec) for the nodes defined in this schema.
export const nodes = {
  // :: NodeSpec The top level document node.
  doc: {
    content: "block+",
  },

  paragraph: {
    content: "inline*",
    group: "block",
    parseDOM: [{ tag: "p" }],
    toDOM() {
      return pDOM;
    },
  },

  blockquote: {
    content: "block+",
    group: "block",
    defining: true,
    parseDOM: [{ tag: "blockquote" }],
    toDOM() {
      return blockquoteDOM;
    },
  },

  horizontal_rule: {
    group: "block",
    parseDOM: [{ tag: "hr" }],
    toDOM() {
      return hrDOM;
    },
  },
  heading: {
    attrs: { level: { default: 1 } },
    content: "inline*",
    group: "block",
    defining: true,
    parseDOM: [
      { tag: "h1", attrs: { level: 1 } },
      { tag: "h2", attrs: { level: 2 } },
      { tag: "h3", attrs: { level: 3 } },
      { tag: "h4", attrs: { level: 4 } },
      { tag: "h5", attrs: { level: 5 } },
      { tag: "h6", attrs: { level: 6 } },
    ],
    toDOM(node) {
      return ["div", {}, ["h" + node.attrs.level, { style: "color:red" }, 0]];
    },
  },
  text: {
    group: "inline",
  },
  image: {
    inline: true,
    attrs: {
      src: {},
      alt: { default: null },
      title: { default: null },
    },
    group: "inline",
    draggable: false,
    parseDOM: [
      {
        tag: "img[src]",
        getAttrs(dom) {
          return {
            src: dom.getAttribute("src"),
            title: dom.getAttribute("title"),
            alt: dom.getAttribute("alt"),
          };
        },
      },
    ],
    toDOM(node) {
      return ["img", node.attrs];
    },
  },

  // :: NodeSpec A hard line break, represented in the DOM as `<br>`.
  hard_break: {
    inline: true,
    group: "inline",
    selectable: false,
    parseDOM: [{ tag: "br" }],
    toDOM() {
      return brDOM;
    },
  },
};

const emDOM = ["em", 0],
  strongDOM = ["strong", 0],
  // Define the codeDOM with reduced text size and custom text color
  codeDOM = [
    "code",
    {
      style:
        "font-size: 0.8em; color: #f54562; background-color: #ebeced; padding:1px 6px; border-radius:2px",
    },
    0,
  ],
  underlineDom = ["u", 0];

// :: Object [Specs](#model.MarkSpec) for the marks in the schema.
export const marks = {
  // :: MarkSpec A link. Has `href` and `title` attributes. `title`
  // defaults to the empty string. Rendered and parsed as an `<a>`
  // element.
  tag: {
    inline: true,
    attrs: {
      tag: {},
    },
    parseDOM: [{ tag: "tag" }],
    toDOM(node) {
      return [
        "tag",
        {
          "data-tag": node.attrs.tag,
        },
        0,
      ];
    },
  },
  underline: {
    parseDOM: [{ tag: "u" }],
    toDOM() {
      return underlineDom;
    },
  },
  strike: {
    parseDOM: [{ tag: "s" }, { tag: "strike" }],
    toDOM() {
      return ["s", 0];
    },
  },

  link: {
    attrs: {
      href: {},
      title: { default: null },
    },
    inclusive: false,
    parseDOM: [
      {
        tag: "a[href]",
        getAttrs(dom) {
          return {
            href: dom.getAttribute("href"),
            title: dom.getAttribute("title"),
          };
        },
      },
    ],
    toDOM(node) {
      return ["a", node.attrs, 0];
    },
  },
  color: {
    attrs: {
      color: {},
    },
    inclusive: false,
    parseDOM: [{ tag: "span" }],
    toDOM(node) {
      return ["span", { style: `color:${node.attrs.color}` }, 0];
    },
  },
  // :: MarkSpec An emphasis mark. Rendered as an `<em>` element.
  // Has parse rules that also match `<i>` and `font-style: italic`.
  em: {
    parseDOM: [{ tag: "i" }, { tag: "em" }, { style: "font-style=italic" }],
    toDOM() {
      return emDOM;
    },
  },

  // :: MarkSpec A strong mark. Rendered as `<strong>`, parse rules
  // also match `<b>` and `font-weight: bold`.
  strong: {
    parseDOM: [
      { tag: "strong" },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      {
        tag: "b",
        getAttrs: (node) => node.style.fontWeight != "normal" && null,
      },
      {
        style: "font-weight",
        getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
      },
    ],
    toDOM() {
      return strongDOM;
    },
  },

  // :: MarkSpec Code font mark. Represented as a `<code>` element.
  code: {
    parseDOM: [{ tag: "code" }],
    toDOM() {
      return codeDOM;
    },
  },
};

export const schema = new Schema({ nodes, marks });
