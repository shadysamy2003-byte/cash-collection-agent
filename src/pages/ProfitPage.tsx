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

const addDays = (dateString: string, days: number) => {
  if (!dateString) return getToday();
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const ProfitPage = () => {
  const { orders, reportData, forecastData, customerInsights } = useAppData();

  const insightMap = useMemo(
    () => new Map(customerInsights.map((insight) => [insight.id, insight])),
    [customerInsights]
  );

  // قائمة الفواتير غير المسددة مع حساب تاريخ التحصيل المتوقع الفعلي
  const openInvoicesWithPrediction = useMemo(() => {
    const today = getToday();
    return orders
      .filter((inv) => inv.status !== 'Paid')
      .map((inv) => {
        const customer = insightMap.get(inv.customerId);
        const delay = customer?.averagePaymentDelay || (customer?.reliability === 'Needs improvement' ? 14 : 0);
        
        let expectedDate = inv.dueDate;
        // إذا كانت الفاتورة متأخرة بالفعل، يُتوقع تحصيلها خلال الأسبوع الحالي أو القادم
        if (inv.status === 'Overdue') {
          expectedDate = addDays(today, Math.max(3, delay || 5));
        } else {
          expectedDate = addDays(inv.dueDate, delay);
        }

        const daysToExpected = diffDays(expectedDate, today);
        const daysToContractual = diffDays(inv.dueDate, today);

        return {
          ...inv,
          parsedAmount: parseCurrency(inv.amount),
          expectedDate,
          daysToExpected,
          daysToContractual,
          riskScore: customer?.riskScore || 'Low',
          reliability: customer?.reliability || 'Good'
        };
      });
  }, [orders, insightMap]);

  // المقارنة الأسبوعية: التعاقدي الورقي مقابل المتوقع الفعلي
  const comparisonBuckets = useMemo(() => {
    const buckets = Array.from({ length: 4 }, (_, i) => ({
      label: `Week ${i + 1}`,
      contractual: 0,
      predicted: 0
    }));

    openInvoicesWithPrediction.forEach((inv) => {
      // 1. التعاقدي (Contractual)
      if (inv.daysToContractual >= 0 && inv.daysToContractual <= 28) {
        const idx = Math.min(Math.floor(inv.daysToContractual / 7), 3);
        buckets[idx].contractual += inv.parsedAmount;
      }

      // 2. المتوقع الواقعي بناءً على سلوك العميل (Predicted)
      if (inv.daysToExpected >= 0 && inv.daysToExpected <= 28) {
        const idx = Math.min(Math.floor(inv.daysToExpected / 7), 3);
        buckets[idx].predicted += inv.parsedAmount;
      }
    });

    return buckets;
  }, [openInvoicesWithPrediction]);

  const maxVal = Math.max(
    ...comparisonBuckets.flatMap((b) => [b.contractual, b.predicted]),
    1
  );

  const highRiskCustomers = useMemo(
    () => customerInsights.filter((customer) => customer.riskScore === 'High'),
    [customerInsights]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Predictive Cash Flow</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Smart 30-Day Cash Flow Forecast</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">
              AI-driven inflow projection adjusting contractual due dates against historical customer settlement behavior.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:w-auto lg:shrink-0">
            <div className="min-w-0 rounded-3xl bg-slate-950/80 p-5 overflow-hidden border border-slate-800/80">
              <p className="text-xs uppercase text-slate-400">Overdue Capital</p>
              <p className="mt-3 text-2xl font-bold text-rose-400 truncate">
                {formatCurrency(reportData?.overdueReceivables ?? 0)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Requires collection push</p>
            </div>
            <div className="min-w-0 rounded-3xl bg-slate-950/80 p-5 overflow-hidden border border-slate-800/80">
              <p className="text-xs uppercase text-slate-400">Next 7 Days (Expected)</p>
              <p className="mt-3 text-2xl font-bold text-emerald-400 truncate">
                {formatCurrency(comparisonBuckets[0].predicted)}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Immediate liquidity</p>
            </div>
            <div className="min-w-0 rounded-3xl bg-slate-950/80 p-5 overflow-hidden border border-slate-800/80">
              <p className="text-xs uppercase text-slate-400">30-Day Inflow</p>
              <p className="mt-3 text-2xl font-bold text-brand-300 truncate">
                {formatCurrency(comparisonBuckets.reduce((sum, b) => sum + b.predicted, 0))}
              </p>
              <p className="mt-1 text-[11px] text-slate-500">Adjusted forecast</p>
            </div>
          </div>
        </div>

        {/* Forecast Comparison Chart */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Variance Analysis</p>
                <h2 className="mt-2 text-xl font-semibold text-white">Contractual Due vs. Predicted Inflow</h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-3 w-3 rounded-full bg-slate-600 inline-block" />
                  Contractual Due
                </div>
                <div className="flex items-center gap-1.5 text-emerald-300">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                  Behavioral Inflow
                </div>
              </div>
            </div>

            <div className="mt-8 space-y-6">
              {comparisonBuckets.map((bucket) => (
                <div key={bucket.label} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-white">{bucket.label}</span>
                    <div className="space-x-3">
                      <span>Due: <strong className="text-slate-300">{formatCurrency(bucket.contractual)}</strong></span>
                      <span>•</span>
                      <span>Expected: <strong className="text-emerald-400">{formatCurrency(bucket.predicted)}</strong></span>
                    </div>
                  </div>
                  
                  {/* Contractual Bar */}
                  <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full bg-slate-600 transition-all duration-500"
                      style={{ width: `${(bucket.contractual / maxVal) * 100}%` }}
                    />
                  </div>
                  {/* Predicted Bar */}
                  <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-2.5 rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${(bucket.predicted / maxVal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Predictive Engine Insights</h2>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                The algorithm accounts for historical debtor payment delays instead of static invoice dates.
              </p>

              <div className="mt-6 space-y-3.5 text-xs">
                <div className="rounded-2xl bg-slate-900/80 p-3.5 border border-slate-800/80">
                  <p className="text-slate-400">Collection Reliability</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {reportData?.collectionRate || 100}% On-Time Index
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-3.5 border border-slate-800/80">
                  <p className="text-slate-400">Avg. Historical Delay</p>
                  <p className="mt-1 text-sm font-semibold text-amber-300">
                    +{reportData?.averageDaysToPayment || 0} Days Past Terms
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 p-3.5 border border-slate-800/80">
                  <p className="text-slate-400">High Risk Exposure</p>
                  <p className="mt-1 text-sm font-semibold text-rose-400">
                    {highRiskCustomers.length} Flagged Debtor Accounts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expected Inflow Schedule Table */}
        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Expected Inflow Schedule (Real-Time Projections)</h2>
            <span className="text-xs text-slate-500">{openInvoicesWithPrediction.length} Open Invoices</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase tracking-wider font-medium">
                <tr>
                  <th className="px-5 py-3 text-left">Invoice</th>
                  <th className="px-5 py-3 text-left">Customer</th>
                  <th className="px-5 py-3 text-left">Contractual Due</th>
                  <th className="px-5 py-3 text-left">Smart Expected Date</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                  <th className="px-5 py-3 text-right">Risk Factor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/90">
                {openInvoicesWithPrediction.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-slate-400">
                      All receivables have been settled. No pending inflows.
                    </td>
                  </tr>
                ) : (
                  openInvoicesWithPrediction.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-900/60">
                      <td className="px-5 py-3.5 font-medium text-slate-200">{inv.invoiceNumber}</td>
                      <td className="px-5 py-3.5 text-slate-300">{inv.customerName}</td>
                      <td className="px-5 py-3.5 text-slate-400">{inv.dueDate}</td>
                      <td className="px-5 py-3.5 font-medium text-emerald-400">
                        {inv.expectedDate}
                        {inv.expectedDate !== inv.dueDate && (
                          <span className="ml-1.5 text-[10px] text-amber-400/80">(Adjusted)</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold text-white">{formatCurrency(inv.parsedAmount)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                          inv.riskScore === 'High' 
                            ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' 
                            : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                        }`}>
                          {inv.riskScore}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfitPage;