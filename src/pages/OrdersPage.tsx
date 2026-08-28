import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import type { Invoice, InvoiceStatus } from '../types';

const invoiceStatuses: InvoiceStatus[] = ['Draft', 'Sent', 'Due Soon', 'Overdue', 'Partially Paid', 'Paid'];
const searchStatuses = ['All', 'Draft', 'Sent', 'Due Soon', 'Overdue', 'Partially Paid', 'Paid'] as const;
const riskOptions = ['All', 'High', 'Medium', 'Low'] as const;
const sortOptions = ['dueDate', 'amount', 'status', 'customerName'] as const;

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

const OrdersPage = () => {
  const { orders: invoices, inventory: customers, customerInsights, addOrder, updateOrder, deleteOrder } = useAppData();
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<typeof searchStatuses[number]>('All');
  const [riskFilter, setRiskFilter] = useState<typeof riskOptions[number]>('All');
  const [sortKey, setSortKey] = useState<typeof sortOptions[number]>('dueDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [form, setForm] = useState({
    invoiceNumber: '',
    customerId: '',
    customerName: '',
    amount: '',
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

  const resetForm = () =>
    setForm({
      invoiceNumber: '',
      customerId: '',
      customerName: '',
      amount: '',
      issueDate: '',
      dueDate: '',
      status: 'Sent',
      paymentDate: '',
      notes: ''
    });

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
    const paymentDate = form.status === 'Paid' ? form.paymentDate || formatDateInput(new Date()) : undefined;
    
    const payload: Omit<Invoice, 'id'> = {
      invoiceNumber: form.invoiceNumber.trim(),
      customerId,
      customerName: form.customerName.trim(),
      amount,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      status: form.status,
      paymentDate,
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

  const handleMarkPaid = (invoice: Invoice) => {
    updateOrder({ ...invoice, status: 'Paid', paymentDate: formatDateInput(new Date()) });
    setMessage(`Marked ${invoice.invoiceNumber} as paid.`);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Invoices</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Manage overdue and upcoming invoices</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setEditing(null);
                setMessage('');
              }}
              className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
            >
              New invoice
            </button>
          </div>
        </div>

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
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleEdit(invoice);
                        }}
                        className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-brand-500 hover:text-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDelete(invoice.id);
                        }}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
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

        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <h2 className="text-lg font-semibold text-white">{editing ? 'Edit invoice' : 'Invoice details'}</h2>
          <p className="mt-2 text-sm text-slate-400">Add and manage invoices for your collection workflow.</p>
          <form className="mt-6 space-y-4" onSubmit={handleSave}>
            <label className="block text-sm text-slate-300">
              Invoice #
              <input
                value={form.invoiceNumber}
                onChange={(event) => setForm((prev) => ({ ...prev, invoiceNumber: event.target.value }))}
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
                    setForm((prev) => ({
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
                  onChange={(event) => setForm((prev) => ({ ...prev, customerName: event.target.value }))}
                  placeholder="Enter customer name"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none"
                />
              )}
            </label>
            <label className="block text-sm text-slate-300">
              Amount
              <input
                value={form.amount}
                onChange={(event) => setForm((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="$0.00"
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none focus:border-brand-500 transition"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Issue date
                <input
                  type="date"
                  value={form.issueDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, issueDate: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Due date
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
            </div>
            <label className="block text-sm text-slate-300">
              Status
              <select
                value={form.status}
                onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value as InvoiceStatus }))}
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
                  onChange={(event) => setForm((prev) => ({ ...prev, paymentDate: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
            )}
            <label className="block text-sm text-slate-300">
              Notes
              <textarea
                value={form.notes}
                onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none"
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
          {message && <p className="mt-4 rounded-3xl bg-slate-950/70 px-4 py-3 text-sm text-slate-200">{message}</p>}
        </div>
      </section>

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
            {selectedInvoice?.status !== 'Paid' && (
              <button
                type="button"
                onClick={() => selectedInvoice && handleMarkPaid(selectedInvoice)}
                className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Mark paid
              </button>
            )}
            <button
              type="button"
              onClick={() => selectedInvoice && handleEdit(selectedInvoice)}
              className="rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
            >
              Edit invoice
            </button>
          </div>
          <div className="mt-6 rounded-3xl bg-slate-900/80 p-5">
            <p className="text-sm text-slate-400">Notes</p>
            <p className="mt-3 text-sm text-slate-300">{selectedInvoice.notes || 'No notes added.'}</p>
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