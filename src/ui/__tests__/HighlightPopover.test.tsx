import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HighlightPopover } from "../HighlightPopover";

describe("HighlightPopover", () => {
  const defaultProps = {
    selectedText: "accused the committee of leveraging testimony",
    position: { top: 100, left: 200 },
    mode: "create" as const,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the selected text", () => {
    render(<HighlightPopover {...defaultProps} />);
    expect(
      screen.getByText("accused the committee of leveraging testimony")
    ).toBeInTheDocument();
  });

  it("renders a textarea and submit/cancel buttons", () => {
    render(<HighlightPopover {...defaultProps} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("calls onSubmit with the explanation when submitted", async () => {
    render(<HighlightPopover {...defaultProps} />);
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
    render(<HighlightPopover {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("does not call onSubmit when explanation is whitespace only", async () => {
    render(<HighlightPopover {...defaultProps} />);
    await userEvent.type(screen.getByRole("textbox"), "   ");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<HighlightPopover {...defaultProps} />);
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it("pre-fills explanation in edit mode", () => {
    render(
      <HighlightPopover
        {...defaultProps}
        mode="edit"
        initialExplanation="Original explanation"
      />
    );
    expect(screen.getByRole("textbox")).toHaveValue("Original explanation");
  });

  it("shows delete button in edit mode", () => {
    render(
      <HighlightPopover
        {...defaultProps}
        mode="edit"
        onDelete={jest.fn()}
      />
    );
    expect(screen.getByRole("button", { name: /delete/i })).toBeInTheDocument();
  });

  it("does not show delete button in create mode", () => {
    render(<HighlightPopover {...defaultProps} />);
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("calls onDelete when delete clicked in edit mode", async () => {
    const onDelete = jest.fn();
    render(
      <HighlightPopover
        {...defaultProps}
        mode="edit"
        onDelete={onDelete}
      />
    );
    await userEvent.click(screen.getByRole("button", { name: /delete/i }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("shows Update button instead of Submit in edit mode", () => {
    render(
      <HighlightPopover {...defaultProps} mode="edit" onDelete={jest.fn()} />
    );
    expect(screen.getByRole("button", { name: /update/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /submit/i })).not.toBeInTheDocument();
  });
});

describe("HighlightPopover — anonymous mode", () => {
  const anonProps = {
    selectedText: "accused the committee of leveraging testimony",
    position: { top: 100, left: 200 },
    mode: "create" as const,
    isAnonymous: true,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not render a textarea in anonymous mode", () => {
    render(<HighlightPopover {...anonProps} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows Mark as Propaganda button in anonymous mode", () => {
    render(<HighlightPopover {...anonProps} />);
    expect(screen.getByRole("button", { name: /mark as propaganda/i })).toBeInTheDocument();
  });

  it("shows sign-up prompt in anonymous mode", () => {
    render(<HighlightPopover {...anonProps} />);
    expect(screen.getByText(/create an account/i)).toBeInTheDocument();
  });

  it("calls onSubmit with empty string when Mark as Propaganda is clicked", async () => {
    const user = (await import("@testing-library/user-event")).default;
    render(<HighlightPopover {...anonProps} />);
    await user.click(screen.getByRole("button", { name: /mark as propaganda/i }));
    expect(anonProps.onSubmit).toHaveBeenCalledWith("");
  });
});
