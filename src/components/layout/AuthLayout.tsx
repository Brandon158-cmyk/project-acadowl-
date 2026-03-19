import Link from 'next/link';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-school-primary" aria-hidden="true" />
          <span className="font-serif text-xl font-semibold text-onyx">
            Acadowl
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] border border-gray-200 border-t-4 border-t-school-primary">
            {children}
          </div>

          {/* Footer links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate">
              Need help?{' '}
              <Link
                href="/support"
                className="text-school-primary hover:text-crimson-dark transition-colors duration-200"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-sm text-slate">
        <p>Powered by Acadowl</p>
      </footer>
    </div>
  );
}
