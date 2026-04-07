import { render, screen } from "@testing-library/react";
import { HowItWorks } from "../HowItWorks";

describe("HowItWorks", () => {
  it("renders the page title", () => {
    render(<HowItWorks />);
    expect(screen.getByText("How It Works")).toBeInTheDocument();
  });

  it("renders all section headings", () => {
    render(<HowItWorks />);
    expect(screen.getByText("What is this?")).toBeInTheDocument();
    expect(screen.getByText("Your job")).toBeInTheDocument();
    expect(screen.getByText("Why sign up?")).toBeInTheDocument();
    expect(screen.getByText("What happens with the data?")).toBeInTheDocument();
    expect(screen.getByText("Tips for spotting propaganda")).toBeInTheDocument();
  });

  it("explains the core concept of anonymized articles", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/strips all of that away/)).toBeInTheDocument();
    expect(screen.getByText(/don't know if you're reading/)).toBeInTheDocument();
  });

  it("lists benefits of signing up", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/Highlight passages and explain/)).toBeInTheDocument();
    expect(screen.getByText(/Edit or delete your highlights/)).toBeInTheDocument();
    expect(screen.getByText(/count toward source credibility/)).toBeInTheDocument();
  });

  it("lists propaganda techniques", () => {
    render(<HowItWorks />);
    expect(screen.getByText(/Loaded language/)).toBeInTheDocument();
    expect(screen.getByText(/Unattributed claims/)).toBeInTheDocument();
    expect(screen.getByText(/False balance/)).toBeInTheDocument();
    expect(screen.getByText(/Emotional framing/)).toBeInTheDocument();
    expect(screen.getByText(/Omission/)).toBeInTheDocument();
    expect(screen.getByText(/Labeling/)).toBeInTheDocument();
  });
});
