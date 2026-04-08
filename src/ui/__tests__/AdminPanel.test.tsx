import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminPanel } from "../AdminPanel";
import * as apiClient from "../apiClient";

jest.mock("../apiClient");

const mockFetchAdminFeedSources = apiClient.fetchAdminFeedSources as jest.MockedFunction<
  typeof apiClient.fetchAdminFeedSources
>;
const mockAddFeedSource = apiClient.addFeedSource as jest.MockedFunction<
  typeof apiClient.addFeedSource
>;
const mockDeleteFeedSource = apiClient.deleteFeedSource as jest.MockedFunction<
  typeof apiClient.deleteFeedSource
>;
const mockFetchNow = apiClient.fetchNow as jest.MockedFunction<
  typeof apiClient.fetchNow
>;
const mockFetchAdmins = apiClient.fetchAdmins as jest.MockedFunction<
  typeof apiClient.fetchAdmins
>;
const mockAddAdminByEmail = apiClient.addAdminByEmail as jest.MockedFunction<
  typeof apiClient.addAdminByEmail
>;
const mockRemoveAdmin = apiClient.removeAdmin as jest.MockedFunction<
  typeof apiClient.removeAdmin
>;
const mockFetchReviewQueue = apiClient.fetchReviewQueue as jest.MockedFunction<
  typeof apiClient.fetchReviewQueue
>;
const mockApproveArticle = apiClient.approveArticle as jest.MockedFunction<
  typeof apiClient.approveArticle
>;
const mockRejectArticle = apiClient.rejectArticle as jest.MockedFunction<
  typeof apiClient.rejectArticle
>;
const mockFetchReplacementRules = apiClient.fetchReplacementRules as jest.MockedFunction<
  typeof apiClient.fetchReplacementRules
>;

const mockSources: apiClient.AdminFeedSource[] = [
  {
    sourceId: "fox-news",
    name: "Fox News",
    feedUrl: "https://fox.com/feed",
    defaultTags: ["politics"],
    isDynamic: false,
    publishMode: "auto",
  },
  {
    sourceId: "custom-src",
    name: "Custom Source",
    feedUrl: "https://custom.com/feed.xml",
    defaultTags: ["test"],
    isDynamic: true,
    publishMode: "manual",
  },
];

beforeEach(() => {
  mockFetchAdminFeedSources.mockResolvedValue(mockSources);
  mockFetchAdmins.mockResolvedValue([
    { id: "admin-1", email: "admin@example.com", isAdmin: true },
  ]);
  mockFetchReviewQueue.mockResolvedValue([]);
  mockFetchReplacementRules.mockResolvedValue([]);
  mockAddFeedSource.mockReset();
  mockDeleteFeedSource.mockReset();
  mockFetchNow.mockReset();
  mockAddAdminByEmail.mockReset();
  mockRemoveAdmin.mockReset();
  mockApproveArticle.mockReset();
  mockRejectArticle.mockReset();
});

describe("AdminPanel", () => {
  it("renders sidebar with feed sources and nav items", async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Feed Sources")).toBeInTheDocument();
    });
    expect(screen.getByText("Review Queue")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manage Admins" })).toBeInTheDocument();
    // Feed names appear in both sidebar and source list
    expect(screen.getAllByText("Fox News").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Custom Source").length).toBeGreaterThanOrEqual(2);
  });

  it("shows loading state initially", async () => {
    render(<AdminPanel />);
    expect(screen.getByText("Loading admin dashboard...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByText("Loading admin dashboard...")).not.toBeInTheDocument();
    });
  });

  it("shows source list with counts in default feeds view", async () => {
    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getByText("Manage Feed Sources")).toBeInTheDocument();
    });
    expect(screen.getByText("Current Sources (2)")).toBeInTheDocument();
  });

  it("shows custom badge for dynamic sources", async () => {
    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getByText("custom")).toBeInTheDocument();
    });
  });

  it("shows delete button only for dynamic sources", async () => {
    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getAllByText("Fox News").length).toBeGreaterThanOrEqual(1);
    });

    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    expect(deleteButtons).toHaveLength(1);
  });

  it("submits add form and reloads sources", async () => {
    mockAddFeedSource.mockResolvedValue({
      sourceId: "new-source",
      name: "New Source",
      feedUrl: "https://new.com/feed",
      defaultTags: ["news"],
      isDynamic: true,
    });

    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getAllByText("Fox News").length).toBeGreaterThanOrEqual(1);
    });

    await userEvent.type(screen.getByLabelText("Source ID"), "new-source");
    await userEvent.type(screen.getByLabelText("Display Name"), "New Source");
    await userEvent.type(screen.getByLabelText("Feed URL"), "https://new.com/feed");
    await userEvent.type(screen.getByLabelText("Tags (comma-separated)"), "news");
    await userEvent.click(screen.getByRole("button", { name: "Add Source" }));

    await waitFor(() => {
      expect(mockAddFeedSource).toHaveBeenCalledWith({
        sourceId: "new-source",
        name: "New Source",
        feedUrl: "https://new.com/feed",
        defaultTags: ["news"],
      });
    });
  });

  it("calls deleteFeedSource when delete is clicked", async () => {
    mockDeleteFeedSource.mockResolvedValue(undefined);

    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getAllByText("Custom Source").length).toBeGreaterThanOrEqual(1);
    });

    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    await waitFor(() => {
      expect(mockDeleteFeedSource).toHaveBeenCalledWith("custom-src");
    });
  });

  it("calls fetchNow and shows result", async () => {
    mockFetchNow.mockResolvedValue({
      articlesFound: 10,
      newArticlesSaved: 3,
    });

    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getAllByText("Fox News").length).toBeGreaterThanOrEqual(1);
    });

    const fetchButtons = screen.getAllByRole("button", { name: "Fetch Now" });
    await userEvent.click(fetchButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/Found 10 articles, saved 3 new/)).toBeInTheDocument();
    });
  });

  it("shows error when load fails", async () => {
    mockFetchAdminFeedSources.mockRejectedValue(new Error("fail"));

    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Failed to load feed sources")).toBeInTheDocument();
    });
  });

  it("navigates to admin management view", async () => {
    render(<AdminPanel />);

    await waitFor(() => {
      expect(screen.getByText("Feed Sources")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Manage Admins" }));

    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });
    expect(screen.getByText("Current Admins (1)")).toBeInTheDocument();
  });

  it("adds admin by email", async () => {
    mockAddAdminByEmail.mockResolvedValue({
      id: "admin-2",
      email: "new@example.com",
      isAdmin: true,
    });

    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getByText("Feed Sources")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Manage Admins" }));
    await waitFor(() => {
      expect(screen.getByText("Manage Admins", { selector: "h2" })).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText("User Email"), "new@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Add Admin" }));

    await waitFor(() => {
      expect(mockAddAdminByEmail).toHaveBeenCalledWith("new@example.com");
    });
  });

  it("removes admin when Remove is clicked", async () => {
    mockRemoveAdmin.mockResolvedValue(undefined);

    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getByText("Feed Sources")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Manage Admins" }));
    await waitFor(() => {
      expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() => {
      expect(mockRemoveAdmin).toHaveBeenCalledWith("admin-1");
    });
  });

  it("navigates to review queue", async () => {
    mockFetchReviewQueue.mockResolvedValue([
      {
        id: "pending-1",
        rawArticleId: "raw-1",
        title: "Pending Article",
        body: ["Content here."],
        sourceTags: ["news"],
        sourceId: "fox-news",
        url: "https://example.com/1",
        fetchedAt: Date.now(),
        reviewStatus: "pending",
        propagandaScore: 0,
      },
    ]);

    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getByText("Feed Sources")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Review Queue" }));

    await waitFor(() => {
      expect(screen.getByText("Pending Article")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
  });

  it("approves article from review queue", async () => {
    mockFetchReviewQueue.mockResolvedValue([
      {
        id: "pending-1",
        rawArticleId: "raw-1",
        title: "Pending Article",
        body: ["Content here."],
        sourceTags: ["news"],
        sourceId: "fox-news",
        url: "https://example.com/1",
        fetchedAt: Date.now(),
        reviewStatus: "pending",
        propagandaScore: 0,
      },
    ]);
    mockApproveArticle.mockResolvedValue({
      id: "pending-1",
      rawArticleId: "raw-1",
      title: "Pending Article",
      body: ["Content here."],
      sourceTags: ["news"],
      sourceId: "fox-news",
      url: "https://example.com/1",
      fetchedAt: Date.now(),
      reviewStatus: "approved",
      propagandaScore: 0,
    });

    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getByText("Feed Sources")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole("button", { name: "Review Queue" }));
    await waitFor(() => {
      expect(screen.getByText("Pending Article")).toBeInTheDocument();
    });

    // After approve, it reloads the queue
    mockFetchReviewQueue.mockResolvedValue([]);
    await userEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => {
      expect(mockApproveArticle).toHaveBeenCalledWith("pending-1");
    });
  });

  it("shows publish mode badges", async () => {
    render(<AdminPanel />);
    await waitFor(() => {
      expect(screen.getAllByText("Fox News").length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText("manual")).toBeInTheDocument();
    expect(screen.getAllByText("auto").length).toBeGreaterThanOrEqual(1);
  });
});
