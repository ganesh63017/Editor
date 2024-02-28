import React, { useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema, DOMParser } from "prosemirror-model";
import { addListNodes } from "prosemirror-schema-list";
import { exampleSetup } from "prosemirror-example-setup";
import { menuBar } from "prosemirror-menu";
import { schema } from "./utils/schema";
import { buildMenuItems } from "./utils/menu";
import "../src/styles.css";
import { getMentionsPlugin, mentionNode } from "prosemirror-mentions";
import { mentionsData } from "./data";
import { handleEnterEvent } from "./services/handle-events";

const mentionPlugin = getMentionsPlugin({
  getSuggestions: (type, text, done) => {
    setTimeout(() => {
      if (text.length > 0) {
        if (type === "mention") {
          const filteredMentions = mentionsData.filter((mention) =>
            mention.name.toLowerCase().startsWith(text.toLowerCase())
          );

          if (filteredMentions.length > 0) done(filteredMentions);
          else {
            const suggestionList = document.querySelector(
              ".suggestion-item-list"
            );
            if (suggestionList) suggestionList.remove();
          }
        }
      }
    }, 200);
  },
});

const App = () => {
  const editorRef = useRef(null);
  const contentRef = useRef(null);

  window.ganesh = "ganesh";
  useEffect(() => {
    const mySchema = new Schema({
      nodes: addListNodes(
        schema.spec.nodes,
        "paragraph block*",
        "block"
      ).append({
        mention: mentionNode,
      }),
      marks: schema.spec.marks,
    });

    const plugins = exampleSetup({ schema: mySchema, menuBar: false });

    plugins.push(
      menuBar({
        content: buildMenuItems(mySchema).fullMenu,
      })
    );

    plugins.push(mentionPlugin);

    if (editorRef.current) {
      const view = new EditorView(editorRef.current, {
        state: EditorState.create({
          doc: DOMParser.fromSchema(mySchema).parse(contentRef.current),
          plugins: plugins,
        }),
        handlePaste: (view, event, slice) => {
          console.log(slice);
        },
        handleKeyDown: (view, event) => handleEnterEvent(view, event),
      });

      return () => {
        view.destroy();
      };
    }
  }, []);

  return (
    <div className="App">
      <div style={{ width: "100%", height: 800 }} ref={editorRef}>
        <div ref={contentRef} contentEditable={true} />
      </div>
    </div>
  );
};

export default App;
