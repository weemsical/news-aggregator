import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider, useAuth } from "../AuthContext";
import * as apiClient from "../apiClient";

jest.mock("../apiClient");
const mockFetchCurrentUser = apiClient.fetchCurrentUser as jest.MockedFunction<
  typeof apiClient.fetchCurrentUser
>;
const mockLogin = apiClient.login as jest.MockedFunction<typeof apiClient.login>;
const mockSignup = apiClient.signup as jest.MockedFunction<typeof apiClient.signup>;
const mockLogout = apiClient.logout as jest.MockedFunction<typeof apiClient.logout>;

function TestConsumer() {
  const { user, loading, login, signup, logout } = useAuth();
  if (loading) return <p>Loading...</p>;
  return (
    <div>
      <p data-testid="user">{user ? user.email : "none"}</p>
      <button onClick={() => login("a@b.com", "password1")}>login</button>
      <button onClick={() => signup("new@b.com", "password1")}>signup</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

beforeEach(() => {
  jest.resetAllMocks();
  mockFetchCurrentUser.mockResolvedValue(null);
});

describe("AuthContext", () => {
  it("shows loading then resolves to no user", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
  });

  it("restores user from fetchCurrentUser", async () => {
    mockFetchCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com");
    });
  });

  it("login sets user", async () => {
    mockLogin.mockResolvedValue({ id: "u1", email: "a@b.com" });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
    await userEvent.click(screen.getByText("login"));
    expect(screen.getByTestId("user")).toHaveTextContent("a@b.com");
  });

  it("signup sets user", async () => {
    mockSignup.mockResolvedValue({ id: "u2", email: "new@b.com" });
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("none");
    });
    await userEvent.click(screen.getByText("signup"));
    expect(screen.getByTestId("user")).toHaveTextContent("new@b.com");
  });

  it("logout clears user", async () => {
    mockFetchCurrentUser.mockResolvedValue({ id: "u1", email: "a@b.com" });
    mockLogout.mockResolvedValue(undefined);
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("user")).toHaveTextContent("a@b.com");
    });
    await userEvent.click(screen.getByText("logout"));
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("throws if useAuth is used outside provider", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
    spy.mockRestore();
  });
});
