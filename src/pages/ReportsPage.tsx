import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const ReportsPage = () => {
  const { orders, inventory, metrics, reportData, customerInsights, forecastData } = useAppData();

  const overdueCustomers = useMemo(() => reportData.topOverdueCustomers, [reportData]);

  const customerRiskCount = useMemo(
  () =>
    customerInsights.filter(
      (customer) =>
        customer.riskScore === 'High' &&
        Number(customer.outstandingBalance.replace(/[^0-9.-]/g, '')) > 0
    ).length,
  [customerInsights]
);

  const dueSoonCount = useMemo(
    () => orders.filter((invoice) => invoice.status === 'Due Soon').length,
    [orders]
  );
  const paidThisMonthCount = useMemo(
    () => orders.filter((invoice) => invoice.status === 'Paid').length,
    [orders]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Reports</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Receivables analytics and cash flow reporting</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">Review overdue exposure, customer risk, and collection performance with actionable finance reports.</p>
          </div>
          <button className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
            Export PDF
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Outstanding balance</p>
            <p className="mt-4 text-4xl font-semibold text-white">{formatCurrency(reportData.outstandingReceivables)}</p>
            <p className="mt-3 text-sm text-slate-500">Current receivables total.</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Overdue exposure</p>
            <p className="mt-4 text-4xl font-semibold text-white">{formatCurrency(reportData.overdueReceivables)}</p>
            <p className="mt-3 text-sm text-slate-500">Total overdue amount today.</p>
          </div>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-sm text-slate-400">Collection rate</p>
            <p className="mt-4 text-4xl font-semibold text-white">{reportData.collectionRate}%</p>
            <p className="mt-3 text-sm text-slate-500">Percentage of receivables not yet overdue.</p>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Customer risk summary</h2>
            <p className="mt-3 text-sm text-slate-400">High-risk accounts and overdue relationships to prioritize.</p>
            <div className="mt-6 grid gap-4">
              <div className="flex items-center justify-between rounded-3xl bg-slate-900/80 p-4">
                <span className="text-sm text-slate-300">High-risk customers</span>
                <span className="text-sm font-semibold text-white">{customerRiskCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-slate-900/80 p-4">
                <span className="text-sm text-slate-300">Invoices due soon</span>
                <span className="text-sm font-semibold text-white">{dueSoonCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-3xl bg-slate-900/80 p-4">
                <span className="text-sm text-slate-300">Paid invoices this month</span>
                <span className="text-sm font-semibold text-white">{paidThisMonthCount}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Cash flow outlook</h2>
            <p className="mt-3 text-sm text-slate-400">Use this report to anticipate funding gaps and customer collection needs.</p>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Current collection risk</span>
                  <span className="font-semibold text-white">{Math.min(100, Math.round((reportData.overdueReceivables / Math.max(reportData.outstandingReceivables, 1)) * 120))}%</span>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Expected incoming</span>
                  <span className="font-semibold text-white">{formatCurrency(forecastData.expected30)}</span>
                </div>
              </div>
              <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Overdue invoice count</span>
                  <span className="font-semibold text-white">{orders.filter((invoice) => invoice.status === 'Overdue').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Overdue invoices</p>
            <h2 className="mt-3 text-xl font-semibold text-white">Current overdue accounts</h2>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950/80">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Customer</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Overdue amount</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Overdue invoices</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/95">
             {overdueCustomers.length === 0 ? (
  <tr>
    <td colSpan={4} className="px-6 py-6 text-center text-sm text-slate-400">No overdue customer accounts at the moment.</td>
  </tr>
) : (
  overdueCustomers.map((customer: any) => (
    <tr key={customer.customerName} className="hover:bg-slate-900/90">
      <td className="px-6 py-5 text-slate-200">{customer.customerName}</td>
      <td className="px-6 py-5 text-slate-300">{customer.overdueAmount}</td>
      <td className="px-6 py-5 text-slate-300">{customer.overdueCount}</td>
      <td className="px-6 py-5 text-slate-300">&mdash;</td>
    </tr>
  ))
)}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ReportsPage;
