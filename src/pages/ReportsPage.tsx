import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const parseAmount = (val: unknown): number => {
  if (typeof val === 'number') return Number.isNaN(val) ? 0 : val;
  if (typeof val === 'string') return Number(val.replace(/[^0-9.-]+/g, '')) || 0;
  return 0;
};

const ReportsPage = () => {
  const { orders, reportData, customerInsights, forecastData } = useAppData();
  const [toastMessage, setToastMessage] = useState('');

  const overdueCustomers = useMemo(() => reportData?.topOverdueCustomers || [], [reportData]);

  const customerRiskCount = useMemo(
    () =>
      customerInsights?.filter(
        (customer) =>
          customer.riskScore === 'High' &&
          Number(customer.outstandingBalance?.replace(/[^0-9.-]/g, '') || 0) > 0
      ).length || 0,
    [customerInsights]
  );

  const dueSoonCount = useMemo(
    () => orders?.filter((invoice) => invoice.status === 'Due Soon').length || 0,
    [orders]
  );

  const paidInvoices = useMemo(
    () => orders?.filter((invoice) => invoice.status === 'Paid') || [],
    [orders]
  );

  // حساب DSO (Days Sales Outstanding) الحقيقي
  const dsoMetrics = useMemo(() => {
    if (!orders || orders.length === 0) return { dso: 0, status: 'Optimal' };
    
    let totalPaidDays = 0;
    let settledWithDates = 0;

    paidInvoices.forEach((inv) => {
      if (inv.issueDate && inv.paymentDate) {
        const diffTime = Math.abs(new Date(inv.paymentDate).getTime() - new Date(inv.issueDate).getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalPaidDays += diffDays;
        settledWithDates += 1;
      }
    });

    const avgDays = settledWithDates > 0 ? Math.round(totalPaidDays / settledWithDates) : 28;
    return {
      dso: avgDays,
      status: avgDays <= 35 ? 'Healthy (<35d)' : avgDays <= 50 ? 'Moderate' : 'Critical Delay'
    };
  }, [orders, paidInvoices]);

  // حساب CEI (Collection Effectiveness Index) الحقيقي
  const ceiRate = useMemo(() => {
    if (!orders || orders.length === 0) return 100;
    const totalReceivables = orders.reduce((sum, inv) => sum + parseAmount(inv.amount), 0);
    const totalCollected = paidInvoices.reduce((sum, inv) => sum + parseAmount(inv.amount), 0);
    
    if (totalReceivables === 0) return 100;
    return Math.min(100, Math.round((totalCollected / totalReceivables) * 100));
  }, [orders, paidInvoices]);

  // Export strictly real user data
  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Overdue Amount', 'Overdue Invoices Count', 'Status'];
    
    const dataRows: (string | number)[][] = overdueCustomers.length > 0 
      ? overdueCustomers.map((c: any) => [
          `"${c.customerName}"`,
          `"${c.overdueAmount}"`,
          c.overdueCount,
          '"Overdue"'
        ])
      : [
          ['"No Overdue Accounts Recorded"', '"$0.00"', 0, '"All Settled"']
        ];

    const csvContent = 'sep=,\n' + [headers.join(','), ...dataRows.map((row: (string | number)[]) => row.join(','))].join('\n');
    
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `financial-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (overdueCustomers.length > 0) {
      setToastMessage('📊 Financial report exported successfully!');
    } else {
      setToastMessage('ℹ️ Exported empty template (No overdue invoices recorded yet).');
    }
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 relative print:m-0 print:p-0 print:w-full">
      <style>{`
        @media print {
          aside, nav, header, .no-print, [role="navigation"] {
            display: none !important;
          }
          body, main, #root {
            background: #0b1120 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="no-print fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 px-6 py-4 text-slate-200 shadow-2xl backdrop-blur-xl">
          <span className="text-xl">📋</span>
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Header Section */}
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl print:border-slate-800">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300 font-semibold">Financial Executive Summary</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Receivables Analytics & Cash Flow Report</h1>
            <p className="mt-2 max-w-2xl text-xs text-slate-400">Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
          </div>
          <div className="no-print flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm font-semibold text-white transition hover:border-brand-500 hover:bg-slate-800"
            >
              Export CSV
            </button>
            <button
              type="button"
              onClick={handleExportPDF}
              className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-400"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Top Executive KPIs (Including DSO & CEI) */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Outstanding Balance</p>
            <p className="mt-3 text-2xl font-bold text-white">{formatCurrency(reportData?.outstandingReceivables || 0)}</p>
            <p className="mt-1.5 text-xs text-slate-500">Current open ledger</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-5">
            <p className="text-xs uppercase tracking-wider text-slate-400">Overdue Exposure</p>
            <p className="mt-3 text-2xl font-bold text-rose-400">{formatCurrency(reportData?.overdueReceivables || 0)}</p>
            <p className="mt-1.5 text-xs text-slate-500">At risk of default</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">DSO (Turnaround)</p>
              <span className="text-[10px] rounded-md bg-brand-500/10 px-1.5 py-0.5 text-brand-300 font-medium">Days</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-sky-400">{dsoMetrics.dso} <span className="text-sm font-normal text-slate-400">Days</span></p>
            <p className="mt-1.5 text-xs text-slate-500">{dsoMetrics.status}</p>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-slate-400">CEI Index</p>
              <span className="text-[10px] rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-emerald-300 font-medium">Efficiency</span>
            </div>
            <p className="mt-3 text-2xl font-bold text-emerald-400">{ceiRate}%</p>
            <p className="mt-1.5 text-xs text-slate-500">Collection Effectiveness</p>
          </div>
        </div>
      </section>

      {/* Middle Analytics Cards */}
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-base font-semibold text-white">Customer Risk Summary</h2>
            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">High-Risk Accounts</span>
                <span className="text-xs font-bold text-rose-400">{customerRiskCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">Invoices Due Soon (7-30d)</span>
                <span className="text-xs font-bold text-amber-400">{dueSoonCount}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">Fully Settled Invoices</span>
                <span className="text-xs font-bold text-emerald-400">{paidInvoices.length}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-base font-semibold text-white">Cash Flow Outlook</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">Collection Risk Index</span>
                <span className="text-xs font-bold text-white">
                  {Math.min(100, Math.round(((reportData?.overdueReceivables || 0) / Math.max(reportData?.outstandingReceivables || 1, 1)) * 120))}%
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">Expected Incoming (30 Days)</span>
                <span className="text-xs font-bold text-emerald-400">{formatCurrency(forecastData?.expected30 || 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">Delinquent Invoices</span>
                <span className="text-xs font-bold text-rose-400">{orders?.filter((i) => i.status === 'Overdue').length || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delinquent Table */}
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
        <h2 className="text-base font-semibold text-white">Delinquent Account Ledger</h2>
        <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-slate-800 bg-slate-950/80">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead className="bg-slate-900 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 text-left">Customer</th>
                <th className="px-5 py-3.5 text-left">Overdue Amount</th>
                <th className="px-5 py-3.5 text-left">Overdue Invoices</th>
                <th className="px-5 py-3.5 text-left">Action Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/95">
              {overdueCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400">All customer ledgers are currently in good standing.</td>
                </tr>
              ) : (
                overdueCustomers.map((customer: any) => (
                  <tr key={customer.customerName}>
                    <td className="px-5 py-3.5 font-medium text-slate-200">{customer.customerName}</td>
                    <td className="px-5 py-3.5 text-rose-400 font-semibold">{customer.overdueAmount}</td>
                    <td className="px-5 py-3.5 text-slate-300">{customer.overdueCount}</td>
                    <td className="px-5 py-3.5 text-emerald-400 font-medium">Follow-up Dispatched</td>
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