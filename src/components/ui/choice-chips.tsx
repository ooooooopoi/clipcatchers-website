import { cn } from "@/lib/utils";

/**
 * A single choice, shown as a row of pills instead of a dropdown.
 *
 * ── Why not a <select> ──────────────────────────────────────────────────
 * A dropdown hides every option but one. That's the right trade at twenty
 * options and the wrong one at five: the enquiry form was asking "what are you
 * promoting?" and answering it with a closed box that said "Pick a category",
 * so the nine answers — the part that tells a visitor we've done this for
 * their kind of business before — were invisible unless they tapped it.
 * Laying them out flat turns a question into a menu, and a menu gets answered.
 *
 * It's also fewer taps on a phone, where a native select is a full-screen
 * modal with a Done button.
 *
 * ── Why radios and not buttons ──────────────────────────────────────────
 * The inputs are real radios, visually hidden, with the pill drawn by the
 * label beside them. That buys arrow-key navigation, the roving tab stop,
 * correct announcement as a group, and — the reason this component holds no
 * state — the value lands in FormData under `name` with nothing to wire up.
 * A row of <button>s would need every one of those written by hand.
 *
 * `peer` is why the order matters: the input must precede the span, or the
 * checked styling has nothing to select against.
 */
export function ChoiceChips({
  name,
  label,
  options,
  defaultValue,
  value,
  onValueChange,
  hint,
  className,
}: {
  name: string;
  label: string;
  /** A bare string is both the value and the label; a pair splits them. */
  options: readonly (string | { value: string; label: string })[];
  defaultValue?: string;
  /**
   * Controlled mode, for the forms that need the answer before submit — the
   * clipper form filters its account list by the platform picked here, so it
   * can't wait for FormData. Pass both or neither: `value` without
   * `onValueChange` is a field nobody can change.
   */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Shown beside the legend, for the "you can skip this" case. */
  hint?: string;
  className?: string;
}) {
  const controlled = typeof onValueChange === "function";

  return (
    <fieldset className={cn("min-w-0", className)}>
      <legend className="flex w-full items-baseline justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </legend>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const val = typeof option === "string" ? option : option.value;
          const text = typeof option === "string" ? option : option.label;
          return (
            <label key={val} className="cursor-pointer">
              <input
                type="radio"
                name={name}
                value={val}
                {...(controlled
                  ? { checked: val === value, onChange: () => onValueChange(val) }
                  : { defaultChecked: val === defaultValue })}
                className="peer sr-only"
              />
              {/* Selected is a filled near-black pill, not a tinted border.
                  On a page with no accent colour left to spend, inversion is
                  the only selection state that survives a glance — a 1px
                  border change does not, and these forms are answered at a
                  glance or not at all. */}
              <span
                className={cn(
                  "block rounded-full border px-3.5 py-2 text-sm transition-colors",
                  "border-border bg-background text-muted-foreground",
                  "hover:border-[hsl(var(--border-strong))] hover:text-foreground",
                  "peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background",
                  "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background",
                )}
              >
                {text}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
