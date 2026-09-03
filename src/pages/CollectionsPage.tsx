import { useMemo, useState, useRef, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import type { Invoice } from '../types';
import { EmptyState } from '../components/EmptyState';

const parseCurrency = (value: unknown): number => {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'string') return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
  return 0;
};

const formatCurrency = (value: number): string =>
  `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const getToday = () => new Date().toISOString().slice(0, 10);

const diffDays = (dateString: string, reference = getToday()) => {
  if (!dateString) return 0;
  const target = new Date(`${dateString}T00:00:00`);
  const current = new Date(`${reference}T00:00:00`);
  return Math.floor((target.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
};

const orderStatuses = ['All', 'Draft', 'Sent', 'Due Soon', 'Overdue', 'Partially Paid', 'Paid'] as const;
const riskOptions = ['All', 'High', 'Medium', 'Low'] as const;
const urgencyOptions = ['All', 'Overdue', 'Due Soon', 'Future'] as const;

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
      if (containerRef.current && !containerRef.current.contains(event?.target as Node)) {
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
        className="mt-3 flex w-full items-center justify-between rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white transition hover:border-slate-700 outline-none"
      >
        <span className={value ? 'text-white' : 'text-slate-500'}>
          {value || placeholder}
        </span>
        <svg
          className="h-5 w-5 text-white"
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

const CollectionsPage = () => {
  const { orders, inventory: customers, updateOrder, customerInsights } = useAppData();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [customerFilter, setCustomerFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<typeof orderStatuses[number]>('All');
  const [riskFilter, setRiskFilter] = useState<typeof riskOptions[number]>('All');
  const [urgencyFilter, setUrgencyFilter] = useState<typeof urgencyOptions[number]>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [noteText, setNoteText] = useState('');
  const [message, setMessage] = useState('');

  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const insightMap = useMemo(() => new Map(customerInsights.map((insight) => [insight.id, insight])), [customerInsights]);

  const selectedInvoice = useMemo(
    () => orders.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [orders, selectedInvoiceId]
  );

  const outstandingTotal = useMemo(
    () => orders.filter((invoice) => invoice.status !== 'Paid').reduce((total, invoice) => total + parseCurrency(invoice.amount), 0),
    [orders]
  );

  const overdueTotal = useMemo(
    () => orders.filter((invoice) => invoice.status === 'Overdue').reduce((total, invoice) => total + parseCurrency(invoice.amount), 0),
    [orders]
  );

  const dueSoonTotal = useMemo(
    () => orders.filter((invoice) => invoice.status === 'Due Soon').reduce((total, invoice) => total + parseCurrency(invoice.amount), 0),
    [orders]
  );

  const highRiskCustomers = useMemo(
    () => customerInsights.filter((customer) => customer.riskScore === 'High').slice(0, 5),
    [customerInsights]
  );

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return orders
      .filter((invoice) => {
        const customer = customerMap.get(invoice.customerId);
        const insight = insightMap.get(invoice.customerId);

        if (statusFilter !== 'All' && invoice.status !== statusFilter) return false;
        if (customerFilter !== 'All' && invoice.customerId !== customerFilter) return false;
        if (riskFilter !== 'All' && insight?.riskScore !== riskFilter) return false;

        if (urgencyFilter === 'Overdue' && invoice.status !== 'Overdue') return false;
        if (urgencyFilter === 'Due Soon' && invoice.status !== 'Due Soon') return false;
        if (urgencyFilter === 'Future' && (invoice.status === 'Paid' || invoice.status === 'Overdue' || invoice.status === 'Due Soon')) return false;

        if (!query) return true;

        return (
          String(invoice.invoiceNumber || '').toLowerCase().includes(query) ||
          String(invoice.customerName || '').toLowerCase().includes(query) ||
          String(invoice.notes || '').toLowerCase().includes(query) ||
          (customer?.company?.toLowerCase().includes(query) ?? false)
        );
      })
      .sort((a, b) => {
        const score = (invoice: Invoice) => {
          const overdue = invoice.status === 'Overdue' ? 100 : 0;
          const dueSoon = invoice.status === 'Due Soon' ? 20 : 0;
          const risk = insightMap.get(invoice.customerId)?.riskScore === 'High' ? 30 : 0;
          return overdue + dueSoon + risk + parseCurrency(invoice.amount) / 100;
        };
        return score(b) - score(a);
      });
  }, [orders, customerFilter, statusFilter, riskFilter, urgencyFilter, searchQuery, customerMap, insightMap]);

  const priorityQueue = useMemo(() => {
    return orders
      .filter((invoice) => ['Overdue', 'Due Soon', 'Partially Paid'].includes(invoice.status))
      .map((invoice) => {
        const insight = insightMap.get(invoice.customerId);
        const overdueScore = invoice.status === 'Overdue' ? 40 : invoice.status === 'Due Soon' ? 20 : 10;
        const riskScore = insight?.riskScore === 'High' ? 30 : insight?.riskScore === 'Medium' ? 15 : 0;
        const delayScore = (insight?.averagePaymentDelay ?? 0) / 5;
        const amountScore = parseCurrency(invoice.amount) / 300;
        return { invoice, score: overdueScore + riskScore + delayScore + amountScore };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.invoice);
  }, [orders, insightMap]);

  const handleSelectInvoice = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id);
    setMessage('');
  };

  const handleMarkPaid = (invoice: Invoice) => {
    updateOrder({ ...invoice, status: 'Paid', paymentDate: getToday() });
    setMessage(`Marked invoice ${invoice.invoiceNumber} as paid.`);
  };

  const handleSetFollowUpDate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedInvoice) {
      setMessage('Please select an invoice first.');
      return;
    }
    if (!followUpDate) {
      setMessage('Please choose a follow-up date.');
      return;
    }
    updateOrder({ ...selectedInvoice, contacted: true, followUpOn: followUpDate });
    setMessage(`Follow-up scheduled for ${selectedInvoice.invoiceNumber} on ${followUpDate}.`);
    setFollowUpDate('');
  };

  const handleAddNote = () => {
    if (!selectedInvoice) {
      setMessage('Please select an invoice first.');
      return;
    }
    if (!noteText.trim()) {
      setMessage('Enter a collection note first.');
      return;
    }
    const updatedNotes = selectedInvoice.notes
      ? `${selectedInvoice.notes}\n• ${noteText.trim()}`
      : noteText.trim();
    updateOrder({ ...selectedInvoice, notes: updatedNotes, contacted: true });
    setMessage(`Collection note added to ${selectedInvoice.invoiceNumber}.`);
    setNoteText('');
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="flex items-center justify-between rounded-2xl border border-brand-500/30 bg-brand-500/10 px-5 py-4 text-sm text-brand-200 backdrop-blur-md">
          <span>{message}</span>
          <button
            onClick={() => setMessage('')}
            className="rounded-lg bg-brand-500/20 px-3 py-1 text-xs font-semibold hover:bg-brand-500/30 transition"
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(560px,1fr)] lg:items-center">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Collections</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Collection workspace for overdue and high-risk invoices</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">Prioritize cash collection with shared invoice and customer intelligence, then act directly from the workspace.</p>
          </div>
          <div className="grid grid-cols-3 gap-3 min-w-0">
            <div className="rounded-3xl bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Total outstanding</p>
              <p className="mt-4 text-[clamp(1rem,2.2vw,1.5rem)] font-semibold text-white leading-tight">{formatCurrency(outstandingTotal)}</p>
            </div>
            <div className="min-w-0 rounded-3xl bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Overdue amount</p>
              <p className="mt-4 text-xl font-semibold text-white break-words">{formatCurrency(overdueTotal)}</p>
            </div>
            <div className="rounded-3xl bg-slate-950/80 p-5">
              <p className="text-sm text-slate-400">Due soon</p>
              <p className="mt-4 text-xl font-semibold text-white break-words">{formatCurrency(dueSoonTotal)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
              <div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-sm uppercase tracking-[0.3em] text-brand-300">Filters</div>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search invoices or customers"
                    className="min-w-[220px] rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-brand-500 transition"
                  />
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-4">
                  <label className="block text-sm text-slate-300">
                    Customer
                    <select
                      value={customerFilter}
                      onChange={(event) => setCustomerFilter(event.target.value)}
                      className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="All">All customers</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>{customer.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Status
                    <select
                      value={statusFilter}
                      onChange={(event) => setStatusFilter(event.target.value as typeof orderStatuses[number])}
                      className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Risk
                    <select
                      value={riskFilter}
                      onChange={(event) => setRiskFilter(event.target.value as typeof riskOptions[number])}
                      className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      {riskOptions.map((risk) => (
                        <option key={risk} value={risk}>{risk}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm text-slate-300">
                    Urgency
                    <select
                      value={urgencyFilter}
                      onChange={(event) => setUrgencyFilter(event.target.value as typeof urgencyOptions[number])}
                      className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                    >
                      {urgencyOptions.map((urgency) => (
                        <option key={urgency} value={urgency}>{urgency}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 text-sm text-slate-400 flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-white">Collection priority queue</p>
                  <p className="mt-1 text-xs text-slate-400">Top urgent items requiring immediate action:</p>

                  <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
                    {priorityQueue.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No urgent collection items.</p>
                    ) : (
                      priorityQueue.slice(0, 5).map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleSelectInvoice(item)}
                          className={`w-full flex items-center justify-between rounded-2xl p-2.5 text-left text-xs transition ${
                            selectedInvoiceId === item.id
                              ? 'bg-brand-500/20 border border-brand-500/40 text-white'
                              : 'bg-slate-950/80 hover:bg-slate-800/80 text-slate-300'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <p className="font-medium truncate text-white">{item.invoiceNumber} - {item.customerName}</p>
                            <p className="text-[11px] text-slate-400">{item.status} • {formatCurrency(parseCurrency(item.amount))}</p>
                          </div>
                          <span className="text-[10px] uppercase font-semibold tracking-wider text-brand-300 shrink-0">Select</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span>Overdue: <strong className="text-white">{orders.filter((i) => i.status === 'Overdue').length}</strong></span>
                  <span>High Risk: <strong className="text-white">{highRiskCustomers.length}</strong></span>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/80">
            <div className="px-6 py-5 bg-slate-900 text-sm text-slate-400 flex justify-between items-center">
              <span>Filtered invoices</span>
              <span className="text-xs text-slate-500">{filteredInvoices.length} invoices found</span>
            </div>
            <div className="divide-y divide-slate-800 bg-slate-950/95 max-h-[480px] overflow-y-auto">
              {filteredInvoices.length === 0 ? (
                <EmptyState
                  title="No invoices found"
                  description="There are no invoices matching your current filter criteria."
                />
              ) : (
                filteredInvoices.map((invoice) => {
                  const customer = customerMap.get(invoice.customerId);
                  const days = diffDays(invoice.dueDate);
                  return (
                    <div
                      key={invoice.id}
                      onClick={() => handleSelectInvoice(invoice)}
                      className={`grid gap-4 px-6 py-5 sm:grid-cols-[1.4fr_0.7fr_0.7fr_0.9fr_0.8fr] cursor-pointer transition ${
                        selectedInvoiceId === invoice.id ? 'bg-slate-900/90 border-l-4 border-brand-500' : 'hover:bg-slate-900/90'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{invoice.invoiceNumber}</p>
                        <p className="mt-1 text-sm text-slate-400">{customer?.name ?? invoice.customerName}</p>
                      </div>
                      <div className="text-sm text-slate-300 font-semibold">{formatCurrency(parseCurrency(invoice.amount))}</div>
                      <div className="text-sm text-slate-300">{invoice.dueDate}</div>
                      <div className="text-sm text-slate-300">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${
                          invoice.status === 'Overdue' ? 'bg-rose-500/10 text-rose-300' :
                          invoice.status === 'Due Soon' ? 'bg-amber-500/10 text-amber-300' :
                          invoice.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-300' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {invoice.status}
                        </span>
                      </div>
                      <div className="text-right text-sm text-slate-400">
                        {invoice.status === 'Paid' ? (
                          <span className="text-slate-500">Completed</span>
                        ) : days < 0 ? (
                          <span className="text-rose-400 font-medium">{Math.abs(days)}d late</span>
                        ) : (
                          `${days}d remaining`
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.82fr_0.82fr]">
            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-lg font-semibold text-white">Invoice details</h2>
              {selectedInvoice ? (
                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl bg-slate-900/80 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Invoice</p>
                        <h3 className="mt-2 text-xl font-semibold text-white">{selectedInvoice.invoiceNumber}</h3>
                        <p className="mt-1 text-sm text-slate-400">{selectedInvoice.customerName}</p>
                      </div>
                      <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">{selectedInvoice.status}</span>
                    </div>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-3xl bg-slate-950/80 p-4">
                        <p className="text-sm text-slate-400">Amount</p>
                        <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(parseCurrency(selectedInvoice.amount))}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-950/80 p-4">
                        <p className="text-sm text-slate-400">Issue date</p>
                        <p className="mt-2 text-lg font-semibold text-white">{selectedInvoice.issueDate || '—'}</p>
                      </div>
                      <div className="rounded-3xl bg-slate-950/80 p-4">
                        <p className="text-sm text-slate-400">Due date</p>
                        <p className="mt-2 text-lg font-semibold text-white">{selectedInvoice.dueDate || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl bg-slate-900/80 p-5">
                    <p className="text-sm text-slate-400">Collection note</p>
                    <textarea
                      value={noteText}
                      onChange={(event) => setNoteText(event.target.value)}
                      className="mt-3 w-full min-h-[110px] rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-brand-500 transition"
                      placeholder="Add a note for the collection team"
                    />
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleAddNote}
                        className="rounded-3xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
                      >
                        Add note
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(selectedInvoice)}
                        className="rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-emerald-500 hover:text-white"
                      >
                        Mark as paid
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSetFollowUpDate} className="rounded-3xl bg-slate-900/80 p-5">
                    <p className="text-sm text-slate-400">Next follow-up</p>
                    <CustomDatePicker
                      value={followUpDate}
                      onChange={(val) => setFollowUpDate(val)}
                      placeholder="Pick follow-up date"
                    />
                    <button
                      type="submit"
                      className="mt-4 rounded-3xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
                    >
                      Save follow-up date
                    </button>
                  </form>

                  <div className="rounded-3xl bg-slate-950/80 p-5 text-sm text-slate-400">
                    <p className="font-semibold text-white">Recent notes</p>
                    <p className="mt-2 whitespace-pre-line">{selectedInvoice.notes || 'No collection notes yet.'}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">Select an invoice from the list to review details and take action.</p>
              )}
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
              <h2 className="text-lg font-semibold text-white">Customer details</h2>
              {selectedInvoice ? (
                (() => {
                  const insight = insightMap.get(selectedInvoice.customerId);
                  return insight ? (
                    <div className="mt-6 space-y-4">
                      <div className="rounded-3xl bg-slate-900/80 p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-400">{insight.company}</p>
                            <h3 className="mt-2 text-xl font-semibold text-white">{insight.name}</h3>
                          </div>
                          <span className="rounded-full bg-amber-500/10 px-3 py-2 text-sm text-amber-200">{insight.riskScore} Risk</span>
                        </div>
                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                          <div className="rounded-3xl bg-slate-950/80 p-4">
                            <p className="text-sm text-slate-400">Outstanding balance</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{insight.outstandingBalance}</p>
                          </div>
                          <div className="rounded-3xl bg-slate-950/80 p-4">
                            <p className="text-sm text-slate-400">Overdue balance</p>
                            <p className="mt-2 text-2xl font-semibold text-white">{insight.overdueBalance}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-3xl bg-slate-900/80 p-5 text-sm text-slate-400">
                        <p className="font-semibold text-white">Payment behavior</p>
                        <p className="mt-2">Average delay: {insight.averagePaymentDelay} days</p>
                        <p className="mt-2">Repeat late payer: {insight.repeatLatePayer ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-6 text-sm text-slate-400">No customer insight available for this invoice.</p>
                  );
                })()
              ) : (
                <p className="mt-6 text-sm text-slate-400">Select an invoice from the list to see account details.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CollectionsPage;