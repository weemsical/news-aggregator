import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleReader } from "../ArticleReader";
import { AnonymizedArticle } from "@types";
import * as apiClient from "../apiClient";
import * as selectionModule from "../getSelectionInfo";
import * as authContext from "../AuthContext";

jest.mock("../apiClient");
jest.mock("../AuthContext", () => ({
  useAuth: jest.fn(),
}));

const mockUseAuth = authContext.useAuth as jest.MockedFunction<typeof authContext.useAuth>;
const mockFetchHighlights = apiClient.fetchHighlights as jest.MockedFunction<typeof apiClient.fetchHighlights>;
const mockCreateHighlight = apiClient.createHighlight as jest.MockedFunction<typeof apiClient.createHighlight>;

const article: AnonymizedArticle = {
  id: "reader-1",
  rawArticleId: "reader-1",
  title: "Full Article Title",
  subtitle: "The subtitle",
  body: [
    "First paragraph of the article.",
    "Second paragraph continues here.",
    "Third paragraph wraps up.",
  ],
  sourceTags: ["politics", "economy"],
  fetchedAt: 1738000000000,
  reviewStatus: "approved",
  propagandaScore: 0,
};

const loggedInUser = { id: "user-1", email: "test@example.com" };
const mockAuth = {
  user: loggedInUser,
  loading: false,
  login: jest.fn(),
  signup: jest.fn(),
  logout: jest.fn(),
};

jest.spyOn(selectionModule, "getSelectionInfo").mockReturnValue(null);

beforeEach(() => {
  mockFetchHighlights.mockResolvedValue([]);
  mockCreateHighlight.mockReset();
  mockUseAuth.mockReturnValue(mockAuth);
});

describe("ArticleReader", () => {
  it("renders the article title", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("Full Article Title")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
  });

  it("renders the subtitle", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("The subtitle")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
  });

  it("does not render subtitle when absent", async () => {
    const noSub: AnonymizedArticle = { ...article, subtitle: undefined };
    render(<ArticleReader article={noSub} onBack={() => {}} />);
    expect(screen.queryByText("The subtitle")).not.toBeInTheDocument();
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
  });

  it("renders every body paragraph", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("First paragraph of the article.")).toBeInTheDocument();
    expect(screen.getByText("Second paragraph continues here.")).toBeInTheDocument();
    expect(screen.getByText("Third paragraph wraps up.")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
  });

  it("renders source tags", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    expect(screen.getByText("politics")).toBeInTheDocument();
    expect(screen.getByText("economy")).toBeInTheDocument();
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
  });

  it("calls onBack when back button is clicked", async () => {
    const handleBack = jest.fn();
    render(<ArticleReader article={article} onBack={handleBack} />);
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
  });

  it("renders highlights when API returns highlights", async () => {
    mockFetchHighlights.mockResolvedValue([
      {
        id: "h-1",
        articleId: "reader-1",
        userId: "user-1",
        paragraphIndex: 1,
        startOffset: 0,
        endOffset: 16,
        highlightedText: "Second paragraph",
        explanation: "Test explanation",
        isEdited: false,
        originalExplanation: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
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

  it("does not render highlights when API returns none", async () => {
    mockFetchHighlights.mockResolvedValue([]);

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(0);
  });

  it("shows popover when text is selected on mouseup", async () => {
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "paragraph of the",
      rect: mockRect,
      paragraphIndex: 0,
      startOffset: 6,
      endOffset: 23,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());

    const body = container.querySelector(".article-reader__body")!;
    fireEvent.mouseUp(body);

    expect(screen.getByText("paragraph of the")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
  });

  it("hides popover when cancel is clicked", async () => {
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "some text",
      rect: mockRect,
      paragraphIndex: 0,
      startOffset: 0,
      endOffset: 9,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);
    expect(screen.getByRole("textbox")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});

describe("ArticleReader — auth & toggle", () => {
  it("shows simple toggle when logged out", async () => {
    mockUseAuth.mockReturnValue({ ...mockAuth, user: null });
    render(<ArticleReader article={article} onBack={() => {}} />);
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Show highlights")).toBeInTheDocument();
  });

  it("shows highlight toggle when logged in", async () => {
    render(<ArticleReader article={article} onBack={() => {}} />);
    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
    expect(screen.getByRole("radiogroup", { name: "Highlight view" })).toBeInTheDocument();
  });

  it("does not show highlights when logged out", async () => {
    mockUseAuth.mockReturnValue({ ...mockAuth, user: null });
    mockFetchHighlights.mockResolvedValue([
      {
        id: "h-1",
        articleId: "reader-1",
        userId: "user-1",
        paragraphIndex: 1,
        startOffset: 0,
        endOffset: 16,
        highlightedText: "Second paragraph",
        explanation: "Test",
        isEdited: false,
        originalExplanation: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());
    const marks = container.querySelectorAll("mark");
    expect(marks).toHaveLength(0);
  });

  it("hides highlights when toggle is set to None", async () => {
    mockFetchHighlights.mockResolvedValue([
      {
        id: "h-1",
        articleId: "reader-1",
        userId: "user-1",
        paragraphIndex: 1,
        startOffset: 0,
        endOffset: 16,
        highlightedText: "Second paragraph",
        explanation: "Test",
        isEdited: false,
        originalExplanation: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelectorAll("mark")).toHaveLength(1);
    });

    await userEvent.click(screen.getByText("None"));

    await waitFor(() => {
      expect(container.querySelectorAll("mark")).toHaveLength(0);
    });
  });

  it("defaults to My Highlights and shows only own highlights", async () => {
    mockFetchHighlights.mockResolvedValue([
      {
        id: "h-1",
        articleId: "reader-1",
        userId: "user-1",
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 15,
        highlightedText: "First paragraph",
        explanation: "Mine",
        isEdited: false,
        originalExplanation: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "h-2",
        articleId: "reader-1",
        userId: "other-user",
        paragraphIndex: 1,
        startOffset: 0,
        endOffset: 16,
        highlightedText: "Second paragraph",
        explanation: "Theirs",
        isEdited: false,
        originalExplanation: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => {
      const marks = container.querySelectorAll("mark");
      expect(marks).toHaveLength(1);
      expect(marks[0].textContent).toBe("First paragraph");
    });
  });

  it("shows all highlights when toggled to All Highlights", async () => {
    mockFetchHighlights.mockResolvedValue([
      {
        id: "h-1",
        articleId: "reader-1",
        userId: "user-1",
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 15,
        highlightedText: "First paragraph",
        explanation: "Mine",
        isEdited: false,
        originalExplanation: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        id: "h-2",
        articleId: "reader-1",
        userId: "other-user",
        paragraphIndex: 1,
        startOffset: 0,
        endOffset: 16,
        highlightedText: "Second paragraph",
        explanation: "Theirs",
        isEdited: false,
        originalExplanation: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ]);

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => {
      expect(container.querySelectorAll("mark")).toHaveLength(1);
    });

    await userEvent.click(screen.getByText("All Highlights"));

    await waitFor(() => {
      expect(container.querySelectorAll("mark")).toHaveLength(2);
    });
  });

  it("shows anonymous popover when logged out", async () => {
    mockUseAuth.mockReturnValue({ ...mockAuth, user: null });
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "paragraph of the",
      rect: mockRect,
      paragraphIndex: 0,
      startOffset: 6,
      endOffset: 23,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /mark as propaganda/i })).toBeInTheDocument();
    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
  });

  it("auto-enables highlights after anonymous user creates one", async () => {
    mockUseAuth.mockReturnValue({ ...mockAuth, user: null });
    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "First",
      rect: mockRect,
      paragraphIndex: 0,
      startOffset: 0,
      endOffset: 5,
    });

    mockCreateHighlight.mockResolvedValueOnce({
      id: "h-new",
      articleId: "reader-1",
      userId: "anon",
      paragraphIndex: 0,
      startOffset: 0,
      endOffset: 5,
      highlightedText: "First",
      explanation: "",
      isEdited: false,
      originalExplanation: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);
    await userEvent.click(screen.getByRole("button", { name: /mark as propaganda/i }));

    await waitFor(() => {
      const marks = container.querySelectorAll("mark");
      expect(marks).toHaveLength(1);
      expect(marks[0].textContent).toBe("First");
    });
  });

  it("shows error message when highlight creation fails", async () => {
    mockCreateHighlight.mockRejectedValueOnce(new Error("Too many highlights"));

    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock).mockReturnValueOnce({
      text: "First",
      rect: mockRect,
      paragraphIndex: 0,
      startOffset: 0,
      endOffset: 5,
    });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);
    await userEvent.type(screen.getByRole("textbox"), "Loaded language");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
      expect(screen.getByText(/failed to save highlight/i)).toBeInTheDocument();
    });
  });

  it("clears error message when popover is dismissed", async () => {
    mockCreateHighlight.mockRejectedValueOnce(new Error("Server error"));

    const mockRect = { top: 50, left: 100, bottom: 70, right: 200 } as DOMRect;
    (selectionModule.getSelectionInfo as jest.Mock)
      .mockReturnValueOnce({
        text: "First",
        rect: mockRect,
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 5,
      })
      .mockReturnValueOnce({
        text: "Second",
        rect: mockRect,
        paragraphIndex: 0,
        startOffset: 0,
        endOffset: 6,
      });

    const { container } = render(
      <ArticleReader article={article} onBack={() => {}} />
    );

    await waitFor(() => expect(mockFetchHighlights).toHaveBeenCalled());

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);
    await userEvent.type(screen.getByRole("textbox"), "Loaded language");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    fireEvent.mouseUp(container.querySelector(".article-reader__body")!);

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
