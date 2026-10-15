import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Buttons in Apple's manner (owner, 2026-10-15: "make the buttons like
 * apple"): a pill, a flat fill with no glow, regular-weight type tracked
 * slightly tight, and quiet feedback — hover brightens a touch, a press dims.
 * Nothing lifts, glows or shrinks. Neutral actions are a soft tinted grey
 * rather than an outline, as Apple's secondary buttons are.
 *
 * The colour stays the brand blue (--cta); only the manner is Apple's.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-normal tracking-[-0.016em] transition-[background-color,border-color,color,filter,opacity] duration-200 ease-out focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[hsl(var(--cta)/0.5)] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // The one filled blue pill: the action the page is for.
        default:
          "bg-cta text-cta-foreground hover:brightness-110 active:brightness-90",
        // Apple's secondary call to action: a blue outline pill that fills on
        // hover.
        ctaOutline:
          "border border-cta text-cta-ink hover:bg-cta hover:text-cta-foreground active:brightness-90",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-110 active:brightness-90",
        // Neutral actions — Cancel, Edit, Remove. A soft grey that takes the
        // page's own colour, so it reads on white and on black alike.
        outline:
          "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.11] active:bg-foreground/[0.15]",
        secondary:
          "bg-foreground/[0.07] text-foreground hover:bg-foreground/[0.11] active:bg-foreground/[0.15]",
        ghost: "hover:bg-foreground/[0.07] active:bg-foreground/[0.11]",
        link: "rounded-none text-cta-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-[18px]",
        sm: "h-8 px-3.5 text-[13px]",
        // Apple's large call to action: 17px.
        lg: "h-11 px-[22px] text-[17px] tracking-[-0.022em]",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    if (asChild) {
      return (
        <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Comp>
      );
    }
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" />}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
