interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps): React.ReactElement {
  const inputClasses =
    `ht-input ${error ? 'ht-input-error' : ''} ${className}`.trim();

  return (
    <div className="ht-input-wrapper">
      {label && <label className="ht-input-label">{label}</label>}
      <input className={inputClasses} {...props} />
      {error && <p className="ht-input-error-text">{error}</p>}
    </div>
  );
}
