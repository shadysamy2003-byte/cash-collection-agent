import { Link } from 'react-router-dom';

const Header = () => (
  <header className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
    <div>
      <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Cash Collection Agent</p>
      <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">The modern HQ for invoice collection and receivables management.</h1>
      <p className="mt-4 max-w-2xl text-slate-400">Monitor cash flow, prioritize overdue invoices, and reduce payment risk with one intuitive dashboard.</p>
    </div>
    <div className="flex flex-wrap gap-3">
      <Link to="/pricing" className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
        View pricing
      </Link>
      <Link to="/signup" className="inline-flex items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-brand-500 hover:text-white">
        Start free
      </Link>
    </div>
  </header>
);

export default Header;
