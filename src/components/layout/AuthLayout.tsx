import { GraduationCap } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  /** Main heading shown on the right panel */
  panelHeading: string;
  /** Supporting paragraph shown on the right panel */
  panelBody: string;
  /** Optional slot at the bottom of the right panel */
  panelFooter?: React.ReactNode;
}

/**
 * Two-column auth card layout.
 *
 * Left  — bg-text-primary (#1A1A1A charcoal), contextual copy
 * Right — bg-surface (white), contains the form (children)
 *
 * Card is centered on bg-app-bg, framed with border-border-panel.
 * The charcoal panel intentionally uses the darkest neutral from the palette,
 * not the accent — indigo is reserved for interactive elements only.
 */
export function AuthLayout({
  children,
  panelHeading,
  panelBody,
  panelFooter,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-6">
      {/* ── Card ── */}
      <div className="flex w-full max-w-[800px] min-h-[480px] bg-surface border border-border-panel rounded-xl overflow-hidden">
        {/* ── Left: context panel ── */}
        {/*
         * bg-text-primary reuses the #1A1A1A token — warm charcoal.
         * On the dark panel, text-secondary (#6B6B6B) and text-tertiary (#9E9E9E)
         * read as mid-gray and light-gray against the dark bg — intentional.
         */}
        <div className="w-[288px] shrink-0 bg-text-primary flex flex-col justify-between px-9 py-10">
          {/* Top copy */}
          <div>
            <p className="text-[12px] font-semibold text-text-tertiary uppercase tracking-[0.08em] mb-8">
              Acadowl Learning
            </p>
            <h2 className="text-[17px] font-semibold text-white leading-[1.45] tracking-[-0.01em]">
              {panelHeading}
            </h2>
            <p className="mt-3 text-[12px] text-text-secondary leading-[1.65]">
              {panelBody}
            </p>
          </div>

          {/* Bottom slot */}
          {panelFooter && (
            <div className="border-t border-border-inner pt-6">
              {panelFooter}
            </div>
          )}
        </div>

        {/* ── Right: form ── */}
        <div className="flex-1 flex flex-col justify-center px-10 py-10">
          {/* Brand mark */}
          <div className="flex items-center gap-2 mb-9">
            <div className="w-7 h-7 bg-accent rounded-[7px] flex items-center justify-center shrink-0">
              <GraduationCap
                size={14}
                className="text-white"
                aria-hidden="true"
              />
            </div>
            <span className="text-[14px] font-semibold text-text-primary tracking-tight">
              Acadowl
            </span>
          </div>

          {/* Page-specific content */}
          {children}
        </div>
      </div>

      {/* Footer */}
      <p className="mt-5 text-[12px] text-text-tertiary">
        Powered by Acadowl · 2025–2026 Academic Year
      </p>
    </div>
  );
}
