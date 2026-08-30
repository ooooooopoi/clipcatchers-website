import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        // The primary action, and the only filled colour on the page. It was
        // white-on-white with a shadow doing the work, which is elegant and
        // asks the eye to hunt for it; on a page whose whole job is getting
        // one button pressed, the button should be the thing you see first.
        //
        // Orange is reserved for this. If you find it anywhere that isn't a
        // call to action, that's a bug — see the token note in globals.css.
        default:
          "bg-cta text-cta-foreground shadow-[0_1px_2px_hsl(var(--cta)/0.24),0_6px_16px_-6px_hsl(var(--cta)/0.45)] hover:bg-[hsl(var(--cta)/0.92)] hover:shadow-[0_1px_2px_hsl(var(--cta)/0.3),0_10px_24px_-8px_hsl(var(--cta)/0.55)]",
        // The secondary call to action — "See how it works" beside "Launch a
        // Campaign". Orange to say it belongs to the same pair, unfilled to
        // say which one is the main event.
        ctaOutline:
          "border border-cta/40 bg-background text-cta-ink shadow-[0_1px_2px_hsl(var(--foreground)/0.04)] hover:border-cta/70 hover:bg-[hsl(var(--cta)/0.06)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        // Neutral secondary, for anything that isn't a call to action.
        outline:
          "border border-border bg-transparent hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6",
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
