import { useMemo, useState, useRef, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import { currencies, currencyByCode, parseCurrencyAmount as parseAmount, DEFAULT_CURRENCY_CODE } from '../lib/currencies';
import type { Invoice, InvoiceStatus, Customer } from '../types';

const invoiceStatuses: InvoiceStatus[] = ['Draft', 'Sent', 'Due Soon', 'Overdue', 'Partially Paid', 'Paid'];
const searchStatuses = ['All', 'Draft', 'Sent', 'Due Soon', 'Overdue', 'Partially Paid', 'Paid'] as const;
const riskOptions = ['All', 'High', 'Medium', 'Low'] as const;
const sortOptions = ['dueDate', 'amount', 'status', 'customerName'] as const;

interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  matchedInvoice?: Invoice;
  matchType?: 'Exact Invoice #' | 'Customer & Amount' | 'Amount Match' | 'Match with Bank Fee';
  matchConfidence?: number;
  feeAmount?: number;
}

interface InvoiceFormState {
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentDate: string;
  notes: string;
}

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);

const getStatusBadgeClass = (status: InvoiceStatus) => {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20';
    case 'Overdue':
      return 'bg-rose-500/10 text-rose-300 border border-rose-500/20';
    case 'Due Soon':
      return 'bg-amber-500/10 text-amber-300 border border-amber-500/20';
    case 'Partially Paid':
      return 'bg-sky-500/10 text-sky-300 border border-sky-500/20';
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
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
        className="mt-2 flex w-full items-center justify-between rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white transition hover:border-slate-700 outline-none"
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

const OrdersPage = () => {
  const { 
    orders: invoices, 
    inventory: customers, 
    customerInsights, 
    addOrder, 
    updateOrder, 
    deleteOrder,
    addInventoryItem
  } = useAppData();

  const [editing, setEditing] = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof searchStatuses[number]>('All');
  const [riskFilter, setRiskFilter] = useState<typeof riskOptions[number]>('All');
  const [sortKey, setSortKey] = useState<typeof sortOptions[number]>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(formatDateInput(new Date()));

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [parsedBankFeed, setParsedBankFeed] = useState<BankTransaction[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  // نافذة إضافة عميل سريع
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustCompany, setNewCustCompany] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  // نموذج الفاتورة يبدأ خالياً تماماً، بعملة افتراضية USD
  const [form, setForm] = useState<InvoiceFormState>({
    invoiceNumber: '',
    customerId: '',
    customerName: '',
    amount: '',
    currency: DEFAULT_CURRENCY_CODE,
    issueDate: '',
    dueDate: '',
    status: 'Sent' as InvoiceStatus,
    paymentDate: '',
    notes: ''
  });

  const [message, setMessage] = useState('');

  const dueCount = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'Overdue' || invoice.status === 'Due Soon').length,
    [invoices]
  );

  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const insightMap = useMemo(() => new Map(customerInsights.map((i) => [i.id, i])), [customerInsights]);

  const selectedInvoice = useMemo(
    () => (selectedInvoiceId ? invoices.find((inv) => inv.id === selectedInvoiceId) ?? null : null),
    [invoices, selectedInvoiceId]
  );

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return invoices
      .filter((invoice) => {
        const customer = customerMap.get(invoice.customerId);
        const insight = insightMap.get(invoice.customerId);
        const invNum = String(invoice.invoiceNumber || '').toLowerCase();
        const custName = String(invoice.customerName || '').toLowerCase();
        const notes = String(invoice.notes || '').toLowerCase();
        const company = String(customer?.company || '').toLowerCase();

        const matchesSearch =
          invNum.includes(query) ||
          custName.includes(query) ||
          notes.includes(query) ||
          company.includes(query);

        const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;
        const matchesRisk = riskFilter === 'All' || insight?.riskScore === riskFilter;

        return matchesSearch && matchesStatus && matchesRisk;
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        if (sortKey === 'amount') return ((a.amountUSD ?? parseAmount(a.amount)) - (b.amountUSD ?? parseAmount(b.amount))) * direction;
        if (sortKey === 'dueDate') return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * direction;
        if (sortKey === 'status') return String(a.status).localeCompare(String(b.status)) * direction;
        return String(a.customerName).localeCompare(String(b.customerName)) * direction;
      });
  }, [invoices, customerMap, insightMap, riskFilter, searchQuery, sortDirection, sortKey, statusFilter]);

  const resetForm = () => {
    setForm({
      invoiceNumber: '',
      customerId: '',
      customerName: '',
      amount: '',
      currency: DEFAULT_CURRENCY_CODE,
      issueDate: '',
      dueDate: '',
      status: 'Sent',
      paymentDate: '',
      notes: ''
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rawVal = parseAmount(form.amount);

    if (!form.invoiceNumber.trim() || !form.issueDate || !form.dueDate || rawVal <= 0) {
      setMessage('Please fill required invoice fields, enter amount, and select dates.');
      return;
    }

    if (!form.customerId && !form.customerName.trim()) {
      setMessage('Please select a customer for this invoice.');
      return;
    }

    if (new Date(form.dueDate) < new Date(form.issueDate)) {
      setMessage('Due date must be the same or after the issue date.');
      return;
    }

    const duplicateInvoice = invoices.find(
      (invoice) =>
        String(invoice.invoiceNumber).trim().toLowerCase() === form.invoiceNumber.trim().toLowerCase() &&
        invoice.id !== editing?.id
    );
    if (duplicateInvoice) {
      setMessage('Invoice number already exists.');
      return;
    }

    const customerId = form.customerId || editing?.customerId || '';
    const paymentDateVal = form.status === 'Paid' ? form.paymentDate || formatDateInput(new Date()) : undefined;

    const payload: Omit<Invoice, 'id'> = {
      invoiceNumber: form.invoiceNumber.trim(),
      customerId,
      customerName: form.customerName.trim(),
      amount: String(rawVal),
      currency: form.currency,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: form.status,
      paymentDate: paymentDateVal,
      notes: form.notes,
      priority: editing?.priority,
      priorityReason: editing?.priorityReason,
      contacted: editing?.contacted,
      followUpOn: editing?.followUpOn
    };

    // ننتظر نتيجة الحفظ الفعلية قبل تفريغ النموذج أو إظهار رسالة نجاح - لو تعذّر جلب سعر
    // الصرف الحي أو حصل خطأ آخر، يبقى كلام المستخدم في النموذج بدل ما يضيع، والرسالة
    // المعروضة تعكس الحقيقة الفعلية بدل رسالة نجاح متفائلة تظهر مع تنبيه فشل في نفس اللحظة.
    const succeeded = editing
      ? await updateOrder({ ...editing, ...payload })
      : await addOrder(payload);

    if (succeeded) {
      setMessage(editing ? 'Invoice updated successfully.' : 'Invoice added successfully.');
      resetForm();
      setEditing(null);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setSelectedInvoiceId(invoice.id);
    setForm({
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: String(parseAmount(invoice.amount)),
      currency: invoice.currency || DEFAULT_CURRENCY_CODE,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: invoice.status,
      paymentDate: invoice.paymentDate ?? '',
      notes: invoice.notes || ''
    });
    setMessage('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this invoice?')) {
      deleteOrder(id);
      if (selectedInvoiceId === id) setSelectedInvoiceId(null);
      setMessage('Invoice deleted.');
    }
  };

  // معالجة إنشاء عميل جديد سريع
  const handleCreateQuickCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    await addInventoryItem({
      name: newCustName.trim(),
      company: newCustCompany.trim() || newCustName.trim(),
      email: newCustEmail.trim() || 'billing@client.com',
      phone: newCustPhone.trim() || '+201000000000',
      outstanding: 0,
      overdue: 0,
      averageDaysToPay: 0,
      reliability: 'Good',
      paymentHistory: [],
    } as any);

    setForm((prev) => ({
      ...prev,
      customerName: newCustName.trim()
    }));

    setIsNewCustomerModalOpen(false);
    setNewCustName('');
    setNewCustCompany('');
    setNewCustEmail('');
    setNewCustPhone('');
    setMessage(`Customer created and linked successfully.`);
  };

  const openPaymentModal = (invoice: Invoice) => {
    setPaymentModalInvoice(invoice);
    setPaymentAmount(String(parseAmount(invoice.amount)));
    setPaymentReference('');
    setPaymentMethod('Bank Transfer');
    setPaymentDate(formatDateInput(new Date()));
  };

  // تسجيل دفعة: يعرض المبلغ برمز عملة الفاتورة نفسها مباشرة، بدل تمريره عبر formatCurrency
  // (الذي يحوّل بعملة التقارير العامة) - كان هذا يسبب تحويلاً مزدوجًا وأرقامًا خاطئة تمامًا
  // تُحفظ بشكل دائم داخل ملاحظات التدقيق. كما ننتظر نتيجة الحفظ الفعلية قبل إغلاق النافذة.
  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const total = parseAmount(paymentModalInvoice.amount);
    const paid = parseAmount(paymentAmount);

    if (paid <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const invoiceCurrencyDef = currencyByCode(paymentModalInvoice.currency);
    const paidDisplay = `${invoiceCurrencyDef.symbol}${paid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const isFullSettlement = paid >= total;
    const newStatus: InvoiceStatus = isFullSettlement ? 'Paid' : 'Partially Paid';
    const auditNote = `[Payment Logged: ${paidDisplay} via ${paymentMethod}${
      paymentReference ? ` (Ref: ${paymentReference})` : ''
    } on ${paymentDate}]`;
    const updatedNotes = paymentModalInvoice.notes ? `${paymentModalInvoice.notes}\n${auditNote}` : auditNote;

    const updatedInv: Invoice = {
      ...paymentModalInvoice,
      status: newStatus,
      paymentDate: isFullSettlement ? paymentDate : paymentModalInvoice.paymentDate,
      notes: updatedNotes
    };

    const succeeded = await updateOrder(updatedInv);
    if (succeeded) {
      setMessage(`Payment of ${paidDisplay} recorded for ${paymentModalInvoice.invoiceNumber}.`);
      setPaymentModalInvoice(null);
      setReceiptInvoice(updatedInv);
      setTimeout(() => setMessage(''), 4000);
    }
  };

  const handleBankCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r\n|\n/).filter((line) => line.trim().length > 0);
      if (lines.length < 2) {
        alert('CSV file is empty or has no header.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''));
      const dateIdx = headers.findIndex((h) => h.includes('date'));
      const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('narr') || h.includes('ref') || h.includes('memo') || h.includes('payee'));
      const amountIdx = headers.findIndex((h) => h.includes('credit') || h.includes('amount') || h.includes('inflow') || h.includes('deposit'));

      const openInvoices = invoices.filter((inv) => inv.status !== 'Paid');
      const matchedMap = new Set<string>();
      const parsedTransactions: BankTransaction[] = [];
      const autoSelection: Record<string, boolean> = {};

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((cell) => cell.trim().replace(/"/g, ''));
        if (row.length < 2) continue;

        const date = dateIdx !== -1 ? row[dateIdx] : formatDateInput(new Date());
        const description = descIdx !== -1 ? row[descIdx] : row[1] || 'Bank Inflow';
        const rawAmount = amountIdx !== -1 ? row[amountIdx] : row[row.length - 1];
        const amount = Math.abs(parseAmount(rawAmount));

        if (amount <= 0) continue;

        const txId = `TX-${i}-${Date.now().toString(36)}`;
        let bestInvoice: Invoice | undefined;
        let matchType: BankTransaction['matchType'];
        let matchConfidence = 0;
        let feeAmount = 0;

        for (const inv of openInvoices) {
          if (matchedMap.has(inv.id)) continue;
          const invAmount = parseAmount(inv.amount);
          const cleanInvNum = inv.invoiceNumber.toLowerCase().replace(/[^a-z0-9]/g, '');
          const diff = invAmount - amount;

          if (description.toLowerCase().includes(cleanInvNum) && Math.abs(diff) < 0.01) {
            bestInvoice = inv;
            matchType = 'Exact Invoice #';
            matchConfidence = 100;
            break;
          }

          if (description.toLowerCase().includes(cleanInvNum) && diff > 0 && diff <= 15) {
            bestInvoice = inv;
            matchType = 'Match with Bank Fee';
            matchConfidence = 95;
            feeAmount = Number(diff.toFixed(2));
            break;
          }

          if (description.toLowerCase().includes(inv.customerName.toLowerCase()) && Math.abs(diff) < 0.01) {
            bestInvoice = inv;
            matchType = 'Customer & Amount';
            matchConfidence = 85;
            break;
          }

          if (Math.abs(diff) < 0.01 && !bestInvoice) {
            bestInvoice = inv;
            matchType = 'Amount Match';
            matchConfidence = 65;
          }
        }

        if (bestInvoice) {
          matchedMap.add(bestInvoice.id);
          autoSelection[txId] = true;
        }

        parsedTransactions.push({
          id: txId,
          date: date || formatDateInput(new Date()),
          description,
          amount,
          matchedInvoice: bestInvoice,
          matchType,
          matchConfidence,
          feeAmount
        });
      }

      setParsedBankFeed(parsedTransactions);
      setSelectedMatches(autoSelection);
      setIsBankModalOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Invoices & Collections</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Manage overdue and upcoming invoices</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleBankCsvUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border border-brand-500/40 bg-brand-500/10 px-4 py-3 text-sm font-semibold text-brand-300 transition hover:bg-brand-500/20"
            >
              📥 Import Bank CSV
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditing(null);
                setMessage('');
              }}
              className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
            >
              + New invoice
            </button>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-300">
            {message}
          </div>
        )}

        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <label className="block text-sm text-slate-300">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Invoice #, customer, notes"
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
              >
                {searchStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Risk
              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value as typeof riskFilter)}
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
              >
                {riskOptions.map((risk) => (
                  <option key={risk} value={risk}>{risk}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-slate-300">
              Sort
              <div className="mt-2 flex gap-2">
                <select
                  value={sortKey}
                  onChange={(event) => setSortKey(event.target.value as typeof sortKey)}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                >
                  {sortOptions.map((sort) => (
                    <option key={sort} value={sort}>{sort}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                  className="rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-300 hover:text-white"
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </label>
          </div>
        </div>

        {/* الجدول الرئيسي */}
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/80">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Invoice</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Customer</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Due date</th>
                <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Status</th>
                <th className="px-6 py-4 text-right font-medium uppercase tracking-[0.16em]">Amount</th>
                <th className="px-6 py-4 text-right font-medium uppercase tracking-[0.16em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 bg-slate-950/95">
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => setSelectedInvoiceId(invoice.id)}
                  className={`cursor-pointer hover:bg-slate-900/90 ${selectedInvoiceId === invoice.id ? 'bg-slate-900/90' : ''}`}
                >
                  <td className="px-6 py-5 font-medium text-slate-200">{invoice.invoiceNumber}</td>
                  <td className="px-6 py-5 text-slate-300">{invoice.customerName}</td>
                  <td className="px-6 py-5 text-slate-300">{invoice.dueDate}</td>
                  <td className="px-6 py-5 text-slate-300">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClass(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-medium text-slate-200">
                    {invoice.amount}
                  </td>
                  <td className="px-6 py-5 text-right text-slate-200">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status === 'Paid' && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setReceiptInvoice(invoice);
                          }}
                          className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-500/20"
                        >
                          Receipt
                        </button>
                      )}
                      {invoice.status !== 'Paid' && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openPaymentModal(invoice);
                          }}
                          className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          Record Payment
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEdit(invoice);
                        }}
                        className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-brand-500 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(invoice.id);
                        }}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    No invoices match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* نموذج إنشاء وتعديل الفاتورة مع قائمة الاختيار والزر السريع */}
        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">{editing ? 'Edit invoice' : 'Invoice details'}</h2>
          <p className="mt-2 text-sm text-slate-400">Add and manage invoices for your collection workflow.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSave}>
            <label className="block text-sm text-slate-300">
              Invoice #
              <input
                value={form.invoiceNumber}
                onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, invoiceNumber: event.target.value }))}
                placeholder="e.g. INV-2026-001"
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none focus:border-brand-500"
              />
            </label>

            {/* خانة العميل: قائمة منسدلة + زر إضافة عميل جديد سريع */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm text-slate-300">Customer Account</label>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(true)}
                  className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition"
                >
                  + Add New Customer
                </button>
              </div>
              <select
                value={form.customerId}
                onChange={(event) => {
                  const customerId = event.target.value;
                  const customer = customers.find((item) => item.id === customerId);
                  setForm((prev: InvoiceFormState) => ({
                    ...prev,
                    customerId,
                    customerName: customer ? customer.name : ''
                  }));
                }}
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
              >
                <option value="">-- Choose registered customer --</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.company && customer.company !== customer.name ? `(${customer.company})` : ''}
                  </option>
                ))}
              </select>
              {customers.length === 0 && (
                <p className="mt-1.5 text-xs text-amber-400/80">
                  ⚠️ No customers registered yet. Click <strong>"+ Add New Customer"</strong> to create one.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Amount
                <input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, amount: event.target.value }))}
                  placeholder="0.00"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Currency
                <select
                  value={form.currency}
                  onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, currency: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm text-slate-300">Issue date</label>
                <CustomDatePicker
                  value={form.issueDate}
                  onChange={(val) => setForm((prev: InvoiceFormState) => ({ ...prev, issueDate: val }))}
                  placeholder="Select issue date"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300">Due date</label>
                <CustomDatePicker
                  value={form.dueDate}
                  onChange={(val) => setForm((prev: InvoiceFormState) => ({ ...prev, dueDate: val }))}
                  placeholder="Select due date"
                />
              </div>
            </div>

            <label className="block text-sm text-slate-300">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, status: event.target.value as InvoiceStatus }))}
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
              >
                {invoiceStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>

            {form.status === 'Paid' && (
              <div>
                <label className="block text-sm text-slate-300">Payment date</label>
                <CustomDatePicker
                  value={form.paymentDate}
                  onChange={(val) => setForm((prev: InvoiceFormState) => ({ ...prev, paymentDate: val }))}
                  placeholder="Select payment date"
                />
              </div>
            )}

            <label className="block text-sm text-slate-300">
              Notes
              <textarea
                rows={2}
                value={form.notes}
                onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, notes: event.target.value }))}
                placeholder="Add invoice notes or follow-up details..."
                className="mt-2 w-full min-h-[70px] resize-none overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none transition focus:border-brand-500"
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="submit" className="rounded-3xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
                {editing ? 'Save invoice' : 'Create invoice'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setEditing(null);
                    setMessage('');
                  }}
                  className="rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* نافذة إضافة عميل جديد سريع */}
      {isNewCustomerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-[2.5rem] border border-slate-800 bg-slate-900 p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-xl font-bold text-white">Create New Customer</h3>
              <button
                onClick={() => setIsNewCustomerModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickCustomer} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Customer Name *</label>
                <input
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Company / Legal Entity</label>
                <input
                  value={newCustCompany}
                  onChange={(e) => setNewCustCompany(e.target.value)}
                  placeholder="e.g. Acme Industries Ltd"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Billing Email</label>
                <input
                  type="email"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="accounts@client.com"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+20 100 000 0000"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(false)}
                  className="rounded-2xl border border-slate-700 px-5 py-2.5 font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-brand-500 px-6 py-2.5 font-semibold text-white hover:bg-brand-400 transition"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الفاتورة */}
      {selectedInvoice && (
        <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Invoice details</p>
              <h2 className="mt-2 text-xl font-semibold text-white">{selectedInvoice.invoiceNumber}</h2>
              <p className="mt-1 text-sm text-slate-400">{selectedInvoice.customerName}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${getStatusBadgeClass(selectedInvoice.status)}`}>
              {selectedInvoice.status}
            </span>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Amount</p>
              <p className="mt-3 text-3xl font-semibold text-white">{selectedInvoice.amount}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Issue date</p>
              <p className="mt-3 text-lg font-semibold text-white">{selectedInvoice.issueDate || '—'}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Due date</p>
              <p className="mt-3 text-lg font-semibold text-white">{selectedInvoice.dueDate || '—'}</p>
            </div>
          </div>
          {selectedInvoice.currency && selectedInvoice.exchangeRate !== undefined && (
            <p className="mt-4 text-xs text-slate-500">
              Recorded in {selectedInvoice.currency} at a rate of {selectedInvoice.exchangeRate} to 1 USD
              {selectedInvoice.exchangeRateFetchedAt ? ` · fetched ${new Date(selectedInvoice.exchangeRateFetchedAt).toLocaleString()}` : ''}
              {selectedInvoice.exchangeRateSource === 'cached_fallback' ? ' · cached rate used due to a temporary API issue' : ''}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            {selectedInvoice.status === 'Paid' && (
              <button
                type="button"
                onClick={() => setReceiptInvoice(selectedInvoice)}
                className="rounded-3xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-500"
              >
                View Official Receipt
              </button>
            )}
            {selectedInvoice.status !== 'Paid' && (
              <button
                type="button"
                onClick={() => openPaymentModal(selectedInvoice)}
                className="rounded-3xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Record Payment
              </button>
            )}
            <button
              type="button"
              onClick={() => handleEdit(selectedInvoice)}
              className="rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
            >
              Edit invoice
            </button>
          </div>
          <div className="mt-6 rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Notes & Payment Audit Trail</p>
            <p className="mt-3 text-sm text-slate-300 whitespace-pre-wrap">{selectedInvoice.notes || 'No notes added.'}</p>
          </div>
        </div>
      )}

      {/* نافذة تسجيل الدفع */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-[2rem] border border-slate-800 bg-slate-900 p-7 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Record Invoice Payment</h3>
                <p className="text-xs text-slate-400 mt-1">Invoice: {paymentModalInvoice.invoiceNumber} • {paymentModalInvoice.customerName}</p>
              </div>
              <button
                onClick={() => setPaymentModalInvoice(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-950/60 p-4 border border-slate-800/80 flex justify-between items-center">
                <span className="text-xs text-slate-400">Total Invoice Amount:</span>
                <span className="text-base font-bold text-white">{paymentModalInvoice.amount}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-brand-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="ACH / Direct Debit">ACH / Direct</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Date</label>
                  <CustomDatePicker
                    value={paymentDate}
                    onChange={(val) => setPaymentDate(val)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction / Reference # (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. TR-9482751 / Check #302"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-brand-500"
                />
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="rounded-2xl border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition"
                >
                  Confirm & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة الإيصال */}
      {receiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-[2.5rem] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <div className="flex justify-between items-start border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Payment Confirmed
                </span>
                <h3 className="text-2xl font-bold text-white mt-3">Official Payment Receipt</h3>
                <p className="text-xs text-slate-400 mt-1">Receipt Ref: REC-{receiptInvoice.invoiceNumber}</p>
              </div>
              <button
                onClick={() => setReceiptInvoice(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-950/80 p-4 border border-slate-800 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer Name:</span>
                  <span className="font-semibold text-white">{receiptInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Number:</span>
                  <span className="font-semibold text-white">{receiptInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Settlement Date:</span>
                  <span className="font-semibold text-slate-300">{receiptInvoice.paymentDate || receiptInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800">
                  <span className="text-sm font-semibold text-slate-300">Amount Paid:</span>
                  <span className="text-lg font-bold text-emerald-400">{receiptInvoice.amount}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/40 p-4 border border-slate-800">
                <span className="text-slate-400 block mb-1 font-medium">Audit Trail:</span>
                <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {receiptInvoice.notes || 'Payment reconciled with full settlement.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setReceiptInvoice(null)}
                className="rounded-2xl bg-brand-500 px-6 py-2.5 text-xs font-semibold text-white hover:bg-brand-400"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Due and overdue</p>
        <p className="mt-2 text-sm text-slate-400">{dueCount} invoice(s) are due soon or overdue.</p>
      </div>
    </div>
  );
};

export default OrdersPage;