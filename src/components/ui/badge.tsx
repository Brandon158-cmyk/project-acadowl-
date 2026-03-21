import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-md border border-transparent px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap transition-all focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/15 aria-invalid:border-error aria-invalid:ring-error/20 [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-accent-bg text-accent border-accent/10",
        secondary:
          "bg-surface-subtle text-text-secondary border-border-panel",
        success:
          "bg-success-bg text-success border-success-border",
        error:
          "bg-error-bg text-error border-error-border",
        warning:
          "bg-warning-bg text-warning border-warning/10",
        info:
          "bg-info-bg text-info border-info-border",
        outline:
          "border-border-panel text-text-secondary bg-white hover:bg-surface-hover",
        ghost:
          "hover:bg-surface-hover text-text-secondary",
        link: "text-accent underline-offset-4 hover:underline",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
