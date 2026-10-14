"use client";

import { useState } from "react";
import { formatInterval, parseInterval } from "@/lib/workout/time";

export const smallInputClass =
  "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200";

/**
 * A text box that lets the user type freely and only commits values that pass
 * `parse`. On blur it snaps back to the last committed value.
 */
function CommitField<T>({
  value,
  format,
  parse,
  onCommit,
  label,
  className,
  inputMode,
}: {
  value: T;
  format: (value: T) => string;
  parse: (text: string) => T | null;
  onCommit: (value: T) => void;
  label: string;
  className?: string;
  inputMode?: "numeric" | "text";
}) {
  const [text, setText] = useState(format(value));
  const [committed, setCommitted] = useState(value);

  // Pick up changes made outside this field (re-roll, reset, reordering).
  if (value !== committed) {
    setCommitted(value);
    setText(format(value));
  }

  return (
    <input
      aria-label={label}
      inputMode={inputMode}
      value={text}
      onChange={(event) => {
        setText(event.target.value);
        const parsed = parse(event.target.value);
        if (parsed !== null) {
          setCommitted(parsed);
          onCommit(parsed);
        }
      }}
      onBlur={() => setText(format(value))}
      className={`${smallInputClass} ${className ?? ""}`}
    />
  );
}

export function NumberField({
  value,
  min,
  max,
  ...props
}: {
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  label: string;
  className?: string;
}) {
  const parse = (text: string) => {
    if (!/^\d+$/.test(text.trim())) return null;
    const number = Number(text);
    return number >= min && number <= max ? number : null;
  };
  return <CommitField value={value} format={String} parse={parse} inputMode="numeric" {...props} />;
}

export function IntervalField({
  max = 900,
  ...props
}: {
  value: number;
  max?: number;
  onCommit: (seconds: number) => void;
  label: string;
  className?: string;
}) {
  const parse = (text: string) => {
    const seconds = parseInterval(text);
    return seconds !== null && seconds >= 5 && seconds <= max ? seconds : null;
  };
  return <CommitField format={formatInterval} parse={parse} {...props} />;
}
