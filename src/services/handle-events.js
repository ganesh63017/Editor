export function handleEnterEvent(view, event) {
  if (event.key === "Enter" || event.key === "Tab") {
    const suggestionList = document.querySelector(".suggestion-item-list");
    if (suggestionList) {
      const selectedSuggestion = suggestionList.querySelector(
        ".suggestion-item.suggestion-item-active"
      );
      if (selectedSuggestion) {
        const suggestionText = selectedSuggestion.innerText;
        const { from, to } = view.state.selection;
        const tr = view.state.tr;

        // Determine the start position of the typed text
        const start = from;

        // Determine the end position of the typed text
        const end = from;

        // Get the text before the @ symbol
        const prevText = tr.doc.textBetween(Math.max(0, start - 1), start); // Get the character before the @

        // Check if the previous text includes @
        if (prevText.includes("@")) {
          // Append the suggestion text to the existing text after the last @
          const existingText = tr.doc.textBetween(0, start);
          const newText =
            existingText.substring(existingText.lastIndexOf("@")) +
            suggestionText +
            " ";

          // Replace the typed text with the combined text
          tr.replaceWith(0, end, view.state.schema.text(newText));

          // Dispatch the transaction to update the editor state
          view.dispatch(tr);

          // Remove suggestion list after selection
          suggestionList.remove();

          return true; // Prevent default behavior
        } else {
          // Append the suggestion text to the existing text, if any
          const existingText = tr.doc.textBetween(start, end);
          const newText = existingText
            ? `@${suggestionText} ` + " "
            : `${suggestionText}` + " ";

          // Replace the typed text with the combined text
          tr.replaceWith(start - 1, end, view.state.schema.text(newText));

          // Dispatch the transaction to update the editor state
          view.dispatch(tr);

          // Remove suggestion list after selection
          suggestionList.remove();

          return true; // Prevent default behavior
        }
      }
    }
  }
  return false;
}
