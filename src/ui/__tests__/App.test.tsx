import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import * as apiClient from "../apiClient";

jest.mock("../articleData", () => ({
  loadArticles: jest.fn().mockResolvedValue([
    {
      id: "mock-1",
      title: "Mock Article One",
      subtitle: "Mock subtitle",
      body: ["Paragraph A.", "Paragraph B.", "Paragraph C."],
      sourceTags: ["testing"],
      fetchedAt: 1738000000000,
    },
    {
      id: "mock-2",
      title: "Mock Article Two",
      body: ["Content here."],
      sourceTags: ["mock"],
      fetchedAt: 1738100000000,
    },
  ]),
}));

jest.mock("../apiClient", () => ({
  ...jest.requireActual("../apiClient"),
  fetchCurrentUser: jest.fn(),
  fetchFlags: jest.fn().mockResolvedValue([]),
}));

const mockFetchCurrentUser = apiClient.fetchCurrentUser as jest.MockedFunction<
  typeof apiClient.fetchCurrentUser
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
});
