import { Link } from 'react-router-dom';

const LandingPage = () => (
  <div className="relative overflow-hidden rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
    <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div className="space-y-8">
        <div className="inline-flex items-center rounded-full bg-brand-500/10 px-4 py-2 text-sm text-brand-200 ring-1 ring-brand-500/10">
          Built for finance teams at growing SMBs
        </div>
        <div>
          <h2 className="text-4xl font-semibold text-white sm:text-5xl">Collect more cash, reduce overdue risk, and keep receivables under control.</h2>
          <p className="mt-5 max-w-xl text-slate-400">Cash Collection Agent helps small and medium businesses prioritize late invoices, forecast cash flow, and engage customers with actionable reminders.</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <Link to="/signup" className="rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition hover:bg-brand-400">Start collecting</Link>
          <Link to="/pricing" className="rounded-2xl border border-slate-700 bg-slate-900/80 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-brand-500 hover:text-white">View plans</Link>
        </div>
      </div>
      <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/40">
        <div className="grid gap-4 rounded-3xl bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Receivables snapshot</p>
              <p className="mt-2 text-3xl font-semibold text-white">$124.6K</p>
            </div>
            <span className="rounded-2xl bg-emerald-500/15 px-3 py-2 text-xs text-emerald-200">+12.4%</span>
          </div>
          <div className="space-y-3">
            <div className="rounded-3xl bg-slate-900/80 p-4">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Overdue invoices</span>
                <span>14</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-1/2 rounded-full bg-rose-500"></div>
              </div>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-4">
              <div className="flex items-center justify-between text-sm text-slate-400">
                <span>Collection health</span>
                <span>88%</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full w-[88%] rounded-full bg-emerald-400"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="mt-12 grid gap-6 lg:grid-cols-3">
      <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Priority</p>
        <h3 className="mt-3 text-xl font-semibold text-white">Prioritize overdue invoices</h3>
        <p className="mt-4 text-sm text-slate-400">Automatically highlight the invoices that need action first so your team can recover cash faster.</p>
      </div>
      <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Forecast</p>
        <h3 className="mt-3 text-xl font-semibold text-white">See cash flow in advance</h3>
        <p className="mt-4 text-sm text-slate-400">Forecast incoming payments, overdue exposure, and funding gaps for the next 30 days.</p>
      </div>
      <div className="rounded-[1.75rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Customers</p>
        <h3 className="mt-3 text-xl font-semibold text-white">Spot payment risk</h3>
        <p className="mt-4 text-sm text-slate-400">Identify habitually slow-paying accounts and focus on the relationships that matter most.</p>
      </div>
    </div>
  </div>
);

export default LandingPage;
