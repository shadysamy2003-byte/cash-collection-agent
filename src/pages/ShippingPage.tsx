import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import type { NotificationItem } from '../types';

const ShippingPage = () => {
  const { shipping: notifications, addShippingItem, updateShippingItem } = useAppData();
  const [editing, setEditing] = useState<NotificationItem | null>(null);
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

  const openActionCount = useMemo(() => notifications.filter((note) => note.actionRequired).length, [notifications]);

  const resetForm = () =>
    setForm({ type: 'Invoice overdue', title: '', message: '', date: '', actionRequired: true, invoiceId: '', customerId: '' });

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.title.trim() || !form.message.trim() || !form.date.trim()) {
      setStatusMessage('Please complete all action fields.');
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
      setStatusMessage('Action updated.');
    } else {
      addShippingItem(payload);
      setStatusMessage('Action added.');
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

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Action Center</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Track collection reminders and overdue follow-ups</h1>
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
            <div className="px-6 py-5 bg-slate-900 text-sm text-slate-400">Open actions</div>
            <div className="divide-y divide-slate-800 bg-slate-950/95">
              {notifications.map((note) => (
                <div key={note.id} className="flex flex-col gap-3 border-b border-slate-800 px-6 py-4 sm:flex-row sm:items-center sm:justify-between hover:bg-slate-900/90">
                  <div>
                    <p className="text-sm text-slate-200">{note.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{note.message}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-2xl bg-slate-800 px-3 py-1 text-xs text-slate-300">{note.type}</span>
                    <button
                      type="button"
                      onClick={() => handleEdit(note)}
                      className="rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-brand-500 hover:text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">{editing ? 'Edit action' : 'Create action'}</h2>
            <p className="mt-2 text-sm text-slate-400">Capture overdue reminders, follow-ups, and customer payment prompts.</p>
            <form className="mt-6 space-y-4" onSubmit={handleSave}>
              <label className="block text-sm text-slate-300">
                Action type
                <select
                  value={form.type}
                  onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as NotificationItem['type'] }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
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
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Message
                <textarea
                  value={form.message}
                  onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="block text-sm text-slate-300">
                Date
                <input
                  type="date"
                  value={form.date}
                  onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                  className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <div className="flex flex-wrap gap-3">
                <button type="submit" className="rounded-3xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
                  {editing ? 'Save action' : 'Add action'}
                </button>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setEditing(null);
                      setStatusMessage('');
                    }}
                    className="rounded-3xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.actionRequired}
                  onChange={(event) => setForm((prev) => ({ ...prev, actionRequired: event.target.checked }))}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                />
                Action required
              </label>
            </form>
            {statusMessage && <p className="mt-4 rounded-3xl bg-slate-950/70 px-4 py-3 text-sm text-slate-200">{statusMessage}</p>}
          </div>
        </div>

        <div className="mt-8 rounded-[2rem] border border-slate-800 bg-slate-950/80 p-6">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Pending follow-ups</p>
          <p className="mt-2 text-sm text-slate-400">{openActionCount} action item(s) need follow-up.</p>
        </div>
      </section>
    </div>
  );
};

export default ShippingPage;
