import { render, screen } from "@testing-library/react";
import { SourceLeaderboard } from "../SourceLeaderboard";
import { LeaderboardEntry } from "../../types";

const entries: LeaderboardEntry[] = [
  { sourceId: "fox-news", sourceName: "Fox News", flagCount: 10 },
  { sourceId: "cnn", sourceName: "CNN", flagCount: 6 },
  { sourceId: "bbc", sourceName: "BBC News", flagCount: 3 },
];

describe("SourceLeaderboard", () => {
  it("renders source names in order", () => {
    render(<SourceLeaderboard entries={entries} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Fox News");
    expect(items[1]).toHaveTextContent("CNN");
    expect(items[2]).toHaveTextContent("BBC News");
  });

  it("renders flag counts with correct labels", () => {
    render(<SourceLeaderboard entries={entries} />);
    expect(screen.getByText("10 flags")).toBeInTheDocument();
    expect(screen.getByText("6 flags")).toBeInTheDocument();
    expect(screen.getByText("3 flags")).toBeInTheDocument();
  });

  it("uses singular 'flag' for count of 1", () => {
    const single: LeaderboardEntry[] = [
      { sourceId: "bbc", sourceName: "BBC News", flagCount: 1 },
    ];
    render(<SourceLeaderboard entries={single} />);
    expect(screen.getByText("1 flag")).toBeInTheDocument();
  });

  it("shows empty state when no entries", () => {
    render(<SourceLeaderboard entries={[]} />);
    expect(screen.getByText(/no flags yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders visual bars proportional to max count", () => {
    const { container } = render(<SourceLeaderboard entries={entries} />);
    const bars = container.querySelectorAll(".source-leaderboard__bar");
    expect(bars).toHaveLength(3);
    expect((bars[0] as HTMLElement).style.width).toBe("100%");
    expect((bars[1] as HTMLElement).style.width).toBe("60%");
    expect((bars[2] as HTMLElement).style.width).toBe("30%");
  });

  it("renders rank numbers", () => {
    render(<SourceLeaderboard entries={entries} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
