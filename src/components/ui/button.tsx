"use client"

import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-md border border-transparent bg-clip-padding text-[13px] font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-accent focus-visible:ring-3 focus-visible:ring-accent/15 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-accent text-white shadow-sm hover:bg-accent-hover transition-shadow",
        outline:
          "border-border-panel bg-white hover:bg-surface-hover hover:text-text-primary aria-expanded:bg-surface-subtle",
        secondary:
          "bg-surface-subtle text-text-primary border-border-panel hover:bg-surface-hover border aria-expanded:bg-surface-subtle",
        ghost:
          "hover:bg-surface-hover text-text-secondary hover:text-text-primary aria-expanded:bg-surface-hover",
        destructive:
          "bg-error-bg text-error border-error-border border hover:bg-error-bg/80 focus-visible:border-error/40 focus-visible:ring-error/20",
        link: "text-accent underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-3 in-data-[slot=button-group]:rounded-md",
        xs: "h-6 gap-1 px-2 text-[11px] in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 px-2.5 in-data-[slot=button-group]:rounded-md",
        lg: "h-10 gap-1.5 px-4",
        icon: "size-8",
        "icon-xs":
          "size-6 in-data-[slot=button-group]:rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 in-data-[slot=button-group]:rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
