import { useMemo } from 'react';
import { useAppData } from '../context/AppDataContext';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);

const getToday = () => new Date().toISOString().slice(0, 10);

const parseCurrency = (value: unknown): number => {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'string') return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
  return 0;
};

const diffDays = (dateString: string, reference = getToday()) => {
  if (!dateString) return 0;
  const target = new Date(`${dateString}T00:00:00`);
  const current = new Date(`${reference}T00:00:00`);
  return Math.floor((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
};

const ProfitPage = () => {
  const { orders, reportData, forecastData, customerInsights } = useAppData();

  const weekBuckets = useMemo(() => {
    const buckets = Array.from(
      { length: 5 },
      (_, index) => ({ label: `Week ${index + 1}`, total: 0 })
    );

    orders
      .filter((invoice) => invoice.status === 'Due Soon')
      .forEach((invoice) => {
        const days = diffDays(invoice.dueDate);

        if (days < 0 || days > 29) return;

        const bucketIndex = Math.min(Math.floor(days / 7), 4);
        buckets[bucketIndex].total += parseCurrency(invoice.amount);
      });

    return buckets;
  }, [orders]);

  const maxBucket = Math.max(...weekBuckets.map((bucket) => bucket.total), 1);

  const highRiskCustomers = useMemo(
    () => customerInsights.filter((customer) => customer.riskScore === 'High'),
    [customerInsights]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Cash flow</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">30-day forecast for expected collections</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">See overdue, due soon, and future collections from shared invoice data.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:shrink-0">
            <div className="min-w-0 rounded-3xl bg-slate-950/80 p-5 overflow-hidden">
              <p className="text-sm text-slate-400 truncate">Overdue</p>
              <p 
                className="mt-4 text-xl sm:text-2xl font-semibold text-white truncate"
                title={formatCurrency(reportData?.overdueReceivables ?? 0)}
              >
                {formatCurrency(reportData?.overdueReceivables ?? 0)}
              </p>
            </div>
            <div className="min-w-0 rounded-3xl bg-slate-950/80 p-5 overflow-hidden">
              <p className="text-sm text-slate-400 truncate">Due soon</p>
              <p 
                className="mt-4 text-xl sm:text-2xl font-semibold text-white truncate"
                title={formatCurrency(forecastData?.expected7 ?? 0)}
              >
                {formatCurrency(forecastData?.expected7 ?? 0)}
              </p>
            </div>
            <div className="min-w-0 rounded-3xl bg-slate-950/80 p-5 overflow-hidden">
              <p className="text-sm text-slate-400 truncate">30-day forecast</p>
              <p 
                className="mt-4 text-xl sm:text-2xl font-semibold text-white truncate"
                title={formatCurrency(forecastData?.expected30 ?? 0)}
              >
                {formatCurrency(forecastData?.expected30 ?? 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Forecast chart</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Expected collections by week</h2>
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">Responsive</div>
            </div>

            <div className="mt-8 space-y-4">
              {weekBuckets.map((bucket) => (
                <div key={bucket.label} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>{bucket.label}</span>
                    <span className="truncate ml-2" title={formatCurrency(bucket.total)}>
                      {formatCurrency(bucket.total)}
                    </span>
                  </div>
                  <div className="h-4 rounded-full bg-slate-900">
                    <div
                      className="h-4 rounded-full bg-brand-500"
                      style={{ width: `${(bucket.total / maxBucket) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Cash flow categories</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-400">
              <div className="min-w-0 rounded-3xl bg-slate-900/80 p-4 overflow-hidden">
                <p className="font-semibold text-white">Overdue</p>
                <p className="mt-2">Receivables already past due and still outstanding.</p>
                <p 
                  className="mt-3 text-lg sm:text-xl font-semibold text-white truncate"
                  title={formatCurrency(reportData?.overdueReceivables ?? 0)}
                >
                  {formatCurrency(reportData?.overdueReceivables ?? 0)}
                </p>
              </div>
              <div className="min-w-0 rounded-3xl bg-slate-900/80 p-4 overflow-hidden">
                <p className="font-semibold text-white">Due soon</p>
                <p className="mt-2">Invoices expected within the next 7 days.</p>
                <p 
                  className="mt-3 text-lg sm:text-xl font-semibold text-white truncate"
                  title={formatCurrency(forecastData?.expected7 ?? 0)}
                >
                  {formatCurrency(forecastData?.expected7 ?? 0)}
                </p>
              </div>
              <div className="min-w-0 rounded-3xl bg-slate-900/80 p-4 overflow-hidden">
                <p className="font-semibold text-white">Future expected</p>
                <p className="mt-2">Projected receipts from the remainder of the 30-day window.</p>
                <p 
                  className="mt-3 text-lg sm:text-xl font-semibold text-white truncate"
                  title={formatCurrency(Math.max(0, (forecastData?.expected30 ?? 0) - (forecastData?.expected7 ?? 0)))}
                >
                  {formatCurrency(Math.max(0, (forecastData?.expected30 ?? 0) - (forecastData?.expected7 ?? 0)))}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Data-driven cash flow metrics</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="min-w-0 rounded-3xl bg-slate-900/80 p-5 overflow-hidden">
                <p className="text-sm text-slate-400 truncate">Collection rate</p>
                <p className="mt-3 text-2xl font-semibold text-white truncate">{reportData?.collectionRate ?? 0}%</p>
              </div>
              <div className="min-w-0 rounded-3xl bg-slate-900/80 p-5 overflow-hidden">
                <p className="text-sm text-slate-400 truncate">Avg. days to payment</p>
                <p className="mt-3 text-2xl font-semibold text-white truncate">{reportData?.averageDaysToPayment ?? 0}</p>
              </div>
              <div className="min-w-0 rounded-3xl bg-slate-900/80 p-5 overflow-hidden">
                <p className="text-sm text-slate-400 truncate">Outstanding receivables</p>
                <p 
                  className="mt-3 text-xl sm:text-2xl font-semibold text-white truncate"
                  title={formatCurrency(reportData?.outstandingReceivables ?? 0)}
                >
                  {formatCurrency(reportData?.outstandingReceivables ?? 0)}
                </p>
              </div>
              <div className="min-w-0 rounded-3xl bg-slate-900/80 p-5 overflow-hidden">
                <p className="text-sm text-slate-400 truncate">Expected receivables</p>
                <p 
                  className="mt-3 text-xl sm:text-2xl font-semibold text-white truncate"
                  title={formatCurrency(forecastData?.expected30 ?? 0)}
                >
                  {formatCurrency(forecastData?.expected30 ?? 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">High-risk customer exposure</h2>
            <div className="mt-6 space-y-4 text-sm text-slate-400">
              {highRiskCustomers.length === 0 ? (
                <p>No high-risk customers are currently identified.</p>
              ) : (
                highRiskCustomers.map((customer) => (
                  <div key={customer.id} className="rounded-3xl bg-slate-900/80 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white truncate">{customer.name}</p>
                        <p className="mt-1 text-slate-400 truncate">{customer.company}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-rose-500/10 px-3 py-1 text-xs text-rose-200">High risk</span>
                    </div>
                    <p className="mt-3 truncate">Outstanding: {customer.outstandingBalance}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfitPage;