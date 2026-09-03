import { useMemo, useState, useRef, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';
import type { Invoice, InvoiceStatus } from '../types';

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
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentDate: string;
  notes: string;
}

const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'string') return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
  return 0;
};

const formatCurrency = (value: number) => `$${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

const STORAGE_KEY = 'orderflow_invoice_form_draft_v1';

const OrdersPage = () => {
  const { orders: invoices, inventory: customers, customerInsights, addOrder, updateOrder, deleteOrder } = useAppData();
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof searchStatuses[number]>('All');
  const [riskFilter, setRiskFilter] = useState<typeof riskOptions[number]>('All');
  const [sortKey, setSortKey] = useState<typeof sortOptions[number]>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // حالة تسجيل السداد الفردي
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(formatDateInput(new Date()));

  // حالة استيراد كشف الحساب البنكي
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [parsedBankFeed, setParsedBankFeed] = useState<BankTransaction[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // حالة إيصال السداد (Payment Receipt Modal)
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);

  // نموذج مع استرجاع البيانات المحفوظة تلقائياً من localStorage
  const [form, setForm] = useState<InvoiceFormState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return {
      invoiceNumber: '',
      customerId: '',
      customerName: '',
      amount: '',
      issueDate: formatDateInput(new Date()),
      dueDate: formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      status: 'Sent' as InvoiceStatus,
      paymentDate: '',
      notes: ''
    };
  });

  const [message, setMessage] = useState('');

  // حفظ بيانات النموذج في localStorage كلما حدث تغيير
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {
      // ignore
    }
  }, [form]);

  const dueCount = useMemo(
    () => invoices.filter((invoice) => invoice.status === 'Overdue' || invoice.status === 'Due Soon').length,
    [invoices]
  );

  const customerMap = useMemo(() => new Map(customers.map((customer) => [customer.id, customer])), [customers]);
  const insightMap = useMemo(() => new Map(customerInsights.map((insight) => [insight.id, insight])), [customerInsights]);

  const selectedInvoice = useMemo(
    () => (selectedInvoiceId ? invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null : null),
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
        if (sortKey === 'amount') {
          return (parseAmount(a.amount) - parseAmount(b.amount)) * direction;
        }
        if (sortKey === 'dueDate') {
          return (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) * direction;
        }
        if (sortKey === 'status') {
          return String(a.status).localeCompare(String(b.status)) * direction;
        }
        return String(a.customerName).localeCompare(String(b.customerName)) * direction;
      });
  }, [invoices, customerMap, insightMap, riskFilter, searchQuery, sortDirection, sortKey, statusFilter]);

  const resetForm = () => {
    const fresh: InvoiceFormState = {
      invoiceNumber: '',
      customerId: '',
      customerName: '',
      amount: '',
      issueDate: formatDateInput(new Date()),
      dueDate: formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      status: 'Sent',
      paymentDate: '',
      notes: ''
    };
    setForm(fresh);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedAmount = parseAmount(form.amount);

    if (
      !form.invoiceNumber.trim() ||
      !form.issueDate ||
      !form.dueDate ||
      !String(form.amount).trim() ||
      (!form.customerId && !form.customerName.trim())
    ) {
      setMessage('Please complete all invoice fields.');
      return;
    }

    if (customers.length > 0 && !form.customerId) {
      setMessage('Please select a customer for the invoice.');
      return;
    }

    if (parsedAmount <= 0) {
      setMessage('Enter a valid invoice amount.');
      return;
    }

    if (new Date(form.dueDate) < new Date(form.issueDate)) {
      setMessage('Due date must be the same or after the issue date.');
      return;
    }

    const duplicateInvoice = invoices.find(
      (invoice) => String(invoice.invoiceNumber).trim().toLowerCase() === form.invoiceNumber.trim().toLowerCase() && invoice.id !== editing?.id
    );
    if (duplicateInvoice) {
      setMessage('Invoice number already exists.');
      return;
    }

    const amount = String(form.amount).startsWith('$') ? form.amount : formatCurrency(parsedAmount);
    const customerId = form.customerId || editing?.customerId || `CUST-${Math.random().toString(36).slice(2, 6)}`;
    const paymentDateVal = form.status === 'Paid' ? form.paymentDate || formatDateInput(new Date()) : undefined;
    
    const payload: Omit<Invoice, 'id'> = {
      invoiceNumber: form.invoiceNumber.trim(),
      customerId,
      customerName: form.customerName.trim(),
      amount,
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

    if (editing) {
      updateOrder({ ...editing, ...payload });
      setMessage('Invoice updated successfully.');
    } else {
      addOrder(payload);
      setMessage('Invoice added successfully.');
    }

    resetForm();
    setEditing(null);
  };

  const handleEdit = (invoice: Invoice) => {
    setEditing(invoice);
    setSelectedInvoiceId(invoice.id);
    setForm({
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      amount: String(invoice.amount),
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

  const openPaymentModal = (invoice: Invoice) => {
    setPaymentModalInvoice(invoice);
    setPaymentAmount(String(parseAmount(invoice.amount)));
    setPaymentReference('');
    setPaymentMethod('Bank Transfer');
    setPaymentDate(formatDateInput(new Date()));
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const total = parseAmount(paymentModalInvoice.amount);
    const paid = parseAmount(paymentAmount);

    if (paid <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    const isFullSettlement = paid >= total;
    const newStatus: InvoiceStatus = isFullSettlement ? 'Paid' : 'Partially Paid';
    const auditNote = `[Payment Logged: ${formatCurrency(paid)} via ${paymentMethod}${paymentReference ? ` (Ref: ${paymentReference})` : ''} on ${paymentDate}]`;
    const updatedNotes = paymentModalInvoice.notes 
      ? `${paymentModalInvoice.notes}\n${auditNote}` 
      : auditNote;

    const updatedInv: Invoice = {
      ...paymentModalInvoice,
      status: newStatus,
      paymentDate: isFullSettlement ? paymentDate : paymentModalInvoice.paymentDate,
      notes: updatedNotes
    };

    updateOrder(updatedInv);
    setMessage(`Payment of ${formatCurrency(paid)} recorded for ${paymentModalInvoice.invoiceNumber}.`);
    setPaymentModalInvoice(null);
    setReceiptInvoice(updatedInv);
    setTimeout(() => setMessage(''), 4000);
  };

  // معالج رفع وقراءة كشف الحساب البنكي مع إدارة فروق الرسوم
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
          const cleanDesc = description.toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanCustName = inv.customerName.toLowerCase();
          const diff = invAmount - amount;

          // 1. تطابق صريح لرقم الفاتورة والمبلغ
          if (cleanDesc.includes(cleanInvNum) && Math.abs(diff) < 0.01) {
            bestInvoice = inv;
            matchType = 'Exact Invoice #';
            matchConfidence = 100;
            break;
          }

          // 2. تطابق رقم الفاتورة مع فارق عمولة بنكية حتى 15 دولار
          if (cleanDesc.includes(cleanInvNum) && diff > 0 && diff <= 15) {
            bestInvoice = inv;
            matchType = 'Match with Bank Fee';
            matchConfidence = 95;
            feeAmount = Number(diff.toFixed(2));
            break;
          }

          // 3. تطابق اسم العميل والمبلغ
          if (description.toLowerCase().includes(cleanCustName) && Math.abs(diff) < 0.01) {
            bestInvoice = inv;
            matchType = 'Customer & Amount';
            matchConfidence = 85;
            break;
          }

          // 4. تطابق المبلغ فقط
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

  // تأكيد المطابقة مع قيد الرسوم البنكية إن وُجدت
  const handleConfirmReconciliation = () => {
    let reconciledCount = 0;

    parsedBankFeed.forEach((tx) => {
      if (selectedMatches[tx.id] && tx.matchedInvoice) {
        const inv = tx.matchedInvoice;
        const total = parseAmount(inv.amount);
        const paid = tx.amount;
        const fee = tx.feeAmount || 0;
        const isFull = (paid + fee) >= total;
        const newStatus: InvoiceStatus = isFull ? 'Paid' : 'Partially Paid';
        
        const feeAudit = fee > 0 ? ` [Bank Fee Deducted: ${formatCurrency(fee)}]` : '';
        const audit = `[Auto-Reconciled from Bank Feed: ${formatCurrency(paid)}${feeAudit} Ref: "${tx.description}" on ${tx.date}]`;
        const notes = inv.notes ? `${inv.notes}\n${audit}` : audit;

        updateOrder({
          ...inv,
          status: newStatus,
          paymentDate: isFull ? tx.date : inv.paymentDate,
          notes
        });
        reconciledCount++;
      }
    });

    setMessage(`Successfully reconciled ${reconciledCount} invoice(s) from bank statement.`);
    setIsBankModalOpen(false);
    setTimeout(() => setMessage(''), 4500);
  };

  // تصدير تقرير التسوية البنكية
  const handleExportReconciliationReport = () => {
    const paidInvoices = invoices.filter((i) => i.status === 'Paid' || i.notes?.includes('Auto-Reconciled') || i.notes?.includes('Payment Logged'));
    if (paidInvoices.length === 0) {
      alert('No reconciled or settled invoices to export.');
      return;
    }

    const headers = ['Invoice #', 'Customer', 'Amount', 'Settlement Date', 'Status', 'Audit Reference / Notes'];
    const rows = paidInvoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.customerName}"`,
      `"${parseAmount(inv.amount)}"`,
      `"${inv.paymentDate || inv.dueDate}"`,
      `"${inv.status}"`,
      `"${(inv.notes || '').replace(/"/g, '""').replace(/\n/g, ' | ')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reconciliation_Audit_Report_${formatDateInput(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <button
              type="button"
              onClick={handleExportReconciliationReport}
              className="rounded-2xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              📊 Export Audit CSV
            </button>
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
                    {formatCurrency(parseAmount(invoice.amount))}
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

        {/* نموذج إنشاء أو تعديل الفاتورة مع تحسين حقول التاريخ والتقويم */}
        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">{editing ? 'Edit invoice' : 'Invoice details'}</h2>
          <p className="mt-2 text-sm text-slate-400">Add and manage invoices for your collection workflow. (Drafts auto-saved)</p>
          <form className="mt-6 space-y-4" onSubmit={handleSave}>
            <label className="block text-sm text-slate-300">
              Invoice #
              <input
                value={form.invoiceNumber}
                onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, invoiceNumber: event.target.value }))}
                placeholder="e.g. INV-2026-001"
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Customer
              {customers.length > 0 ? (
                <select
                  value={form.customerId}
                  onChange={(event) => {
                    const customerId = event.target.value;
                    const customer = customers.find((item) => item.id === customerId);
                    setForm((prev: InvoiceFormState) => ({
                      ...prev,
                      customerId,
                      customerName: customer ? customer.name : prev.customerName
                    }));
                  }}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="">Select customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={form.customerName}
                  onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, customerName: event.target.value }))}
                  placeholder="Enter customer name"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none"
                />
              )}
            </label>
            <label className="block text-sm text-slate-300">
              Amount
              <input
                value={form.amount}
                onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, amount: event.target.value }))}
                placeholder="$0.00"
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none focus:border-brand-500 transition"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Issue date
                <div className="relative mt-2">
                  <input
                    type="date"
                    value={form.issueDate}
                    onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, issueDate: event.target.value }))}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </label>
              <label className="block text-sm text-slate-300">
                Due date
                <div className="relative mt-2">
                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, dueDate: event.target.value }))}
                    className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
              </label>
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
              <label className="block text-sm text-slate-300">
                Payment date
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(event) => setForm((prev: InvoiceFormState) => ({ ...prev, paymentDate: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
                />
              </label>
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

      {/* نافذة تفاصيل الفاتورة المحددة */}
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
              <p className="mt-3 text-3xl font-semibold text-white">
                {formatCurrency(parseAmount(selectedInvoice.amount))}
              </p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Issue date</p>
              <p className="mt-3 text-lg font-semibold text-white">{selectedInvoice.issueDate}</p>
            </div>
            <div className="rounded-3xl bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Due date</p>
              <p className="mt-3 text-lg font-semibold text-white">{selectedInvoice.dueDate}</p>
            </div>
          </div>
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

      {/* نافذة تسجيل السداد اليدوي */}
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
                <span className="text-base font-bold text-white">{formatCurrency(parseAmount(paymentModalInvoice.amount))}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {parseAmount(paymentAmount) < parseAmount(paymentModalInvoice.amount) 
                    ? `Remaining balance will be ${formatCurrency(parseAmount(paymentModalInvoice.amount) - parseAmount(paymentAmount))} (Partially Paid).` 
                    : 'This payment will mark the invoice as Fully Paid.'}
                </span>
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
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:filter [&::-webkit-calendar-picker-indicator]:invert"
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

      {/* نافذة المطابقة البنكية مع إدارة الرسوم والعمولات */}
      {isBankModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-[2.5rem] border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
              <div>
                <span className="text-xs uppercase tracking-[0.25em] text-brand-400 font-semibold">Automated Reconciliation Engine</span>
                <h3 className="text-2xl font-bold text-white mt-1">Bank Statement Reconciliation</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Found {parsedBankFeed.length} transaction(s). {Object.values(selectedMatches).filter(Boolean).length} matched automatically with bank fee tolerance support.
                </p>
              </div>
              <button
                onClick={() => setIsBankModalOpen(false)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {parsedBankFeed.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">No valid transaction lines detected in this statement.</p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-800">
                  <table className="min-w-full divide-y divide-slate-800 text-xs">
                    <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 text-center">Match</th>
                        <th className="px-4 py-3 text-left">Tx Date</th>
                        <th className="px-4 py-3 text-left">Bank Memo / Reference</th>
                        <th className="px-4 py-3 text-right">Inflow ($)</th>
                        <th className="px-4 py-3 text-left">Matched Invoice</th>
                        <th className="px-4 py-3 text-center">Confidence & Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                      {parsedBankFeed.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                          <td className="px-4 py-3.5 text-center">
                            <input
                              type="checkbox"
                              disabled={!tx.matchedInvoice}
                              checked={!!selectedMatches[tx.id]}
                              onChange={(e) => setSelectedMatches((prev) => ({ ...prev, [tx.id]: e.target.checked }))}
                              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-0 cursor-pointer disabled:opacity-30"
                            />
                          </td>
                          <td className="px-4 py-3.5 text-slate-300 font-medium whitespace-nowrap">{tx.date}</td>
                          <td className="px-4 py-3.5 text-white font-medium max-w-xs truncate" title={tx.description}>
                            {tx.description}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-emerald-400 whitespace-nowrap">
                            {formatCurrency(tx.amount)}
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">
                            {tx.matchedInvoice ? (
                              <div>
                                <span className="font-semibold text-white">{tx.matchedInvoice.invoiceNumber}</span>
                                <span className="text-slate-400 block text-[11px] truncate">
                                  {tx.matchedInvoice.customerName} ({formatCurrency(parseAmount(tx.matchedInvoice.amount))})
                                </span>
                                {(tx.feeAmount ?? 0) > 0 && (
                                  <span className="text-amber-400 block text-[10px] font-medium">
                                    Fee: {formatCurrency(tx.feeAmount ?? 0)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-500 italic">No matching invoice found</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            {tx.matchedInvoice ? (
                              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                                (tx.matchConfidence ?? 0) >= 90
                                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                  : (tx.matchConfidence ?? 0) >= 80
                                  ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                              }`}>
                                {tx.matchConfidence}% ({tx.matchType})
                              </span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {Object.values(selectedMatches).filter(Boolean).length} transaction(s) selected for reconciliation.
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="rounded-2xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={Object.values(selectedMatches).filter(Boolean).length === 0}
                  onClick={handleConfirmReconciliation}
                  className="rounded-2xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Reconcile Selected ({Object.values(selectedMatches).filter(Boolean).length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة إيصال السداد الرسمي (Payment Receipt Modal) */}
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
                  <span className="text-lg font-bold text-emerald-400">{formatCurrency(parseAmount(receiptInvoice.amount))}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-950/40 p-4 border border-slate-800">
                <span className="text-slate-400 block mb-1 font-medium">Audit Trail & Verification:</span>
                <p className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {receiptInvoice.notes || 'Payment reconciled with full settlement.'}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Payment Receipt for ${receiptInvoice.customerName}\nInvoice: ${receiptInvoice.invoiceNumber}\nAmount: ${formatCurrency(parseAmount(receiptInvoice.amount))}\nDate: ${receiptInvoice.paymentDate || receiptInvoice.dueDate}\nStatus: Settled & Reconciled.`
                  );
                  alert('Receipt summary copied to clipboard!');
                }}
                className="rounded-2xl border border-slate-700 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                📋 Copy Receipt Summary
              </button>
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