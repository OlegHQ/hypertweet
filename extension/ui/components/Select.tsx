interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
}

export function Select({
  label,
  options,
  className = '',
  ...props
}: SelectProps): React.ReactElement {
  return (
    <div className="ht-select-wrapper">
      {label && <label className="ht-select-label">{label}</label>}
      <select className={`ht-select ${className}`.trim()} {...props}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
