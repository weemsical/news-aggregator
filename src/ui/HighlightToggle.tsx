import "./HighlightToggle.css";

export type HighlightView = "mine" | "all" | "none";

interface HighlightToggleProps {
  value: HighlightView;
  onChange: (value: HighlightView) => void;
  isAnonymous?: boolean;
}

const options: { value: HighlightView; label: string }[] = [
  { value: "mine", label: "My Highlights" },
  { value: "all", label: "All Highlights" },
  { value: "none", label: "None" },
];

export function HighlightToggle({ value, onChange, isAnonymous = false }: HighlightToggleProps) {
  if (isAnonymous) {
    const isOn = value === "all";
    return (
      <div className="highlight-toggle">
        <label className="highlight-toggle__label">
          <input
            type="checkbox"
            checked={isOn}
            onChange={() => onChange(isOn ? "none" : "all")}
          />
          Show highlights
        </label>
      </div>
    );
  }

  return (
    <div className="highlight-toggle" role="radiogroup" aria-label="Highlight view">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`highlight-toggle__btn${value === opt.value ? " highlight-toggle__btn--active" : ""}`}
          role="radio"
          aria-checked={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
