import { useMemo, useState, useRef, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const parseAmount = (val: unknown): number => {
  if (typeof val === 'number') return Number.isNaN(val) ? 0 : val;
  if (typeof val === 'string') return Number(val.replace(/[^0-9.-]+/g, '')) || 0;
  return 0;
};

// مكون التقويم التفاعلي الموحد
const CustomDatePicker = ({
  value,
  onChange,
  placeholder = 'Select date'
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsed = useMemo(() => {
    if (value && !Number.isNaN(new Date(value).getTime())) {
      const d = new Date(value);
      return { y: d.getFullYear(), m: d.getMonth(), d: d.getDate() };
    }
    const today = new Date();
    return { y: today.getFullYear(), m: today.getMonth(), d: today.getDate() };
  }, [value]);

  const [viewYear, setViewYear] = useState(parsed.y);
  const [viewMonth, setViewMonth] = useState(parsed.m);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const handleSelectDay = (d: number) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    onChange(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="mt-2 flex w-full items-center justify-between rounded-3xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white transition hover:border-slate-700 outline-none"
      >
        <span className={value ? 'text-white font-medium' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <svg
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-semibold text-white">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                title="الشهر السابق"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                title="الشهر القادم"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
            {days.map((d, idx) => {
              if (d === null) return <div key={`empty-${idx}`} className="h-8 w-8" />;
              const isCurrent =
                value &&
                new Date(value).getFullYear() === viewYear &&
                new Date(value).getMonth() === viewMonth &&
                new Date(value).getDate() === d;

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    isCurrent
                      ? 'bg-brand-500 font-bold text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-between border-t border-slate-800 pt-2 text-xs">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-rose-400 transition"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const pad = (n: number) => String(n).padStart(2, '0');
                onChange(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
                setViewYear(now.getFullYear());
                setViewMonth(now.getMonth());
                setIsOpen(false);
              }}
              className="font-medium text-brand-400 hover:underline"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportsPage = () => {
  const { orders, reportData, customerInsights, forecastData } = useAppData();
  const [toastMessage, setToastMessage] = useState('');
  
  // فلترة التقارير حسب النطاق الزمني
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const overdueCustomers = useMemo(() => reportData?.topOverdueCustomers || [], [reportData]);

  // تصفية الفواتير بحسب التواريخ المختارة إن وجدت
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter((inv) => {
      const invDate = inv.issueDate || inv.dueDate;
      if (!invDate) return true;
      if (startDate && invDate < startDate) return false;
      if (endDate && invDate > endDate) return false;
      return true;
    });
  }, [orders, startDate, endDate]);

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
    () => filteredOrders.filter((invoice) => invoice.status === 'Due Soon').length,
    [filteredOrders]
  );

  const paidInvoices = useMemo(
    () => filteredOrders.filter((invoice) => invoice.status === 'Paid'),
    [filteredOrders]
  );

  // حساب DSO (Days Sales Outstanding) الحقيقي
  const dsoMetrics = useMemo(() => {
    if (filteredOrders.length === 0) return { dso: 0, status: 'Optimal' };

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
  }, [filteredOrders, paidInvoices]);

  // حساب CEI (Collection Effectiveness Index) الحقيقي
  const ceiRate = useMemo(() => {
    if (filteredOrders.length === 0) return 100;
    const totalReceivables = filteredOrders.reduce((sum, inv) => sum + parseAmount(inv.amount), 0);
    const totalCollected = paidInvoices.reduce((sum, inv) => sum + parseAmount(inv.amount), 0);

    if (totalReceivables === 0) return 100;
    return Math.min(100, Math.round((totalCollected / totalReceivables) * 100));
  }, [filteredOrders, paidInvoices]);

  // Export strictly real user data
  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Overdue Amount', 'Overdue Invoices Count', 'Status'];

    const dataRows: (string | number)[][] =
      overdueCustomers.length > 0
        ? overdueCustomers.map((c: any) => [
            `"${c.customerName}"`,
            `"${c.overdueAmount}"`,
            c.overdueCount,
            '"Overdue"'
          ])
        : [['"No Overdue Accounts Recorded"', '"$0.00"', 0, '"All Settled"']];

    const csvContent =
      'sep=,\n' + [headers.join(','), ...dataRows.map((row: (string | number)[]) => row.join(','))].join('\n');

    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
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
            <p className="mt-2 max-w-2xl text-xs text-slate-400">
              Generated on {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}
            </p>
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

        {/* فلاتر النطاق الزمني التنفيذي للتقرير مع التقويم الموحد */}
        <div className="no-print mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Report Date Range Filter
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-44">
                <CustomDatePicker
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  placeholder="From Date"
                />
              </div>
              <span className="text-slate-600 text-xs mt-2">→</span>
              <div className="w-44">
                <CustomDatePicker
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  placeholder="To Date"
                />
              </div>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="mt-2 rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-rose-400 hover:bg-slate-800 transition"
                >
                  Reset
                </button>
              )}
            </div>
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
            <p className="mt-3 text-2xl font-bold text-sky-400">
              {dsoMetrics.dso} <span className="text-sm font-normal text-slate-400">Days</span>
            </p>
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
                  {Math.min(
                    100,
                    Math.round(((reportData?.overdueReceivables || 0) / Math.max(reportData?.outstandingReceivables || 1, 1)) * 120)
                  )}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">Expected Incoming (30 Days)</span>
                <span className="text-xs font-bold text-emerald-400">{formatCurrency(forecastData?.expected30 || 0)}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/90 p-3.5 border border-slate-800/60">
                <span className="text-xs text-slate-300">Delinquent Invoices</span>
                <span className="text-xs font-bold text-rose-400">
                  {filteredOrders.filter((i) => i.status === 'Overdue').length}
                </span>
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
                  <td colSpan={4} className="px-5 py-6 text-center text-slate-400">
                    All customer ledgers are currently in good standing.
                  </td>
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