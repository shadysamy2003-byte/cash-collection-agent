import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { EmptyState } from '../components/EmptyState';
import type { NotificationItem } from '../types';

const ActionsPage = () => {
  const { shipping: notifications, orders, addShippingItem, updateShippingItem } = useAppData();
  const [editing, setEditing] = useState<NotificationItem | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [form, setForm] = useState({
    type: 'Invoice overdue' as NotificationItem['type'],
    title: '',
    message: '',
    date: '',
    actionRequired: true,
    invoiceId: '',
    customerId: ''
  });
  const [statusMessage, setStatusMessage] = useState('');

  const openActionCount = useMemo(
    () => notifications.filter((note) => note.actionRequired).length,
    [notifications]
  );

  const filteredNotifications = useMemo(() => {
    let list = [...notifications];
    if (filter === 'pending') {
      list = list.filter((n) => n.actionRequired);
    } else if (filter === 'resolved') {
      list = list.filter((n) => !n.actionRequired);
    }
    return list.sort((a, b) => Number(b.actionRequired) - Number(a.actionRequired));
  }, [notifications, filter]);

  const resetForm = () =>
    setForm({
      type: 'Invoice overdue',
      title: '',
      message: '',
      date: '',
      actionRequired: true,
      invoiceId: '',
      customerId: ''
    });

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim() || !form.date.trim()) {
      setStatusMessage('Please complete all required fields (Title, Message, Date).');
      return;
    }

    const payload: Omit<NotificationItem, 'id'> = {
      type: form.type,
      title: form.title.trim(),
      message: form.message.trim(),
      date: form.date,
      actionRequired: form.actionRequired,
      invoiceId: form.invoiceId.trim() || undefined,
      customerId: form.customerId.trim() || undefined
    };

    if (editing) {
      updateShippingItem({ ...editing, ...payload });
      setStatusMessage('Action updated successfully.');
    } else {
      addShippingItem(payload);
      setStatusMessage('New action created successfully.');
    }

    resetForm();
    setEditing(null);
  };

  const handleEdit = (item: NotificationItem) => {
    setEditing(item);
    setForm({
      type: item.type,
      title: item.title,
      message: item.message,
      date: item.date,
      actionRequired: item.actionRequired,
      invoiceId: item.invoiceId ?? '',
      customerId: item.customerId ?? ''
    });
    setStatusMessage('');
  };

  const handleResolve = (item: NotificationItem) => {
    updateShippingItem({ ...item, actionRequired: false });
    setStatusMessage('Action marked as resolved.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Action Center</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Manage overdue reminders and collection tasks</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-400">Create follow-ups, track open actions, and resolve collection tasks from one place.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setEditing(null);
              setStatusMessage('');
            }}
            className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            New action
          </button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/80">
            {/* Filter Header */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900 px-6 py-4">
              <span className="text-sm font-medium text-slate-300">
                Action Items ({filteredNotifications.length})
              </span>
              <div className="flex items-center gap-1 rounded-xl bg-slate-950/60 p-1 border border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    filter === 'all' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('pending')}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    filter === 'pending' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending ({openActionCount})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('resolved')}
                  className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                    filter === 'resolved' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Resolved
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-800 bg-slate-950/95">
              {filteredNotifications.length === 0 ? (
                <EmptyState
                  title="No actions found"
                  description={filter === 'all' ? "Use the form to create a collection reminder." : `No ${filter} action items available.`}
                />
              ) : (
                filteredNotifications.map((note) => (
                  <div key={note.id} className="flex flex-col gap-3 border-b border-slate-800/80 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-900/90 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">{note.title}</p>
                        {note.invoiceId && (
                          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                            {note.invoiceId}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{note.message}</p>
                      <p className="mt-2 text-xs text-slate-500">{note.date}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <span className={`rounded-full px-3 py-1 text-xs ${note.actionRequired ? 'bg-rose-500/15 text-rose-200 border border-rose-500/20' : 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/20'}`}>
                        {note.actionRequired ? 'Action required' : 'Resolved'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEdit(note)}
                        className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-brand-500 hover:text-white"
                      >
                        Edit
                      </button>
                      {note.actionRequired && (
                        <button
                          type="button"
                          onClick={() => handleResolve(note)}
                          className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form */}
          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">{editing ? 'Edit Action Item' : 'Create New Action'}</h2>
            <p className="mt-1 text-xs text-slate-400">Capture follow-up reminders and overdue customer tasks.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSave}>
              <label className="block text-sm text-slate-300">
                Action type
                <select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as NotificationItem['type'] }))}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                >
                  <option>Invoice overdue</option>
                  <option>Large invoice overdue</option>
                  <option>Customer pays late</option>
                  <option>Invoice due soon</option>
                  <option>Follow-up required</option>
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Title
                <input
                  value={form.title}
                  placeholder="e.g., Call customer regarding invoice"
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Related Invoice (Optional)
                <select
                  value={form.invoiceId}
                  onChange={(event) => setForm((prev) => ({ ...prev, invoiceId: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                >
                  <option value="">-- Select Invoice --</option>
                  {orders.map((inv) => (
                    <option key={inv.id} value={inv.invoiceNumber}>
                      {inv.invoiceNumber} - {inv.customerName} ({inv.amount})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm text-slate-300">
                Message
                <textarea
                  rows={3}
                  value={form.message}
                  placeholder="Details or specific notes..."
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-brand-500"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={form.actionRequired}
                  onChange={(event) => setForm((prev) => ({ ...prev, actionRequired: event.target.checked }))}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                />
                Action required
              </label>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className="rounded-2xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-400">
                  {editing ? 'Save changes' : 'Add action'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setEditing(null);
                      setStatusMessage('');
                    }}
                    className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2.5 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
            {statusMessage && <p className="mt-4 rounded-2xl bg-brand-500/10 border border-brand-500/20 px-4 py-2.5 text-xs text-brand-200">{statusMessage}</p>}
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Pending follow-ups</p>
            <p className="mt-1 text-sm text-slate-400">{openActionCount} pending action item(s) remain open.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ActionsPage;