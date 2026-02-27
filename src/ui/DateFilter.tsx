import "./DateFilter.css";

interface DateFilterProps {
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
}

export function DateFilter({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onReset,
  filteredCount,
  totalCount,
}: DateFilterProps) {
  const isFiltered = filteredCount !== totalCount;

  return (
    <div className="date-filter">
      <div className="date-filter__inputs">
        <div className="date-filter__field">
          <label htmlFor="date-from" className="date-filter__label">
            From
          </label>
          <input
            id="date-from"
            type="date"
            className="date-filter__input"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
          />
        </div>
        <div className="date-filter__field">
          <label htmlFor="date-to" className="date-filter__label">
            To
          </label>
          <input
            id="date-to"
            type="date"
            className="date-filter__input"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
          />
        </div>
        <button
          className="date-filter__reset"
          onClick={onReset}
          disabled={!isFiltered}
        >
          Reset
        </button>
      </div>
      <p className="date-filter__count">
        {isFiltered
          ? `${filteredCount} of ${totalCount} articles`
          : `${totalCount} articles`}
      </p>
    </div>
  );
}
