import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';

const SettingsPage = () => {
  const { settings, updateSettings } = useAppData();
  const [form, setForm] = useState(settings);
  const [message, setMessage] = useState('');

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateSettings(form);
    setMessage('Settings saved successfully.');
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Settings</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Configure your workspace and notification preferences.</h1>
          </div>
          <button
            type="submit"
            form="settings-form"
            className="rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Save changes
          </button>
        </div>
        <form id="settings-form" className="mt-8 grid gap-6 lg:grid-cols-2" onSubmit={handleSave}>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Workspace</h2>
            <div className="mt-4 space-y-4 text-slate-300">
              <label className="block space-y-2 text-sm">
                <span>Name</span>
                <input
                  value={form.workspaceName}
                  onChange={(event) => setForm((prev) => ({ ...prev, workspaceName: event.target.value }))}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span>Timezone</span>
                <select
                  value={form.timezone}
                  onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
                  className="w-full rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none"
                >
                  <option>UTC-5 Eastern Time</option>
                  <option>UTC+1 Central European</option>
                  <option>UTC+8 Singapore</option>
                </select>
              </label>
            </div>
          </div>
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Notifications</h2>
            <div className="mt-4 space-y-4 text-slate-300">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.invoiceReminders}
                  onChange={(event) => setForm((prev) => ({ ...prev, invoiceReminders: event.target.checked }))}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Invoice reminders</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.dueSoonAlerts}
                  onChange={(event) => setForm((prev) => ({ ...prev, dueSoonAlerts: event.target.checked }))}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Due soon alerts</span>
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.largeOverdueAlerts}
                  onChange={(event) => setForm((prev) => ({ ...prev, largeOverdueAlerts: event.target.checked }))}
                  className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                />
                <span>Large overdue alerts</span>
              </label>
            </div>
          </div>
        </form>
        {message && <p className="mt-6 rounded-3xl bg-slate-950/70 px-4 py-3 text-sm text-slate-200">{message}</p>}
      </section>
    </div>
  );
};

export default SettingsPage;
