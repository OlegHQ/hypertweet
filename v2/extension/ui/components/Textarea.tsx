interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string | undefined;
}

export function Textarea({
  label,
  error,
  className = '',
  ...props
}: TextareaProps): React.ReactElement {
  const textareaClasses =
    `ht-textarea ${error ? 'ht-textarea-error' : ''} ${className}`.trim();

  return (
    <div className="ht-textarea-wrapper">
      {label && <label className="ht-textarea-label">{label}</label>}
      <textarea className={textareaClasses} {...props} />
      {error && <p className="ht-textarea-error-text">{error}</p>}
    </div>
  );
}
