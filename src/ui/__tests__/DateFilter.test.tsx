import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateFilter } from "../DateFilter";

const defaultProps = {
  fromDate: "2025-01-20",
  toDate: "2025-01-28",
  onFromDateChange: jest.fn(),
  onToDateChange: jest.fn(),
  onReset: jest.fn(),
  filteredCount: 5,
  totalCount: 10,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("DateFilter", () => {
  it("renders from and to date inputs with labels", () => {
    render(<DateFilter {...defaultProps} />);
    expect(screen.getByLabelText("From")).toBeInTheDocument();
    expect(screen.getByLabelText("To")).toBeInTheDocument();
  });

  it("displays the from and to date values", () => {
    render(<DateFilter {...defaultProps} />);
    expect(screen.getByLabelText("From")).toHaveValue("2025-01-20");
    expect(screen.getByLabelText("To")).toHaveValue("2025-01-28");
  });

  it("shows filtered count when filter is active", () => {
    render(<DateFilter {...defaultProps} />);
    expect(screen.getByText("5 of 10 articles")).toBeInTheDocument();
  });

  it("shows total count only when not filtered", () => {
    render(<DateFilter {...defaultProps} filteredCount={10} totalCount={10} />);
    expect(screen.getByText("10 articles")).toBeInTheDocument();
    expect(screen.queryByText(/of/)).not.toBeInTheDocument();
  });

  it("calls onFromDateChange when from input changes", () => {
    const handler = jest.fn();
    render(<DateFilter {...defaultProps} onFromDateChange={handler} />);
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "2025-01-15" } });
    expect(handler).toHaveBeenCalledWith("2025-01-15");
  });

  it("calls onToDateChange when to input changes", () => {
    const handler = jest.fn();
    render(<DateFilter {...defaultProps} onToDateChange={handler} />);
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "2025-02-01" } });
    expect(handler).toHaveBeenCalledWith("2025-02-01");
  });

  it("calls onReset when reset button is clicked", async () => {
    const handler = jest.fn();
    render(<DateFilter {...defaultProps} onReset={handler} />);
    await userEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("disables reset button when not filtered", () => {
    render(<DateFilter {...defaultProps} filteredCount={10} totalCount={10} />);
    expect(screen.getByRole("button", { name: /reset/i })).toBeDisabled();
  });
});
