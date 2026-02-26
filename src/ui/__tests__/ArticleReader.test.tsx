import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleReader } from "../ArticleReader";
import { AnonymizedArticle } from "../../types";
import { FlagStore } from "../../services/FlagStore";
import * as selectionModule from "../getSelectionInfo";

const article: AnonymizedArticle = {
  id: "reader-1",
  title: "Full Article Title",
  subtitle: "The subtitle",
  body: [
    "First paragraph of the article.",
    "Second paragraph continues here.",
    "Third paragraph wraps up.",
  ],
  sourceTags: ["politics", "economy"],
  fetchedAt: 1738000000000,
};

// Mock the selection utility — jsdom can't do real text selection
jest.spyOn(selectionModule, "getSelectionInfo").mockReturnValue(null);

describe("ArticleReader", () => {
  // --- Existing tests (updated with flagStore prop) ---

  it("renders the article title", () => {
    render(
      <ArticleReader article={article} onBack={() => {}} flagStore={new FlagStore()} />
    );
    expect(screen.getByText("Full Article Title")).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(
      <ArticleReader article={article} onBack={() => {}} flagStore={new FlagStore()} />
    );
    expect(screen.getByText("The subtitle")).toBeInTheDocument();
  });

  it("does not render subtitle when absent", () => {
    const noSub: AnonymizedArticle = { ...article, subtitle: undefined };
    render(
      <ArticleReader article={noSub} onBack={() => {}} flagStore={new FlagStore()} />
    );
    expect(screen.queryByText("The subtitle")).not.toBeInTheDocument();
  });

  it("renders every body paragraph", () => {
    render(
      <ArticleReader article={article} onBack={() => {}} flagStore={new FlagStore()} />
    );
    expect(screen.getByText("First paragraph of the article.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph continues here.")).toBeInTheDocument();
    expect(screen.getByText("Third paragraph wraps up.")).toBeInTheDocument();
  });

  it("renders source tags", () => {
    render(
      <ArticleReader article={article} onBack={() => {}} flagStore={new FlagStore()} />
    );
    expect(screen.getByText("politics")).toBeInTheDocument();
    expect(screen.getByText("economy")).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    const handleBack = jest.fn();
    render(
      <ArticleReader article={article} onBack={handleBack} flagStore={new FlagStore()} />
    );
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  // --- New: highlight rendering tests ---

  it("renders highlights when flagStore has matching flags", () => {
    const store = new FlagStore();
    store.add({
      id: "flag-1",
      articleId: "reader-1",
      highlightedText: "Second paragraph",
      explanation: "Test explanation",
      timestamp: Date.now(),
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} flagStore={store} />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("Second paragraph");
  });

  it("does not render highlights when flagStore is empty", () => {
    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} flagStore={new FlagStore()} />
    );

    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(0);
  });

  // --- New: popover tests ---

  it("shows popover when text is selected on mouseup", () => {
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "paragraph of the",
      rect: mockRect,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} flagStore={new FlagStore()} />
    );

    const body = container.querySelector(".article-reader__body")!;
    fireEvent.mouseUp(body);

    expect(screen.getByText("paragraph of the")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("hides popover and adds highlight after submitting a flag", async () => {
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "First paragraph",
      rect: mockRect,
    });

    const store = new FlagStore();
    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} flagStore={store} />
    );

    // Trigger selection popover
    const body = container.querySelector(".article-reader__body")!;
    fireEvent.mouseUp(body);

    // Type explanation and submit
    await userEvent.type(screen.getByRole("textbox"), "Loaded language");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Popover should be gone
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();

    // Highlight should appear
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(1);
    expect(marks[0].textContent).toBe("First paragraph");

    // FlagStore should have the flag
    expect(store.count).toBe(1);
  });

  it("hides popover when cancel is clicked", async () => {
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "some text",
      rect: mockRect,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} flagStore={new FlagStore()} />
    );

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
