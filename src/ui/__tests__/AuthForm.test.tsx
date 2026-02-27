import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "../AuthForm";
import { AuthProvider } from "../AuthContext";
import * as apiClient from "../apiClient";

jest.mock("../apiClient");
const mockFetchCurrentUser = apiClient.fetchCurrentUser as jest.MockedFunction<
  typeof apiClient.fetchCurrentUser
>;
const mockLogin = apiClient.login as jest.MockedFunction<typeof apiClient.login>;
const mockSignup = apiClient.signup as jest.MockedFunction<typeof apiClient.signup>;

beforeEach(() => {
  jest.resetAllMocks();
  mockFetchCurrentUser.mockResolvedValue(null);
});

function renderForm(onClose = jest.fn()) {
  return {
    onClose,
    ...render(
      <AuthProvider>
        <AuthForm onClose={onClose} />
      </AuthProvider>
    ),
  };
}

describe("AuthForm", () => {
  it("renders login form by default", async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("switches to signup mode", async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Sign up"));
    expect(screen.getByRole("heading", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("switches back to login mode", async () => {
    renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });
    await userEvent.click(screen.getByText("Sign up"));
    await userEvent.click(screen.getByText("Log in"));
    expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
  });

  it("calls login and closes on success", async () => {
    mockLogin.mockResolvedValue({ id: "u1", email: "a@b.com" });
    const { onClose } = renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("calls signup and closes on success", async () => {
    mockSignup.mockResolvedValue({ id: "u2", email: "new@b.com" });
    const { onClose } = renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Sign up"));
    await userEvent.type(screen.getByLabelText(/email/i), "new@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows error on login failure", async () => {
    mockLogin.mockRejectedValue(new Error("Invalid email or password"));
    renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpassword");
    await userEvent.click(screen.getByRole("button", { name: "Log In" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid email or password"
      );
    });
  });

  it("shows error on signup failure", async () => {
    mockSignup.mockRejectedValue(new Error("Email already registered"));
    renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Sign up"));
    await userEvent.type(screen.getByLabelText(/email/i), "a@b.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Sign Up" }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email already registered"
      );
    });
  });

  it("closes when overlay is clicked", async () => {
    const { onClose, container } = renderForm();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Log In" })).toBeInTheDocument();
    });

    const overlay = container.querySelector(".auth-form__overlay")!;
    await userEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });
});
