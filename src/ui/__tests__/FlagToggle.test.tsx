import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlagToggle, FlagView } from "../FlagToggle";

describe("FlagToggle", () => {
  it("renders three options", () => {
    render(<FlagToggle value="all" onChange={() => {}} />);
    expect(screen.getByText("My Flags")).toBeInTheDocument();
    expect(screen.getByText("All Flags")).toBeInTheDocument();
    expect(screen.getByText("None")).toBeInTheDocument();
  });

  it("marks the active option", () => {
    render(<FlagToggle value="mine" onChange={() => {}} />);
    expect(screen.getByText("My Flags")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText("All Flags")).toHaveAttribute("aria-checked", "false");
    expect(screen.getByText("None")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onChange when a different option is clicked", async () => {
    const handleChange = jest.fn();
    render(<FlagToggle value="all" onChange={handleChange} />);

    await userEvent.click(screen.getByText("My Flags"));
    expect(handleChange).toHaveBeenCalledWith("mine");
  });

  it("calls onChange with 'none' when None is clicked", async () => {
    const handleChange = jest.fn();
    render(<FlagToggle value="all" onChange={handleChange} />);

    await userEvent.click(screen.getByText("None"));
    expect(handleChange).toHaveBeenCalledWith("none");
  });

  it("has accessible radiogroup role", () => {
    render(<FlagToggle value="all" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: "Flag view" })).toBeInTheDocument();
  });
});
