import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NotificationBell } from "../NotificationBell";
import * as apiClient from "../apiClient";
import * as AuthContext from "../AuthContext";

jest.mock("../apiClient");
jest.mock("../AuthContext");

const mockFetchUnreadCount = apiClient.fetchUnreadCount as jest.MockedFunction<typeof apiClient.fetchUnreadCount>;
const mockFetchNotifications = apiClient.fetchNotifications as jest.MockedFunction<typeof apiClient.fetchNotifications>;
const mockMarkNotificationRead = apiClient.markNotificationRead as jest.MockedFunction<typeof apiClient.markNotificationRead>;
const mockUseAuth = AuthContext.useAuth as jest.MockedFunction<typeof AuthContext.useAuth>;

beforeEach(() => {
  mockFetchUnreadCount.mockResolvedValue(0);
  mockFetchNotifications.mockResolvedValue([]);
  mockMarkNotificationRead.mockResolvedValue(undefined);
});

describe("NotificationBell", () => {
  it("renders nothing when user is not logged in", () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, logout: jest.fn(), login: jest.fn(), signup: jest.fn() });
    const { container } = render(<NotificationBell />);
    expect(container.innerHTML).toBe("");
  });

  it("renders bell icon when user is logged in", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      loading: false,
      logout: jest.fn(), login: jest.fn(), signup: jest.fn(),
    });
    mockFetchUnreadCount.mockResolvedValue(3);

    render(<NotificationBell />);

    await waitFor(() => {
      expect(screen.getByText("3")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Notifications")).toBeInTheDocument();
  });

  it("shows no badge when unread count is 0", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      loading: false,
      logout: jest.fn(), login: jest.fn(), signup: jest.fn(),
    });
    mockFetchUnreadCount.mockResolvedValue(0);

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockFetchUnreadCount).toHaveBeenCalled();
    });
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("opens dropdown with notifications on click", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      loading: false,
      logout: jest.fn(), login: jest.fn(), signup: jest.fn(),
    });
    mockFetchNotifications.mockResolvedValue([
      {
        id: "n1", userId: "u1", type: "agreement", referenceId: "h1",
        message: "Someone agreed with your highlight", isRead: false,
        acknowledgedBy: [], createdAt: Date.now(),
      },
    ]);

    render(<NotificationBell />);

    await userEvent.click(screen.getByLabelText("Notifications"));

    await waitFor(() => {
      expect(screen.getByText("Someone agreed with your highlight")).toBeInTheDocument();
    });
    expect(screen.getByText("Mark read")).toBeInTheDocument();
  });

  it("marks notification as read", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      loading: false,
      logout: jest.fn(), login: jest.fn(), signup: jest.fn(),
    });
    mockFetchNotifications.mockResolvedValue([
      {
        id: "n1", userId: "u1", type: "agreement", referenceId: "h1",
        message: "Someone agreed", isRead: false,
        acknowledgedBy: [], createdAt: Date.now(),
      },
    ]);

    render(<NotificationBell />);
    await userEvent.click(screen.getByLabelText("Notifications"));

    await waitFor(() => {
      expect(screen.getByText("Mark read")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Mark read"));

    await waitFor(() => {
      expect(mockMarkNotificationRead).toHaveBeenCalledWith("n1");
    });
  });

  it("shows empty message when no notifications", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "user@test.com" },
      loading: false,
      logout: jest.fn(), login: jest.fn(), signup: jest.fn(),
    });
    mockFetchNotifications.mockResolvedValue([]);

    render(<NotificationBell />);
    await userEvent.click(screen.getByLabelText("Notifications"));

    await waitFor(() => {
      expect(screen.getByText("No notifications")).toBeInTheDocument();
    });
  });
});
