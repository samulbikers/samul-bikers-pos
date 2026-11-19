import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  className?: string;
}) {
  return (
    <label
      className={`flex h-9 min-w-0 items-center gap-2 rounded-md border border-border bg-card px-3 focus-within:border-ring ${className}`}
    >
      <Search aria-hidden="true" className="size-[15px] shrink-0 text-muted-foreground" />
      <span className="sr-only">{label}</span>
      <Input
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 py-0 text-[11px] shadow-none placeholder:text-muted-foreground focus-visible:ring-0"
      />
    </label>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
  className?: string;
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`h-9 min-w-0 cursor-pointer rounded-md border border-border bg-card px-2.5 text-[11px] font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function Toolbar({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 px-4 pb-3 pt-1 sm:px-5 ${className}`}>{children}</div>
  );
}
