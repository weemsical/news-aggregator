import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FlagPopover } from "../FlagPopover";

describe("FlagPopover", () => {
  const defaultProps = {
    selectedText: "accused the committee of leveraging testimony",
    position: { top: 100, left: 200 },
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the selected text", () => {
    render(<FlagPopover {...defaultProps} />);
    expect(
      screen.getByText("accused the committee of leveraging testimony")
    ).toBeInTheDocument();
  });

  it("renders a textarea and submit/cancel buttons", () => {
    render(<FlagPopover {...defaultProps} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onSubmit with the explanation when submitted", async () => {
    render(<FlagPopover {...defaultProps} />);
    await userEvent.type(
      screen.getByRole("textbox"),
      "Loaded language implies manipulation"
    );
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(defaultProps.onSubmit).toHaveBeenCalledWith(
      "Loaded language implies manipulation"
    );
  });

  it("does not call onSubmit when explanation is empty", async () => {
    render(<FlagPopover {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when explanation is whitespace only", async () => {
    render(<FlagPopover {...defaultProps} />);
    await userEvent.type(screen.getByRole("textbox"), "   ");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<FlagPopover {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
