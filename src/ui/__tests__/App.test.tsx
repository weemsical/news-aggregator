import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import * as apiClient from "../apiClient";

jest.mock("../articleData", () => ({
  loadArticles: jest.fn().mockResolvedValue([
    {
      id: "mock-1",
      rawArticleId: "mock-1",
      title: "Mock Article One",
      subtitle: "Mock subtitle",
      body: ["Paragraph A.", "Paragraph B.", "Paragraph C."],
      sourceTags: ["testing"],
      fetchedAt: 1738000000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    },
    {
      id: "mock-2",
      rawArticleId: "mock-2",
      title: "Mock Article Two",
      body: ["Content here."],
      sourceTags: ["mock"],
      fetchedAt: 1738100000000,
      reviewStatus: "approved",
      propagandaScore: 0,
    },
  ]),
}));

jest.mock("../apiClient", () => ({
  ...jest.requireActual("../apiClient"),
  fetchCurrentUser: jest.fn(),
  fetchHighlights: jest.fn().mockResolvedValue([]),
  fetchLeaderboard: jest.fn().mockResolvedValue([]),
  fetchAdminFeedSources: jest.fn().mockResolvedValue([]),
}));

const mockFetchCurrentUser = apiClient.fetchCurrentUser as jest.MockedFunction<
  typeof apiClient.fetchCurrentUser
>;
const mockFetchLeaderboard = apiClient.fetchLeaderboard as jest.MockedFunction<
  typeof apiClient.fetchLeaderboard
>;

beforeEach(() => {
  mockFetchCurrentUser.mockResolvedValue(null);
});

describe("App", () => {
  it("renders the app heading", async () => {
    render(<App />);
    expect(screen.getByText(/i call bullshit/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading articles...")).not.toBeInTheDocument();
    });
  });

  it("shows loading state initially", async () => {
    render(<App />);
    expect(screen.getByText("Loading articles...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading articles...")).not.toBeInTheDocument();
    });
  });

  it("renders the article list after loading", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    expect(screen.getByText("Mock Article Two")).toBeInTheDocument();
  });

  it("navigates to reader when an article is clicked", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Mock Article One"));
    expect(screen.getByText("Paragraph A.")).toBeInTheDocument();
    expect(screen.getByText("Paragraph B.")).toBeInTheDocument();
    expect(screen.queryByText("Mock Article Two")).not.toBeInTheDocument();
  });

  it("navigates back to list when back button is clicked", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Mock Article One"));
    await userEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    expect(screen.getByText("Mock Article Two")).toBeInTheDocument();
  });

  it("shows Log In button when not authenticated", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
  });

  it("shows user email and Log Out when authenticated", async () => {
    mockFetchCurrentUser.mockResolvedValue({ id: "u1", email: "test@example.com" });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Log Out" })).toBeInTheDocument();
  });

  it("shows Articles, Leaderboard, and How It Works nav buttons", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Articles" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Leaderboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "How It Works" })).toBeInTheDocument();
  });

  it("switches to How It Works view when clicked", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "How It Works" }));

    await waitFor(() => {
      expect(screen.getByText("What is this?")).toBeInTheDocument();
    });
    expect(screen.queryByText("Mock Article One")).not.toBeInTheDocument();
  });

  it("switches to leaderboard view when Leaderboard is clicked", async () => {
    mockFetchLeaderboard.mockResolvedValue([
      { sourceId: "fox-news", sourceName: "Fox News", flagCount: 5 },
    ]);
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Leaderboard" }));

    await waitFor(() => {
      expect(screen.getByText("Source Leaderboard")).toBeInTheDocument();
    });
    expect(screen.getByText("Fox News")).toBeInTheDocument();
    expect(screen.queryByText("Mock Article One")).not.toBeInTheDocument();
  });

  it("switches back to articles view when Articles is clicked", async () => {
    mockFetchLeaderboard.mockResolvedValue([]);
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Leaderboard" }));
    await waitFor(() => {
      expect(screen.getByText("Source Leaderboard")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Articles" }));
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    expect(screen.queryByText("Source Leaderboard")).not.toBeInTheDocument();
  });

  it("renders the date filter inputs", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("shows article count in the date filter", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    expect(screen.getByText("2 articles")).toBeInTheDocument();
  });

  it("does not show Admin button for non-admin users", async () => {
    mockFetchCurrentUser.mockResolvedValue({ id: "u1", email: "user@example.com" });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("does not show Admin button when logged out", async () => {
    mockFetchCurrentUser.mockResolvedValue(null);
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Mock Article One")).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Admin" })).not.toBeInTheDocument();
  });

  it("shows Admin button for admin users", async () => {
    mockFetchCurrentUser.mockResolvedValue({ id: "u1", email: "admin@example.com", isAdmin: true });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Admin" })).toBeInTheDocument();
  });

  it("switches to admin view when Admin is clicked", async () => {
    mockFetchCurrentUser.mockResolvedValue({ id: "u1", email: "admin@example.com", isAdmin: true });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Admin" }));

    await waitFor(() => {
      expect(screen.getByText("Manage Feed Sources")).toBeInTheDocument();
    });
    expect(screen.queryByText("Mock Article One")).not.toBeInTheDocument();
  });
});
