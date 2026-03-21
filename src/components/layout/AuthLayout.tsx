import Link from 'next/link';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-accent" aria-hidden="true" />
          <span className="text-xl font-bold tracking-tight text-text-primary">
            Acadowl
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-lg bg-white p-8 shadow-none border border-border-panel">
            {children}
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <p className="text-[13px] text-text-secondary">
              Need help?{' '}
              <Link
                href="/support"
                className="text-accent font-medium hover:text-accent-hover transition-colors duration-200"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-[13px] text-text-secondary">
        <p>Powered by Acadowl</p>
      </footer>
    </div>
  );
}
