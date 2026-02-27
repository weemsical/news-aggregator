import "./FlagToggle.css";

export type FlagView = "mine" | "all" | "none";

interface FlagToggleProps {
  value: FlagView;
  onChange: (value: FlagView) => void;
}

const options: { value: FlagView; label: string }[] = [
  { value: "mine", label: "My Flags" },
  { value: "all", label: "All Flags" },
  { value: "none", label: "None" },
];

export function FlagToggle({ value, onChange }: FlagToggleProps) {
  return (
    <div className="flag-toggle" role="radiogroup" aria-label="Flag view">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`flag-toggle__btn${value === opt.value ? " flag-toggle__btn--active" : ""}`}
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
