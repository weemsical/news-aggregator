import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HighlightToggle } from "../HighlightToggle";

describe("HighlightToggle", () => {
  it("renders three options", () => {
    render(<HighlightToggle value="all" onChange={() => {}} />);
    expect(screen.getByText("My Highlights")).toBeInTheDocument();
    expect(screen.getByText("All Highlights")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("marks the active option", () => {
    render(<HighlightToggle value="mine" onChange={() => {}} />);
    expect(screen.getByText("My Highlights")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("All Highlights")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("None")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange when a different option is clicked", async () => {
    const handleChange = jest.fn();
    render(<HighlightToggle value="all" onChange={handleChange} />);

    await userEvent.click(screen.getByText("My Highlights"));
    expect(handleChange).toHaveBeenCalledWith("mine");
  });

  it("calls onChange with 'none' when None is clicked", async () => {
    const handleChange = jest.fn();
    render(<HighlightToggle value="all" onChange={handleChange} />);

    await userEvent.click(screen.getByText("None"));
    expect(handleChange).toHaveBeenCalledWith("none");
  });

  it("has accessible radiogroup role", () => {
    render(<HighlightToggle value="all" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: "Highlight view" })).toBeInTheDocument();
  });
});

describe("HighlightToggle — anonymous mode", () => {
  it("renders a simple on/off toggle when isAnonymous", () => {
    render(<HighlightToggle value="none" onChange={() => {}} isAnonymous />);
    expect(screen.getByLabelText("Show highlights")).toBeInTheDocument();
    expect(screen.queryByText("My Highlights")).not.toBeInTheDocument();
  });

  it("defaults to unchecked (off) for anonymous users", () => {
    render(<HighlightToggle value="none" onChange={() => {}} isAnonymous />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onChange with 'all' when toggled on", async () => {
    const handleChange = jest.fn();
    render(<HighlightToggle value="none" onChange={handleChange} isAnonymous />);

    await userEvent.click(screen.getByRole("checkbox"));
    expect(handleChange).toHaveBeenCalledWith("all");
  });

  it("calls onChange with 'none' when toggled off", async () => {
    const handleChange = jest.fn();
    render(<HighlightToggle value="all" onChange={handleChange} isAnonymous />);

    await userEvent.click(screen.getByRole("checkbox"));
    expect(handleChange).toHaveBeenCalledWith("none");
  });
});
