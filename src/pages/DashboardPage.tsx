import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { useAppData } from '../context/AppDataContext';
import { currencies, DEFAULT_CURRENCY_CODE } from '../lib/currencies';
import type { Invoice, Customer } from '../types';

const today = new Date();

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

type AmountSizeStep = { maxLength: number; className: string };

// درجات تصغير الخط للبطاقات الإحصائية الرئيسية (تبدأ من text-2xl)
const DEFAULT_AMOUNT_SIZE_STEPS: AmountSizeStep[] = [
  { maxLength: 10, className: 'text-2xl' },
  { maxLength: 13, className: 'text-xl' },
  { maxLength: 17, className: 'text-lg' },
  { maxLength: 22, className: 'text-base' },
];

// درجات أصغر لبطاقات ملخص Aging (تبدأ من text-lg أصلاً، فهي أضيق وأقل أهمية بصريًا)
const COMPACT_AMOUNT_SIZE_STEPS: AmountSizeStep[] = [
  { maxLength: 10, className: 'text-lg' },
  { maxLength: 14, className: 'text-base' },
  { maxLength: 19, className: 'text-sm' },
];

const getAmountTextSizeClass = (value: string, steps: AmountSizeStep[], fallbackClassName: string): string => {
  const match = steps.find((step) => value.length <= step.maxLength);
  return match ? match.className : fallbackClassName;
};

/**
 * عرض مبلغ داخل بطاقة بحجم خط يتصاغر تلقائيًا مع طول الرقم المُنسَّق (عملات/مبالغ كبيرة
 * تُعرض بخط أصغر تلقائيًا بدل الخروج عن حدود البطاقة). truncate هنا سقف أمان مطلق: حتى لو
 * تجاوز الرقم أصغر درجة متاحة، يُقصّ بأمان بدل التمدد فوق البطاقة المجاورة، مع بقاء الرقم
 * الكامل متاحًا دائمًا كـ tooltip عند الوقوف عليه بالماوس.
 */
const StatAmount = ({
  value,
  className = 'mt-3',
  colorClassName = 'text-white',
  steps = DEFAULT_AMOUNT_SIZE_STEPS,
  fallbackClassName = 'text-xs',
}: {
  value: string;
  className?: string;
  colorClassName?: string;
  steps?: AmountSizeStep[];
  fallbackClassName?: string;
}) => (
  <p
    title={value}
    className={`truncate font-bold ${className} ${colorClassName} ${getAmountTextSizeClass(value, steps, fallbackClassName)}`}
  >
    {value}
  </p>
);

const DashboardPage = () => {
  const {
    metrics,
    orders: invoices,
    inventory: customers,
    shipping: alerts,
    customerInsights,
    reportData,
    forecastData,
    formatCurrency,
    addOrder,
    updateOrder,
    updateOrderStatus,
  } = useAppData();

  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | Invoice['status']>('All');
  const [riskFilter, setRiskFilter] = useState<'All' | Customer['reliability']>('All');
  const [sortKey, setSortKey] = useState<'dueDate' | 'amount' | 'status' | 'customerName'>('dueDate');
  const [sortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({
    customerId: customers[0]?.id ?? '',
    amount: '3200',
    currency: DEFAULT_CURRENCY_CODE as string,
    issueDate: formatDateInput(today),
    dueDate: formatDateInput(new Date(today.getTime() + 1000 * 60 * 60 * 24 * 21)),
    status: 'Sent' as Invoice['status'],
    notes: 'New invoice created from dashboard.',
    priority: 'Medium' as const,
  });
  const [newInvoiceMessage, setNewInvoiceMessage] = useState('');

  const overdueCustomers = useMemo(
    () => customerInsights.filter((customer) => customer.riskScore === 'High'),
    [customerInsights]
  );

  const actionableAlerts = useMemo(
    () => alerts.filter((alert) => alert.actionRequired),
    [alerts]
  );

  const expectedCashInflow = useMemo(() => forecastData?.expected30 ?? 0, [forecastData]);

  const paymentRiskScore = useMemo(() => {
    const riskScores = customerInsights.map((customer) => {
      if (customer.riskScore === 'Low') return 20;
      if (customer.riskScore === 'Medium') return 55;
      return 85;
    });
    const average = riskScores.reduce((sum, value) => sum + value, 0) / Math.max(riskScores.length, 1);
    return Math.min(100, Math.round(average));
  }, [customerInsights]);

  // مبني الآن على المبلغ الخام بالدولار (amountUSD) بدل تحليل النص المُنسَّق بعملة كل فاتورة
  // على حدة - جمع نصوص مُنسَّقة بعملات مختلفة كان يخلط وحدات غير متجانسة معًا (مثلاً 100
  // دولار + 5000 جنيه كأنهما نفس الرقم). formatCurrency هنا هي دالة الـ Context الحية، فتعكس
  // عملة التقارير الحالية فورًا بدل $ ثابتة.
  const forecast = useMemo(() => {
    return Array.from({ length: 30 }).map((_, index) => {
      const date = new Date(today.getTime() + index * 24 * 60 * 60 * 1000);
      const amount = invoices.reduce((sum, invoice) => {
        if (invoice.status === 'Paid') return sum;
        if (invoice.dueDate === date.toISOString().slice(0, 10)) {
          return sum + (invoice.amountUSD || 0);
        }
        return sum;
      }, 0);
      return { label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), amount };
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const normalizedSearch = invoiceSearch.toLowerCase().trim();
    return [...invoices]
      .filter((invoice) => {
        const invNumber = String(invoice.invoiceNumber || '').toLowerCase();
        const custName = String(invoice.customerName || '').toLowerCase();
        const notes = String(invoice.notes || '').toLowerCase();

        const searchMatch =
          invNumber.includes(normalizedSearch) ||
          custName.includes(normalizedSearch) ||
          notes.includes(normalizedSearch);

        const statusMatch = statusFilter === 'All' || invoice.status === statusFilter;
        const customer = customers.find((item) => item.id === invoice.customerId);
        const riskMatch =
          riskFilter === 'All' ||
          (customer && customer.reliability === riskFilter);

        return searchMatch && statusMatch && riskMatch;
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        if (sortKey === 'amount') {
          // مقارنة بالقيمة الخام بالدولار، لا بالنص المُنسَّق - فاتورتان بعملتين مختلفتين
          // بنفس الشكل الرقمي (مثلاً "100.00" جنيهًا و"100.00" دولارًا) لم تكونا لتُرتَّبا
          // بشكل صحيح لولا هذا.
          return ((a.amountUSD ?? 0) - (b.amountUSD ?? 0)) * direction;
        }
        if (sortKey === 'dueDate') {
          return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * direction;
        }
        if (sortKey === 'status') {
          return String(a.status).localeCompare(String(b.status)) * direction;
        }
        return String(a.customerName).localeCompare(String(b.customerName)) * direction;
      });
  }, [invoiceSearch, invoices, customers, riskFilter, sortDirection, sortKey, statusFilter]);

  const selectedInvoice = selectedInvoiceId ? invoices.find((invoice) => invoice.id === selectedInvoiceId) : null;
  const selectedCustomer = selectedCustomerId ? customers.find((customer) => customer.id === selectedCustomerId) : null;

  const updateStatus = (invoiceId: string, status: Invoice['status']) => {
    updateOrderStatus(invoiceId, status);
  };

  const markPaid = (invoice: Invoice) => {
    updateOrder({ ...invoice, status: 'Paid', paymentDate: formatDateInput(today) });
  };

  const exportInvoicesToExcel = () => {
    const dataToExport = filteredInvoices.map((inv) => ({
      'Invoice #': inv.invoiceNumber,
      'Customer': inv.customerName,
      'Amount': inv.amount,
      'Issue Date': inv.issueDate,
      'Due Date': inv.dueDate,
      'Status': inv.status,
      'Payment Date': inv.paymentDate || 'N/A',
      'Notes': inv.notes || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoices');
    XLSX.writeFile(workbook, `Invoices_Export_${formatDateInput(today)}.xlsx`);
  };

  // ننتظر الآن نتيجة addOrder الفعلية (بعد جلب سعر الصرف الحي) قبل إظهار رسالة نجاح أو إخفاء
  // النموذج - نفس مبدأ الأمان المُطبَّق في شاشة الفواتير: لا رسالة نجاح متفائلة لو فشل الحفظ.
  const handleAddInvoice = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newInvoiceData.customerId) {
      setNewInvoiceMessage('Please choose a customer.');
      return;
    }
    const customer = customers.find((item) => item.id === newInvoiceData.customerId);
    if (!customer) {
      setNewInvoiceMessage('Invalid customer selected.');
      return;
    }

    const succeeded = await addOrder({
      invoiceNumber: `${1000 + invoices.length + 1}`,
      customerId: customer.id,
      customerName: customer.name,
      amount: newInvoiceData.amount,
      currency: newInvoiceData.currency,
      issueDate: newInvoiceData.issueDate,
      dueDate: newInvoiceData.dueDate,
      status: newInvoiceData.status,
      notes: newInvoiceData.notes,
      priority: newInvoiceData.priority,
      priorityReason: 'Created from dashboard collection workflow.',
      contacted: false,
      followUpOn: newInvoiceData.dueDate,
    });

    if (succeeded) {
      setNewInvoiceMessage('Invoice added successfully.');
      setShowNewInvoice(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Overview Section */}
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Cash collection</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Cash Collection Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">
              See overdue invoices, customer risk, and 30-day collection expectations in one actionable view.
            </p>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950/80 p-6 xl:col-span-1">
            <p className="text-xs uppercase tracking-wider text-slate-400">Total Outstanding</p>
            <StatAmount value={formatCurrency(reportData?.outstandingReceivables ?? 0)} />
            <p className="mt-2 text-xs text-slate-500">Unpaid invoices on books</p>
          </div>
          <div className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-xs uppercase tracking-wider text-rose-400">Overdue Amount</p>
            <StatAmount value={formatCurrency(metrics?.overdue ?? 0)} colorClassName="text-rose-400" />
            <p className="mt-2 text-xs text-amber-300/80">Needs earliest outreach</p>
          </div>
          <div className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-xs uppercase tracking-wider text-amber-400">Due in 7 Days</p>
            <StatAmount value={formatCurrency(metrics?.dueSoon ?? 0)} />
            <p className="mt-2 text-xs text-slate-500">Coming due within a week</p>
          </div>
          <div className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-xs uppercase tracking-wider text-brand-300">Expected Inflow (30d)</p>
            <StatAmount value={formatCurrency(expectedCashInflow)} />
            <p className="mt-2 text-xs text-slate-500">Projected receivables</p>
          </div>
          <div className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950/80 p-6">
            <p className="text-xs uppercase tracking-wider text-emerald-400">Collection Rate</p>
            <p className="mt-3 text-2xl font-bold text-white">{metrics?.collectionRate ?? 0}%</p>
            <p className="mt-2 text-xs text-slate-500">Collected on schedule</p>
          </div>
        </div>

        {/* Alerts & Forecast Grid */}
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-brand-300">Actionable Alerts</p>
                <h2 className="text-lg font-semibold text-white mt-1">Requiring Attention</h2>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{actionableAlerts.length} alerts</span>
            </div>
            <div className="space-y-3">
              {actionableAlerts.map((alert) => (
                <button
                  key={alert.id}
                  type="button"
                  onClick={() => {
                    if (alert.invoiceId) setSelectedInvoiceId(alert.invoiceId);
                    if (alert.customerId) setSelectedCustomerId(alert.customerId);
                  }}
                  className="w-full rounded-2xl border border-slate-800/80 bg-slate-950 p-4 text-left transition hover:border-brand-500/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{alert.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{alert.message}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-brand-300">{alert.date}</span>
                  </div>
                </button>
              ))}
              {actionableAlerts.length === 0 && (
                <p className="text-sm text-slate-400">You are caught up on active alerts.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-brand-300">Forecast & Risk</p>
              <h2 className="text-lg font-semibold text-white mt-1">30-day Outlook</h2>
              <div className="mt-4 space-y-2">
                {forecast.slice(0, 5).map((point) => (
                  <div key={point.label} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-slate-400">{point.label}</span>
                    <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-2 bg-brand-500 rounded-full"
                        style={{ width: `${Math.min(100, (point.amount / Math.max(1, forecast.reduce((s, item) => Math.max(s, item.amount), 0))) * 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-300 font-mono">{formatCurrency(point.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-slate-900 p-4 flex items-center justify-between border border-slate-800">
              <div>
                <p className="text-xs uppercase text-slate-400">Overall Risk Score</p>
                <p className="text-xs text-slate-500">Based on late payments</p>
              </div>
              <p className="text-3xl font-bold text-amber-400">{paymentRiskScore}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Table Section */}
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Invoices</p>
            <h2 className="text-2xl font-semibold text-white">Invoice Search & Controls</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={exportInvoicesToExcel}
              className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Excel
            </button>
            <button
              type="button"
              onClick={() => setShowNewInvoice((curr) => !curr)}
              className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400"
            >
              {showNewInvoice ? 'Hide Form' : 'Add New Invoice'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <input
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
            placeholder="Search invoice #, customer, notes..."
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
          >
            <option value="All">All Statuses</option>
            <option value="Overdue">Overdue</option>
            <option value="Due Soon">Due Soon</option>
            <option value="Sent">Sent</option>
            <option value="Paid">Paid</option>
          </select>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value as typeof riskFilter)}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
          >
            <option value="All">All Reliability Ratings</option>
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
            <option value="Needs improvement">Needs improvement</option>
          </select>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
            className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="amount">Sort by Amount</option>
            <option value="status">Sort by Status</option>
            <option value="customerName">Sort by Customer</option>
          </select>
        </div>

        {/* New Invoice Form */}
        {showNewInvoice && (
          <form onSubmit={handleAddInvoice} className="mb-8 rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-white">Create Invoice</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <select
                value={newInvoiceData.customerId}
                onChange={(e) => setNewInvoiceData({ ...newInvoiceData, customerId: e.target.value })}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                type="number"
                value={newInvoiceData.amount}
                onChange={(e) => setNewInvoiceData({ ...newInvoiceData, amount: e.target.value })}
                placeholder="Amount"
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none"
                required
              />
              <select
                value={newInvoiceData.currency}
                onChange={(e) => setNewInvoiceData({ ...newInvoiceData, currency: e.target.value })}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <select
                value={newInvoiceData.priority}
                onChange={(e) => setNewInvoiceData({ ...newInvoiceData, priority: e.target.value as typeof newInvoiceData.priority })}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none"
              >
                <option value="High">High Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="Low">Low Priority</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="date"
                value={newInvoiceData.issueDate}
                onChange={(e) => setNewInvoiceData({ ...newInvoiceData, issueDate: e.target.value })}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none"
                required
              />
              <input
                type="date"
                value={newInvoiceData.dueDate}
                onChange={(e) => setNewInvoiceData({ ...newInvoiceData, dueDate: e.target.value })}
                className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none"
                required
              />
            </div>
            <textarea
              value={newInvoiceData.notes}
              onChange={(e) => setNewInvoiceData({ ...newInvoiceData, notes: e.target.value })}
              placeholder="Invoice Notes"
              rows={2}
              className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none"
            />
            <div className="flex items-center gap-4">
              <button type="submit" className="rounded-2xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white">Save Invoice</button>
              {newInvoiceMessage && <p className="text-xs text-emerald-400">{newInvoiceMessage}</p>}
            </div>
          </form>
        )}

        {/* Invoices Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Invoice #</th>
                <th className="px-5 py-4">Customer</th>
                <th className="px-5 py-4">Amount</th>
                <th className="px-5 py-4">Due Date</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-slate-950/40">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-900/60 transition">
                  <td className="px-5 py-4 font-semibold text-white">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedInvoiceId(inv.id);
                        setSelectedCustomerId(inv.customerId);
                      }}
                      className="hover:text-brand-300 transition"
                    >
                      {inv.invoiceNumber}
                    </button>
                  </td>
                  <td className="px-5 py-4">{inv.customerName}</td>
                  {/* كل فاتورة تُعرض بعملتها الخاصة كما هي (inv.amount جاهز ومُنسَّق من الـ
                      Context بالفعل) - وليس بعملة التقارير، تمامًا كما في شاشة الفواتير. تحويلها
                      عبر formatCurrency كان يخلط رقم فاتورة بعملة معيّنة مع رمز عملة أخرى تمامًا. */}
                  <td className="px-5 py-4 font-bold text-white">{inv.amount}</td>
                  <td className="px-5 py-4">{inv.dueDate}</td>
                  <td className="px-5 py-4">
                    <select
                      value={inv.status}
                      onChange={(e) => updateStatus(inv.id, e.target.value as Invoice['status'])}
                      className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-1 text-xs text-white outline-none"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Sent">Sent</option>
                      <option value="Due Soon">Due Soon</option>
                      <option value="Overdue">Overdue</option>
                      <option value="Partially Paid">Partially Paid</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => markPaid(inv)}
                        className="rounded-xl bg-brand-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-brand-400"
                      >
                        Mark Paid
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No invoices match criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Selected Details Drawer */}
        {(selectedInvoice || selectedCustomer) && (
          <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-950 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Selected Inspector</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedInvoiceId(null);
                  setSelectedCustomerId(null);
                }}
                className="text-xs text-slate-400 hover:text-white"
              >
                Close Panel
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {selectedInvoice && (
                <div className="min-w-0 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
                  <p className="text-xs text-slate-400 uppercase">Invoice #{selectedInvoice.invoiceNumber}</p>
                  <StatAmount
                    value={selectedInvoice.amount as string}
                    className="mt-1"
                    steps={[
                      { maxLength: 14, className: 'text-xl' },
                      { maxLength: 18, className: 'text-lg' },
                      { maxLength: 24, className: 'text-base' },
                    ]}
                  />
                  <p className="text-xs text-slate-400 mt-2">Due Date: {selectedInvoice.dueDate}</p>
                  <p className="text-xs text-slate-300 mt-2">Notes: {selectedInvoice.notes}</p>
                </div>
              )}
              {selectedCustomer && (
                <div className="min-w-0 rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
                  <p className="text-xs text-slate-400 uppercase">Customer Profile</p>
                  <p className="text-lg font-semibold text-white mt-1">{selectedCustomer.name}</p>
                  <p className="text-xs text-amber-300 mt-1">Reliability: {selectedCustomer.reliability}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Aging Buckets Summary - تعتمد الآن على reportData.aging الجاهزة من الـ Context بدل
            حساب محلي مكرَّر كان يخلط بين البنود (فاتورة غير مستحقة بعد كانت تُحسب ضمن "0-30"،
            وكل بند بعدها كان منزاحًا بمقدار خانة واحدة) وبعملة الدولار الثابتة فقط. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {(reportData?.aging ?? []).map((bucket: { label: string; total: string; count: number }) => (
            <div key={bucket.label} className="min-w-0 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-400">{bucket.label}</p>
              <StatAmount value={bucket.total} className="mt-1" steps={COMPACT_AMOUNT_SIZE_STEPS} fallbackClassName="text-xs" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;