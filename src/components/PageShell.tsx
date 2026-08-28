import { ReactNode } from 'react';
import Navigation from './Navigation';

const PageShell = ({ children }: { children: ReactNode }) => (
  <div className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 lg:px-8">
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_1fr] xl:items-start">
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <Navigation />
      </aside>
      <main className="space-y-6">{children}</main>
    </div>
  </div>
);

export default PageShell;
