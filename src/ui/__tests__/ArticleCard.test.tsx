import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ArticleCard } from "../ArticleCard";
import { AnonymizedArticle } from "../../types";

const sampleArticle: AnonymizedArticle = {
  id: "test-1",
  rawArticleId: "test-1",
  reviewStatus: "approved",
  propagandaScore: 0,
  title: "Test Article Title",
  subtitle: "Test subtitle here",
  body: ["Paragraph one.", "Paragraph two.", "Paragraph three."],
  sourceTags: ["politics", "economy"],
  fetchedAt: 1738000000000,
};

describe("ArticleCard", () => {
  it("renders the article title", () => {
    render(<ArticleCard article={sampleArticle} onSelect={() => {}} />);
    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
  });

  it("renders the subtitle when present", () => {
    render(<ArticleCard article={sampleArticle} onSelect={() => {}} />);
    expect(screen.getByText("Test subtitle here")).toBeInTheDocument();
  });

  it("does not render a subtitle element when subtitle is absent", () => {
    const noSubtitle: AnonymizedArticle = { ...sampleArticle, subtitle: undefined };
    render(<ArticleCard article={noSubtitle} onSelect={() => {}} />);
    expect(screen.queryByText("Test subtitle here")).not.toBeInTheDocument();
  });

  it("renders source tags", () => {
    render(<ArticleCard article={sampleArticle} onSelect={() => {}} />);
    expect(screen.getByText("politics")).toBeInTheDocument();
    expect(screen.getByText("economy")).toBeInTheDocument();
  });

  it("renders the fetchedAt date", () => {
    render(<ArticleCard article={sampleArticle} onSelect={() => {}} />);
    // 1738000000000 = Jan 27, 2025
    expect(screen.getByText(/jan.*27.*2025/i)).toBeInTheDocument();
  });

  it("calls onSelect with the article id when clicked", async () => {
    const handleSelect = jest.fn();
    render(<ArticleCard article={sampleArticle} onSelect={handleSelect} />);
    await userEvent.click(screen.getByRole("article"));
    expect(handleSelect).toHaveBeenCalledWith("test-1");
  });
});
