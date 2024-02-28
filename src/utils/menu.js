import {
  wrapItem,
  blockTypeItem,
  Dropdown,
  joinUpItem,
  liftItem,
  selectParentNodeItem,
  undoItem,
  redoItem,
  icons,
  MenuItem,
} from "prosemirror-menu";
import { NodeSelection } from "prosemirror-state";
import { toggleMark } from "prosemirror-commands";
import { wrapInList } from "prosemirror-schema-list";
import { Button, FileField, TextField, openPrompt } from "./prompt";

const customIcon = {
  underline_icon: {
    height: 22,
    width: 18,
    path: "M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z",

    // SVG path data for the underline icon
  },
  strike_line_icon: {
    height: 22,
    width: 18,
    path: "M 6.85 7.08 C 6.85 4.37 9.45 3 12.24 3 c 1.64 0 3 0.49 3.9 1.28 c 0.77 0.65 1.46 1.73 1.46 3.24 h -3.01 c 0 -0.31 -0.05 -0.59 -0.15 -0.85 c -0.29 -0.86 -1.2 -1.28 -2.25 -1.28 c -1.86 0 -2.34 1.02 -2.34 1.7 c 0 0.48 0.25 0.88 0.74 1.21 c 0.38 0.25 0.77 0.48 1.41 0.7 H 7.39 c -0.21 -0.34 -0.54 -0.89 -0.54 -1.92 Z M 21 12 v -2 H 3 v 2 h 9.62 c 1.15 0.45 1.96 0.75 1.96 1.97 c 0 1 -0.81 1.67 -2.28 1.67 c -1.54 0 -2.93 -0.54 -2.93 -2.51 H 6.4 c 0 0.55 0.08 1.13 0.24 1.58 c 0.81 2.29 3.29 3.3 5.67 3.3 c 2.27 0 5.3 -0.89 5.3 -4.05 c 0 -0.3 -0.01 -1.16 -0.48 -1.94 H 21 V 12 Z",
  },
};

// Helpers to create specific types of items

function canInsert(state, nodeType) {
  let $from = state.selection.$from;
  for (let d = $from.depth; d >= 0; d--) {
    let index = $from.index(d);
    if ($from.node(d).canReplaceWith(index, index, nodeType)) return true;
  }
  return false;
}

function insertImage(view, fileOrUrl, title, alt, form) {
  if (fileOrUrl instanceof File) {
    // If a file is selected, read it as a Data URL
    let reader = new FileReader();
    reader.onload = (e) => {
      const attrs = {
        src: e.target.result, // Data URL of the image
        title: title,
        alt: alt,
      };
      // Create a new image node and insert it into the document
      const imageNode = view.state.schema.nodes.image.create(attrs);
      const tr = view.state.tr.replaceSelectionWith(imageNode);
      view.dispatch(tr);
      view.focus();
    };
    reader.readAsDataURL(fileOrUrl);
  } else if (typeof fileOrUrl === "string") {
    // If a URL is provided, create an image node with the URL
    const attrs = {
      src: fileOrUrl,
      title: title,
      alt: alt,
    };
    const imageNode = view.state.schema.nodes.image.create(attrs);
    const tr = view.state.tr.replaceSelectionWith(imageNode);
    view.dispatch(tr);
    view.focus();
  }
}

function insertImageItem(nodeType) {
  return new MenuItem({
    title: "Insert image",
    label: "Image",
    enable(state) {
      return canInsert(state, nodeType);
    },
    run(state, _, view) {
      let { from, to } = state.selection,
        attrs = null;
      if (
        state.selection instanceof NodeSelection &&
        state.selection.node.type == nodeType
      )
        attrs = state.selection.node.attrs;
      openPrompt({
        title: "Insert image",
        fields: {
          src: new FileField({
            id: "imageselector",
            label: "Select Image",
            accept: "image/*",
            callback: (attrs, form) => {
              insertImage(view, attrs.src, attrs.title, attrs.alt, form);
            },
          }),
          button: new Button({
            label: "Submt",
          }),
        },
        callback(attrs) {
          if (attrs) {
            view.dispatch(
              view.state.tr.replaceSelectionWith(nodeType.createAndFill(attrs))
            );
          }

          view.focus();
        },
      });
    },
  });
}

function cmdItem(cmd, options) {
  let passedOptions = {
    label: options.title,
    run: cmd,
  };
  for (let prop in options) passedOptions[prop] = options[prop];
  if ((!options.enable || options.enable === true) && !options.select)
    passedOptions[options.enable ? "enable" : "select"] = (state) => cmd(state);

  return new MenuItem(passedOptions);
}

function markActive(state, type) {
  let { from, $from, to, empty } = state.selection;
  if (empty) return type.isInSet(state.storedMarks || $from.marks());
  else return state.doc.rangeHasMark(from, to, type);
}

function markItem(markType, options) {
  let passedOptions = {
    active(state) {
      return markActive(state, markType);
    },
    enable: true,
  };
  for (let prop in options) passedOptions[prop] = options[prop];
  return cmdItem(toggleMark(markType), passedOptions);
}

function colorItem(markType) {
  return new MenuItem({
    title: "change color",
    icon: customIcon.color_change,
    active(state) {
      return markActive(state, markType);
    },
    enable(state) {
      return !state.selection.empty;
    },
    run(state, dispatch, view) {
      if (markActive(state, markType)) {
        toggleMark(markType)(state, dispatch);
        return true;
      }
      toggleMark(markType, { color: "red" })(state, dispatch);
    },
  });
}
function linkItem(markType) {
  return new MenuItem({
    title: "Add or remove link",
    icon: icons.link,
    active(state) {
      return markActive(state, markType);
    },
    enable(state) {
      return !state.selection.empty;
    },
    run(state, dispatch, view) {
      if (markActive(state, markType)) {
        toggleMark(markType)(state, dispatch);
        return true;
      }
      openPrompt({
        title: "Create a link",
        fields: {
          href: new TextField({
            label: "Link target",
            required: true,
          }),
          title: new TextField({ label: "Title" }),
        },
        callback(attrs) {
          toggleMark(markType, attrs)(view.state, view.dispatch);
          view.focus();
        },
      }); // itemsOfMenu.toggleColor,
    },
  });
}

function wrapListItem(nodeType, options) {
  return cmdItem(wrapInList(nodeType, options.attrs), options);
}

export function buildMenuItems(schema) {
  let itemsOfMenu = {},
    type;
  if ((type = schema.marks.strong))
    itemsOfMenu.toggleStrong = markItem(type, {
      title: "Toggle strong style",
      icon: icons.strong,
    });
  if ((type = schema.marks.em))
    itemsOfMenu.toggleEm = markItem(type, {
      title: "Toggle emphasis",
      icon: icons.em,
    });
  if ((type = schema.marks.code))
    itemsOfMenu.toggleCode = markItem(type, {
      title: "Toggle code font",
      icon: icons.code,
    });
  if ((type = schema.marks.strike))
    itemsOfMenu.strike_line = markItem(type, {
      title: "Strike_line",
      icon: customIcon.strike_line_icon,
      label: "S",
    });
  if ((type = schema.marks.underline))
    itemsOfMenu.underline_line = markItem(type, {
      title: "Underline",
      icon: customIcon.underline_icon,
    });
  if ((type = schema.marks.link)) itemsOfMenu.toggleLink = linkItem(type);
  if ((type = schema.nodes.image))
    itemsOfMenu.insertImage = insertImageItem(type);
  if ((type = schema.nodes.bullet_list))
    itemsOfMenu.wrapBulletList = wrapListItem(type, {
      title: "Wrap in bullet list",
      icon: icons.bulletList,
    });
  if ((type = schema.nodes.ordered_list))
    itemsOfMenu.wrapOrderedList = wrapListItem(type, {
      title: "Wrap in ordered list",
      icon: icons.orderedList,
    });
  if ((type = schema.nodes.blockquote))
    itemsOfMenu.wrapBlockQuote = wrapItem(type, {
      title: "Wrap in block quote",
      icon: icons.blockquote,
    });
  if ((type = schema.nodes.paragraph))
    itemsOfMenu.makeParagraph = blockTypeItem(type, {
      title: "Change to paragraph",
      label: "Plain",
    });
  if (type === schema.nodes.code_block)
    itemsOfMenu.makeCodeBlock = blockTypeItem(type, {
      title: "Change to code block",
      label: "Code",
      class: "code-block-item",
    });
  if ((type = schema.nodes.heading))
    for (let i = 1; i <= 10; i++)
      itemsOfMenu["makeHead" + i] = blockTypeItem(type, {
        title: "Change to heading " + i,
        label: "Heading " + i,
        attrs: { level: i },
      });
  if ((type = schema.nodes.horizontal_rule)) {
    let hr = type;
    itemsOfMenu.insertHorizontalRule = new MenuItem({
      title: "Insert horizontal rule",
      label: "Horizontal rule",
      enable(state) {
        return canInsert(state, hr);
      },
      run(state, dispatch) {
        dispatch(state.tr.replaceSelectionWith(hr.create()));
      },
    });
  }
  let cut = (arr) => arr.filter((x) => x);
  itemsOfMenu.insertMenu = new Dropdown(
    cut([itemsOfMenu.insertImage, itemsOfMenu.insertHorizontalRule]),
    {
      label: "Insert",
    }
  );
  // itemsOfMenu.typeMenu = new Dropdown(cut([itemsOfMenu.makeParagraph, itemsOfMenu.makeCodeBlock, itemsOfMenu.makeHead1 && new DropdownSubmenu(cut([
  //   itemsOfMenu.makeHead1, itemsOfMenu.makeHead2, itemsOfMenu.makeHead3, itemsOfMenu.makeHead4, itemsOfMenu.makeHead5, itemsOfMenu.makeHead6
  // ]), {label: "Heading", title:"A", css:"color:blue"})]), {label: "Type..."})
  itemsOfMenu.typeMenu = new Dropdown(
    cut([
      itemsOfMenu.makeParagraph,
      itemsOfMenu.makeCodeBlock,
      itemsOfMenu.makeHead1,
      itemsOfMenu.makeHead2,
      itemsOfMenu.makeHead3,
      itemsOfMenu.makeHead4,
      itemsOfMenu.makeHead5,
      itemsOfMenu.makeHead6,
    ]),
    { label: "Heading...", class: "AAA" }
  );

  itemsOfMenu.inlineMenu = [
    cut([
      itemsOfMenu.toggleStrong,
      itemsOfMenu.toggleEm,
      itemsOfMenu.toggleCode,
      itemsOfMenu.toggleLink,
      itemsOfMenu.underline_line,
      itemsOfMenu.strike_line,
    ]),
  ];
  itemsOfMenu.blockMenu = [
    cut([
      itemsOfMenu.wrapBulletList,
      itemsOfMenu.wrapOrderedList,
      itemsOfMenu.wrapBlockQuote,
      joinUpItem,
      liftItem,
      selectParentNodeItem,
    ]),
  ];
  itemsOfMenu.fullMenu = itemsOfMenu.inlineMenu.concat(
    [[itemsOfMenu.insertMenu, itemsOfMenu.typeMenu]],
    [[undoItem, redoItem]],
    itemsOfMenu.blockMenu
  );

  return itemsOfMenu;
}
