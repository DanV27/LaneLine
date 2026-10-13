type Option = { value: string; label: string; hint?: string };

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="flex items-baseline gap-2 text-sm font-semibold text-slate-800">
        {label}
        {hint && <span className="text-xs font-normal text-slate-500">{hint}</span>}
      </legend>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </fieldset>
  );
}

/** A row of pill buttons backed by real radio or checkbox inputs, so the form posts normally. */
export function ChoiceGroup({
  name,
  type,
  options,
  selected,
  onToggle,
  columns,
}: {
  name: string;
  type: "radio" | "checkbox";
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  columns?: string;
}) {
  return (
    <div className={columns ?? "flex flex-wrap gap-2"}>
      {options.map((option) => {
        const checked = selected.includes(option.value);
        return (
          <label
            key={option.value}
            title={option.hint}
            className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sky-400 ${
              checked
                ? "border-sky-600 bg-sky-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-sky-400"
            }`}
          >
            <input
              type={type}
              name={name}
              value={option.value}
              checked={checked}
              onChange={() => onToggle(option.value)}
              className="sr-only"
            />
            <span className="font-medium">{option.label}</span>
            {option.hint && columns && (
              <span className={`block text-xs ${checked ? "text-sky-100" : "text-slate-500"}`}>{option.hint}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200";
