import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type FormOption = { value: string; label: string };

export type FormField = {
  key: string;
  label: string;
  type?: "text" | "number" | "date" | "email" | "url" | "textarea" | "select";
  placeholder?: string;
  options?: readonly FormOption[];
  full?: boolean;
  step?: string;
  hint?: string;
};

export type FormValues = Record<string, string>;

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  fields,
  values,
  onChange,
  onSubmit,
  pending,
  submitLabel = "Save",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: readonly FormField[];
  values: FormValues;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
  pending?: boolean;
  submitLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-[520px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{title}</DialogTitle>
          {description ? <DialogDescription className="text-[11px]">{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.key} className={field.full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
              <Label htmlFor={`field-${field.key}`} className="text-[11px]">
                {field.label}
              </Label>
              {field.type === "textarea" ? (
                <textarea
                  id={`field-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-2.5 py-2 text-[11px] text-foreground shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              ) : field.type === "select" ? (
                <select
                  id={`field-${field.key}`}
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className="flex h-9 w-full cursor-pointer rounded-md border border-input bg-background px-2.5 text-[11px] text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`field-${field.key}`}
                  type={field.type ?? "text"}
                  step={field.step}
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  placeholder={field.placeholder}
                  className="h-9 text-[11px]"
                />
              )}
              {field.hint ? <p className="text-[10px] text-muted-foreground">{field.hint}</p> : null}
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancel
          </Button>
          <Button type="button" onClick={onSubmit} disabled={pending} className="h-9">
            {pending ? "Saving..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  pending,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  pending?: boolean;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-[15px]">{title}</DialogTitle>
          <DialogDescription className="text-[11px]">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="h-9">
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm} disabled={pending} className="h-9">
            {pending ? "Working..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
