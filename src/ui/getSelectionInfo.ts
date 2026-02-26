export interface SelectionInfo {
  text: string;
  rect: DOMRect;
}

export function getSelectionInfo(): SelectionInfo | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.toString().trim()) return null;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  return { text: sel.toString(), rect };
}
