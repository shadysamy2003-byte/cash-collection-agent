import { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

const SETTINGS_STORAGE_KEY = 'orderflow_app_settings_v1';

export const currencySymbols: Record<string, string> = {
  'USD ($)': '$',
  'EUR (€)': '€',
  'GBP (£)': '£',
  'SAR (﷼)': 'SAR ',
  'AED (د.إ)': 'AED ',
  'EGP (ج.م)': 'EGP '
};

const SettingsPage = () => {
  const { settings, updateSettings } = useAppData();

  const [form, setForm] = useState(() => {
    try {
      const localSaved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (localSaved) {
        return JSON.parse(localSaved);
      }
    } catch {
      // ignore
    }
    return {
      workspaceName: settings?.workspaceName || 'Cash Collection Agent',
      timezone: settings?.timezone || 'UTC-5 Eastern Time',
      currency: (settings as any)?.currency || 'USD ($)',
      notificationEmail: (settings as any)?.notificationEmail || 'karim.adel@orderflow.tech',
      largeInvoiceThreshold: (settings as any)?.largeInvoiceThreshold || '5000',
      invoiceReminders: settings?.invoiceReminders ?? true,
      dueSoonAlerts: settings?.dueSoonAlerts ?? true,
      largeOverdueAlerts: settings?.largeOverdueAlerts ?? true,
    };
  });

  const [message, setMessage] = useState('');

  // استرجاع الإعدادات المحفوظة عند فتح الصفحة
  useEffect(() => {
    try {
      const localSaved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (localSaved) {
        setForm(JSON.parse(localSaved));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 1. حفظ الإعدادات في Context
    updateSettings(form as any);

    // 2. الحفظ الثابت في LocalStorage
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(form));
      localStorage.setItem('orderflow_active_currency', form.currency);
      // إطلاق حدث تحديث لكل الصفحات
      window.dispatchEvent(new Event('orderflow_currency_updated'));
    } catch {
      // ignore
    }

    setMessage('Settings saved successfully. Active currency updated across workspace.');
    setTimeout(() => setMessage(''), 4000);
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
            className="rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Save changes
          </button>
        </div>

        <form id="settings-form" className="mt-8 grid gap-6 lg:grid-cols-2" onSubmit={handleSave}>
          {/* Workspace Settings */}
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Workspace Details</h2>
            <p className="mt-1 text-xs text-slate-400">Manage basic company and regional parameters.</p>

            <div className="mt-5 space-y-4 text-slate-300">
              <label className="block space-y-2 text-sm">
                <span>Workspace Name</span>
                <input
                  value={form.workspaceName}
                  onChange={(event) => setForm((prev: any) => ({ ...prev, workspaceName: event.target.value }))}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none transition focus:border-brand-500"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2 text-sm">
                  <span>Default Currency</span>
                  <select
                    value={form.currency}
                    onChange={(event) => setForm((prev: any) => ({ ...prev, currency: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="SAR (﷼)">SAR (﷼)</option>
                    <option value="AED (د.إ)">AED (د.إ)</option>
                    <option value="EGP (ج.م)">EGP (ج.م)</option>
                  </select>
                </label>

                <label className="block space-y-2 text-sm">
                  <span>Timezone</span>
                  <select
                    value={form.timezone}
                    onChange={(event) => setForm((prev: any) => ({ ...prev, timezone: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500"
                  >
                    <option>UTC-5 Eastern Time</option>
                    <option>UTC+1 Central European</option>
                    <option>UTC+2 Eastern European / Cairo</option>
                    <option>UTC+4 Gulf Standard</option>
                    <option>UTC+8 Singapore</option>
                  </select>
                </label>
              </div>

              <label className="block space-y-2 text-sm">
                <span>Large Overdue Alert Threshold</span>
                <input
                  type="number"
                  value={form.largeInvoiceThreshold}
                  onChange={(event) => setForm((prev: any) => ({ ...prev, largeInvoiceThreshold: event.target.value }))}
                  placeholder="5000"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none transition focus:border-brand-500"
                />
              </label>
            </div>
          </div>

          {/* Notifications Settings */}
          <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/80 p-6">
            <h2 className="text-lg font-semibold text-white">Notifications & Alerts</h2>
            <p className="mt-1 text-xs text-slate-400">Choose how and where collection alerts are delivered.</p>

            <div className="mt-5 space-y-5 text-slate-300">
              <label className="block space-y-2 text-sm">
                <span>Notification Email</span>
                <input
                  type="email"
                  value={form.notificationEmail}
                  onChange={(event) => setForm((prev: any) => ({ ...prev, notificationEmail: event.target.value }))}
                  placeholder="alerts@yourdomain.com"
                  className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none transition focus:border-brand-500"
                />
              </label>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.invoiceReminders}
                    onChange={(event) => setForm((prev: any) => ({ ...prev, invoiceReminders: event.target.checked }))}
                    className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Invoice reminders</p>
                    <p className="text-xs text-slate-400">Send recurring notices for uncollected payments.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.dueSoonAlerts}
                    onChange={(event) => setForm((prev: any) => ({ ...prev, dueSoonAlerts: event.target.checked }))}
                    className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Due soon alerts</p>
                    <p className="text-xs text-slate-400">Get early notifications 48h before due dates.</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.largeOverdueAlerts}
                    onChange={(event) => setForm((prev: any) => ({ ...prev, largeOverdueAlerts: event.target.checked }))}
                    className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-white">Large overdue alerts</p>
                    <p className="text-xs text-slate-400">Prioritize notices for amounts exceeding your threshold.</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </form>

        {message && (
          <p className="mt-6 inline-flex rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-300">
            {message}
          </p>
        )}
      </section>
    </div>
  );
};

export default SettingsPage;