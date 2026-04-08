import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleList } from "../ArticleList";
import { AnonymizedArticle } from "@types";

const articles: AnonymizedArticle[] = [
  {
    id: "a1",
    rawArticleId: "a1",
    reviewStatus: "approved",
    propagandaScore: 0,
    title: "First Article",
    body: ["Body one.", "Body two.", "Body three."],
    sourceTags: ["tag1"],
    fetchedAt: 1738000000000,
  },
  {
    id: "a2",
    rawArticleId: "a2",
    reviewStatus: "approved",
    propagandaScore: 0,
    title: "Second Article",
    subtitle: "With subtitle",
    body: ["Body content here."],
    sourceTags: ["tag2"],
    fetchedAt: 1738100000000,
  },
];

describe("ArticleList", () => {
  it("renders a card for each article", () => {
    render(<ArticleList articles={articles} onSelectArticle={() => {}} />);
    expect(screen.getByText("First Article")).toBeInTheDocument();
    expect(screen.getByText("Second Article")).toBeInTheDocument();
  });

  it("renders a message when there are no articles", () => {
    render(<ArticleList articles={[]} onSelectArticle={() => {}} />);
    expect(screen.getByText(/no articles/i)).toBeInTheDocument();
  });

  it("passes onSelectArticle through to cards", async () => {
    const handleSelect = jest.fn();
    render(<ArticleList articles={articles} onSelectArticle={handleSelect} />);
    await userEvent.click(screen.getByText("First Article"));
    expect(handleSelect).toHaveBeenCalledWith("a1");
  });
});
