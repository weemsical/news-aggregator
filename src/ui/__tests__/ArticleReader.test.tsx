import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleReader } from "../ArticleReader";
import { AnonymizedArticle } from "../../types";
import * as apiClient from "../apiClient";
import * as selectionModule from "../getSelectionInfo";

jest.mock("../apiClient");
const mockFetchFlags = apiClient.fetchFlags as jest.MockedFunction<typeof apiClient.fetchFlags>;
const mockCreateFlag = apiClient.createFlag as jest.MockedFunction<typeof apiClient.createFlag>;

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

beforeEach(() => {
  mockFetchFlags.mockResolvedValue([]);
  mockCreateFlag.mockReset();
});

describe("ArticleReader", () => {
  it("renders the article title", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("Full Article Title")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());
  });

  it("renders the subtitle", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("The subtitle")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());
  });

  it("does not render subtitle when absent", async () => {
    const noSub: AnonymizedArticle = { ...article, subtitle: undefined };
    render(<ArticleReader article={noSub} onBack={() => {}} />);
    expect(screen.queryByText("The subtitle")).not.toBeInTheDocument();
    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());
  });

  it("renders every body paragraph", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("First paragraph of the article.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph continues here.")).toBeInTheDocument();
    expect(screen.getByText("Third paragraph wraps up.")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());
  });

  it("renders source tags", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("politics")).toBeInTheDocument();
    expect(screen.getByText("economy")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());
  });

  it("calls onBack when back button is clicked", async () => {
    const handleBack = jest.fn();
    render(<ArticleReader article={article} onBack={handleBack} />);
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());
  });

  it("renders highlights when API returns matching flags", async () => {
    mockFetchFlags.mockResolvedValue([
      {
        id: "flag-1",
        articleId: "reader-1",
        highlightedText: "Second paragraph",
        explanation: "Test explanation",
        timestamp: Date.now(),
      },
    ]);

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => {
      const marks = container.querySelectorAll("mark");
      expect(marks).toHaveLength(1);
      expect(marks[0].textContent).toBe("Second paragraph");
    });
  });

  it("does not render highlights when API returns no flags", async () => {
    mockFetchFlags.mockResolvedValue([]);

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(0);
  });

  it("shows popover when text is selected on mouseup", async () => {
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "paragraph of the",
      rect: mockRect,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());

    const body = container.querySelector(".article-reader__body")!;
    fireEvent.mouseUp(body);

    expect(screen.getByText("paragraph of the")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("hides popover and adds highlight after submitting a flag", async () => {
    mockFetchFlags.mockResolvedValue([]);
    mockCreateFlag.mockResolvedValue({
      id: "flag-new",
      articleId: "reader-1",
      highlightedText: "First paragraph",
      explanation: "Loaded language",
      timestamp: Date.now(),
    });

    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "First paragraph",
      rect: mockRect,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());

    // Trigger selection popover
    const body = container.querySelector(".article-reader__body")!;
    fireEvent.mouseUp(body);

    // Type explanation and submit
    await userEvent.type(screen.getByRole("textbox"), "Loaded language");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    // Popover should be gone
    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    // Highlight should appear
    await waitFor(() => {
      const marks = container.querySelectorAll("mark");
      expect(marks).toHaveLength(1);
      expect(marks[0].textContent).toBe("First paragraph");
    });

    // API should have been called
    expect(mockCreateFlag).toHaveBeenCalledWith("reader-1", {
      highlightedText: "First paragraph",
      explanation: "Loaded language",
    });
  });

  it("hides popover when cancel is clicked", async () => {
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "some text",
      rect: mockRect,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchFlags).toHaveBeenCalled());

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
