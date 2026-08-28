import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import type { Customer } from '../types';

const CustomersPage = () => {
  const { 
    inventory: customers, 
    customerInsights, 
    orders, 
    addInventoryItem, 
    updateInventoryItem, 
    deleteInventoryItem 
  } = useAppData();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    totalOutstanding: '',
    totalOverdue: '',
    averageDaysToPay: '',
    reliability: 'Good' as Customer['reliability']
  });
  const [message, setMessage] = useState('');

  const selectedInsight = selectedCustomerId 
    ? customerInsights.find((item) => item.id === selectedCustomerId) 
    : null;
    
  const selectedInvoices = selectedCustomerId 
    ? orders.filter((invoice) => invoice.customerId === selectedCustomerId) 
    : [];

  const lowReliabilityCount = useMemo(
    () => customers.filter((item) => item.reliability === 'Fair' || item.reliability === 'Needs improvement').length,
    [customers]
  );

  const displayList = useMemo(() => {
    return customers.map((c) => {
      const insight = customerInsights.find((ci) => ci.id === c.id);
      return {
        ...c,
        outstandingDisplay: insight?.outstandingBalance || c.totalOutstanding || '$0.00',
        overdueDisplay: insight?.overdueBalance || c.totalOverdue || '$0.00',
        riskDisplay: insight?.riskScore || 'Low',
        avgDelay: insight?.averagePaymentDelay ?? c.averageDaysToPay ?? 0
      };
    });
  }, [customers, customerInsights]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return displayList;
    return displayList.filter((customer) =>
      customer.name.toLowerCase().includes(query) ||
      customer.company?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
  }, [displayList, searchQuery]);

  const resetForm = () => {
    setForm({
      name: '',
      company: '',
      email: '',
      phone: '',
      totalOutstanding: '',
      totalOverdue: '',
      averageDaysToPay: '',
      reliability: 'Good'
    });
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setMessage('Please enter a customer name.');
      return;
    }

    const duplicateCustomer = customers.find(
      (item) =>
        item.id !== editing?.id &&
        ((form.email.trim() && item.email?.trim().toLowerCase() === form.email.trim().toLowerCase()) ||
          (item.name.trim().toLowerCase() === form.name.trim().toLowerCase() &&
            item.company?.trim().toLowerCase() === form.company.trim().toLowerCase()))
    );

    if (duplicateCustomer) {
      setMessage('A customer with the same name or email already exists.');
      return;
    }

    const payload: Omit<Customer, 'id'> = {
      name: form.name.trim(),
      company: form.company.trim() || form.name.trim(),
      email: form.email.trim() || 'unknown@example.com',
      phone: form.phone.trim() || '+1 000 000 0000',
      totalOutstanding: form.totalOutstanding.trim() ? form.totalOutstanding : '$0.00',
      totalOverdue: form.totalOverdue.trim() ? form.totalOverdue : '$0.00',
      outstanding: Number(form.totalOutstanding.replace(/[^0-9.-]+/g, '')) || 0,
      overdue: Number(form.totalOverdue.replace(/[^0-9.-]+/g, '')) || 0,
      averageDaysToPay: Number(form.averageDaysToPay) || 0,
      reliability: form.reliability,
      paymentHistory: editing?.paymentHistory ?? []
    };

    if (editing) {
      updateInventoryItem({ ...editing, ...payload });
      setMessage('Customer updated.');
    } else {
      addInventoryItem(payload);
      setMessage('Customer added.');
    }

    resetForm();
    setEditing(null);
  };

  const handleEdit = (item: Customer) => {
    setSelectedCustomerId(item.id);
    setEditing(item);
    setForm({
      name: item.name,
      company: item.company || '',
      email: item.email || '',
      phone: item.phone || '',
      totalOutstanding: item.totalOutstanding ? String(item.totalOutstanding) : '',
      totalOverdue: item.totalOverdue ? String(item.totalOverdue) : '',
      averageDaysToPay: item.averageDaysToPay !== undefined ? String(item.averageDaysToPay) : '',
      reliability: item.reliability || 'Good'
    });
    setMessage('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this customer?')) {
      deleteInventoryItem(id);
      if (selectedCustomerId === id) setSelectedCustomerId(null);
      setMessage('Customer removed.');
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Customers</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Customer reliability and payment history</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setEditing(null);
              setMessage('');
            }}
            className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Add customer
          </button>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <label className="block text-sm text-slate-300">
            Search customers
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, company or email"
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-brand-500 transition"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/80 min-w-0">
            <div className="overflow-x-auto w-full">
              <table className="min-w-[650px] w-full divide-y divide-slate-800 text-sm">
                <thead className="bg-slate-900 text-slate-400">
                  <tr>
                    <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Customer</th>
                    <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Company</th>
                    <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Outstanding</th>
                    <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Reliability</th>
                    <th className="px-6 py-4 text-left font-medium uppercase tracking-[0.16em]">Risk</th>
                    <th className="px-6 py-4 text-right font-medium uppercase tracking-[0.16em]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 bg-slate-950/95">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        onClick={() => setSelectedCustomerId(customer.id)}
                        className={`cursor-pointer hover:bg-slate-900/90 ${selectedCustomerId === customer.id ? 'bg-slate-900/90' : ''}`}
                      >
                        <td className="px-6 py-5 text-slate-200 font-medium">{customer.name}</td>
                        <td className="px-6 py-5 text-slate-300">{customer.company || '—'}</td>
                        <td className="px-6 py-5 text-slate-300">{customer.outstandingDisplay}</td>
                        <td className="px-6 py-5 text-slate-300">
                          <span className="inline-flex rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">
                            {customer.reliability || 'Good'}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-left text-slate-300">{customer.riskDisplay}</td>
                        <td className="px-6 py-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              const customerRecord = customers.find((item) => item.id === customer.id);
                              if (customerRecord) handleEdit(customerRecord);
                            }}
                            className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-brand-500 hover:text-white"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDelete(customer.id);
                            }}
                            className="ml-2 rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/15"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            {selectedInsight && (
              <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Customer snapshot</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{selectedInsight.name}</h2>
                    <p className="mt-1 text-sm text-slate-400">{selectedInsight.company}</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-200">
                    {selectedInsight.riskScore}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-sm text-slate-400">Outstanding balance</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedInsight.outstandingBalance}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-sm text-slate-400">Average payment delay</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{selectedInsight.averagePaymentDelay} days</p>
                  </div>
                </div>
                <div className="mt-6 rounded-3xl bg-slate-950/80 p-4">
                  <p className="text-sm text-slate-400">Invoices for this customer</p>
                  <p className="mt-2 text-sm text-slate-200">{selectedInvoices.length} total invoice(s) with {selectedInsight.overdueBalance} overdue.</p>
                </div>
                {selectedInvoices.length > 0 && (
                  <div className="mt-6 rounded-3xl bg-slate-950/80 p-4">
                    <p className="text-sm text-slate-400">Recent invoices</p>
                    <div className="mt-3 space-y-3">
                      {selectedInvoices.slice(0, 4).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between gap-3 rounded-3xl bg-slate-900/80 px-4 py-3">
                          <div>
                            <p className="font-semibold text-white">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-slate-500">Due {invoice.dueDate}</p>
                          </div>
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-200">{invoice.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <h2 className="text-lg font-semibold text-white">{editing ? 'Edit customer' : 'New customer'}</h2>
            <p className="mt-2 text-sm text-slate-400">Track customer payment behavior and overdue risk.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSave}>
              <label className="block text-sm text-slate-300">
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. John Doe"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Company
                <input
                  value={form.company}
                  onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                  placeholder="e.g. Acme Corp"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Email
                <input
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="e.g. contact@acme.com"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Phone
                <input
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="e.g. +201012345678"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Total outstanding
                <input
                  value={form.totalOutstanding}
                  onChange={(event) => setForm((prev) => ({ ...prev, totalOutstanding: event.target.value }))}
                  placeholder="$0.00"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Total overdue
                <input
                  value={form.totalOverdue}
                  onChange={(event) => setForm((prev) => ({ ...prev, totalOverdue: event.target.value }))}
                  placeholder="$0.00"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Average days to pay
                <input
                  type="number"
                  min={0}
                  value={form.averageDaysToPay}
                  onChange={(event) => setForm((prev) => ({ ...prev, averageDaysToPay: event.target.value }))}
                  placeholder="0"
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500 transition"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Reliability
                <select
                  value={form.reliability}
                  onChange={(event) => setForm((prev) => ({ ...prev, reliability: event.target.value as Customer['reliability'] }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-brand-500 transition"
                >
                  <option>Excellent</option>
                  <option>Good</option>
                  <option>Fair</option>
                  <option>Needs improvement</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-3xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
                  {editing ? 'Save customer' : 'Add customer'}
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
        </div>

        <div className="mt-8 rounded-[2rem] border border-amber-500/20 bg-amber-500/5 p-6 text-amber-100">
          <h3 className="text-lg font-semibold">Reliability alert</h3>
          <p className="mt-2 text-sm text-amber-200">{lowReliabilityCount} customer(s) have fair or lower payment reliability.</p>
        </div>
      </section>
    </div>
  );
};

export default CustomersPage;