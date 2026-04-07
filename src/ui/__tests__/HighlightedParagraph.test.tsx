import { render, screen } from "@testing-library/react";
import { HighlightedParagraph } from "../HighlightedParagraph";

describe("HighlightedParagraph", () => {
  it("renders plain text when there are no highlights", () => {
    render(<HighlightedParagraph text="A normal paragraph." paragraphIndex={0} highlights={[]} />);
    expect(screen.getByText("A normal paragraph.")).toBeInTheDocument();
    expect(screen.queryByRole("mark")).not.toBeInTheDocument();
  });

  it("renders plain text when highlights array is empty", () => {
    render(
      <HighlightedParagraph
        text="A normal paragraph."
        paragraphIndex={0}
        highlights={[]}
      />
    );
    expect(screen.getByText("A normal paragraph.")).toBeInTheDocument();
  });

  it("wraps correct offset range in mark element", () => {
    const { container } = render(
      <HighlightedParagraph
        text="The witness accused the committee of bias."
        paragraphIndex={0}
        highlights={[{ id: "h1", startOffset: 12, endOffset: 33 }]}
      />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("accused the committee");
  });

  it("renders multiple highlights in same paragraph", () => {
    const { container } = render(
      <HighlightedParagraph
        text="The radical plan will destroy jobs and ruin the economy."
        paragraphIndex={0}
        highlights={[
          { id: "h1", startOffset: 4, endOffset: 16 },
          { id: "h2", startOffset: 39, endOffset: 55 },
        ]}
      />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
    expect(marks[0].textContent).toBe("radical plan");
    expect(marks[1].textContent).toBe("ruin the economy");
  });

  it("preserves surrounding text around highlights", () => {
    const { container } = render(
      <HighlightedParagraph
        text="Critics say the policy is reckless."
        paragraphIndex={0}
        highlights={[{ id: "h1", startOffset: 26, endOffset: 34 }]}
      />
    );

    expect(container.textContent).toBe("Critics say the policy is reckless.");
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("reckless");
  });

  it("sets data-paragraph-index attribute", () => {
    const { container } = render(
      <HighlightedParagraph text="Paragraph text." paragraphIndex={3} highlights={[]} />
    );

    const p = container.querySelector("p");
    expect(p).toHaveAttribute("data-paragraph-index", "3");
  });
});
