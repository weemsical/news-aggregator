export interface SelectionInfo {
  text: string;
  rect: DOMRect;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
}

function snapToWordBoundaries(
  text: string,
  start: number,
  end: number
): { start: number; end: number } {
  // Expand start to beginning of word
  let snappedStart = start;
  while (snappedStart > 0 && !/\s/.test(text[snappedStart - 1])) {
    snappedStart--;
  }

  // Expand end to end of word
  let snappedEnd = end;
  while (snappedEnd < text.length && !/\s/.test(text[snappedEnd])) {
    snappedEnd++;
  }

  return { start: snappedStart, end: snappedEnd };
}

export function getSelectionInfo(containerRef?: HTMLElement | null): SelectionInfo | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) return null;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Find the paragraph element containing the selection
  let node: Node | null = range.startContainer;
  let paragraphEl: HTMLElement | null = null;

  while (node && node !== containerRef) {
    if (node instanceof HTMLElement && node.hasAttribute("data-paragraph-index")) {
      paragraphEl = node;
      break;
    }
    node = node.parentNode;
  }

  if (!paragraphEl) return null;

  const paragraphIndex = parseInt(paragraphEl.getAttribute("data-paragraph-index")!, 10);
  const paragraphText = paragraphEl.textContent || "";

  // Calculate offsets within the paragraph text
  const preRange = document.createRange();
  preRange.selectNodeContents(paragraphEl);
  preRange.setEnd(range.startContainer, range.startOffset);
  const rawStart = preRange.toString().length;
  const rawEnd = rawStart + sel.toString().length;

  // Snap to word boundaries
  const { start: startOffset, end: endOffset } = snapToWordBoundaries(
    paragraphText,
    rawStart,
    rawEnd
  );

  const snappedText = paragraphText.slice(startOffset, endOffset);

  return {
    text: snappedText,
    rect,
    paragraphIndex,
    startOffset,
    endOffset,
  };
}
