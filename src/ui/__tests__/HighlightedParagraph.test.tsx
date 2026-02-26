import { render, screen } from "@testing-library/react";
import { HighlightedParagraph } from "../HighlightedParagraph";

describe("HighlightedParagraph", () => {
  it("renders plain text when there are no flags", () => {
    render(<HighlightedParagraph text="A normal paragraph." flags={[]} />);
    expect(screen.getByText("A normal paragraph.")).toBeInTheDocument();
    expect(screen.queryByRole("mark")).not.toBeInTheDocument();
  });

  it("renders plain text when no flags match", () => {
    render(
      <HighlightedParagraph
        text="A normal paragraph."
        flags={[{ highlightedText: "not here", id: "f1" }]}
      />
    );
    expect(screen.getByText("A normal paragraph.")).toBeInTheDocument();
  });

  it("wraps matching text in a mark element", () => {
    const { container } = render(
      <HighlightedParagraph
        text="The witness accused the committee of bias."
        flags={[{ highlightedText: "accused the committee", id: "f1" }]}
      />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("accused the committee");
  });

  it("renders multiple highlights in the same paragraph", () => {
    const { container } = render(
      <HighlightedParagraph
        text="The radical plan will destroy jobs and ruin the economy."
        flags={[
          { highlightedText: "radical plan", id: "f1" },
          { highlightedText: "ruin the economy", id: "f2" },
        ]}
      />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
    expect(marks[0].textContent).toBe("radical plan");
    expect(marks[1].textContent).toBe("ruin the economy");
  });

  it("preserves surrounding text around highlights", () => {
    render(
      <HighlightedParagraph
        text="Critics say the policy is reckless."
        flags={[{ highlightedText: "reckless", id: "f1" }]}
      />
    );

    expect(screen.getByText(/Critics say the policy is/)).toBeInTheDocument();
    expect(screen.getByText("reckless")).toBeInTheDocument();
  });
});
