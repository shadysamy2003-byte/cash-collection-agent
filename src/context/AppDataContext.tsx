import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { AssistantMessage, Customer, Invoice, NotificationItem, Settings, User } from '../types';
import { Toast, ToastMessage } from '../components/Toast';

const SETTINGS_STORAGE_KEY = 'orderflow_app_settings_v1';

export const currencySymbols: Record<string, string> = {
  'USD ($)': '$',
  'EUR (€)': '€',
  'GBP (£)': '£',
  'SAR (﷼)': 'SAR ',
  'AED (د.إ)': 'AED ',
  'EGP (ج.م)': 'ج.م ',
};

// أسعار الصرف الحالية مقارنة بالدولار الأمريكي (العملة الأساسية المخزنة)
const exchangeRates: Record<string, number> = {
  'USD ($)': 1,
  'EUR (€)': 0.92,
  'GBP (£)': 0.79,
  'SAR (﷼)': 3.75,
  'AED (د.إ)': 3.67,
  'EGP (ج.م)': 48.50,
};

export const parseCurrency = (value: string | number | unknown) => {
  if (typeof value === 'number') return Number.isNaN(value) ? 0 : value;
  if (typeof value === 'string') return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
  return 0;
};

const getToday = () => new Date().toISOString().slice(0, 10);

const diffDays = (dateString: string, reference = getToday()) => {
  if (!dateString) return 0;
  const target = new Date(`${dateString}T00:00:00`);
  const current = new Date(`${reference}T00:00:00`);
  return Math.floor((current.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
};

export type ExtendedUser = User & {
  createdAt?: string;
  trialDaysLeft?: number;
  isTrialExpired?: boolean;
  hasActiveSubscription?: boolean;
};

export type AppDataContextValue = {
  user: ExtendedUser | null;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  orders: Invoice[];
  inventory: Customer[];
  shipping: NotificationItem[];
  assistantMessages: AssistantMessage[];
  settings: Settings;
  formatCurrency: (amountInUSD: number, historicalRate?: number) => string;
  currencySymbol: string;
  metrics: {
    revenue: number;
    costs: number;
    profit: number;
    profitMargin: number;
    openOrders: number;
    inventoryHealth: number;
    shippingOnTime: number;
    outstanding: number;
    overdue: number;
    dueSoon: number;
    collectedThisMonth: number;
    collectionRate: number;
    overdueCount: number;
    cashFlowRisk: number;
  };
  customerInsights: Array<any>;
  alerts: Array<any>;
  forecastData: any;
  reportData: any;
  queryAssistant: (query: string) => string;
  addOrder: (order: Omit<Invoice, 'id'>) => Promise<void>;
  updateOrder: (order: Invoice) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Invoice['status']) => Promise<void>;
  addInventoryItem: (item: Omit<Customer, 'id'>) => Promise<void>;
  updateInventoryItem: (item: Customer & { id: string }) => Promise<void>;
  deleteInventoryItem: (itemId: string) => Promise<void>;
  addShippingItem: (item: Omit<NotificationItem, 'id'>) => Promise<void>;
  updateShippingItem: (item: NotificationItem) => Promise<void>;
  updateShippingStatus: (itemId: string, status: NotificationItem['status']) => Promise<void>;
  addAssistantMessage: (message: AssistantMessage) => void;
  resetAssistant: () => void;
  updateSettings: (settings: Settings) => void;
};

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [rawInvoices, setRawInvoices] = useState<any[]>([]);
  const [rawCustomers, setRawCustomers] = useState<any[]>([]);
  const [shipping, setShipping] = useState<NotificationItem[]>([]);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([]);
  
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      workspaceName: 'Cash Collection Agent',
      timezone: 'UTC-5 Eastern Time',
      currency: 'USD ($)',
      notificationEmail: 'karim.adel@orderflow.tech',
      largeInvoiceThreshold: '5000',
      invoiceReminders: true,
      dueSoonAlerts: true,
      largeOverdueAlerts: true,
    } as any;
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const activeCurrencyKey = (settings as any)?.currency || 'USD ($)';
  const currencySymbol = currencySymbols[activeCurrencyKey] || '$';
  const currentExchangeRate = exchangeRates[activeCurrencyKey] || 1;

  // دالة تنسيق المبلغ مع دعم سعر الصرف التاريخي أو الحالي
  const formatCurrency = useMemo(() => {
    return (amountInUSD: number, historicalRate?: number) => {
      const rate = historicalRate !== undefined && historicalRate !== null ? historicalRate : currentExchangeRate;
      const converted = (amountInUSD || 0) * rate;
      const formatted = converted.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return `${currencySymbol}${formatted}`;
    };
  }, [currencySymbol, currentExchangeRate]);

  useEffect(() => {
    const syncSettings = () => {
      try {
        const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (saved) setSettings(JSON.parse(saved));
      } catch {
        // ignore
      }
    };
    window.addEventListener('orderflow_currency_updated', syncSettings);
    window.addEventListener('storage', syncSettings);
    return () => {
      window.removeEventListener('orderflow_currency_updated', syncSettings);
      window.removeEventListener('storage', syncSettings);
    };
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      return;
    }

    const createdAt = authUser.created_at || new Date().toISOString();
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - createdDate.getTime();
    const daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const trialDaysLeft = Math.max(0, 7 - daysPassed);
    const isTrialExpired = daysPassed >= 7;
    const hasActiveSubscription = Boolean(authUser.user_metadata?.subscribed);

    setUser({
      name: authUser.user_metadata?.name || authUser.email || 'User',
      email: authUser.email || '',
      createdAt,
      trialDaysLeft,
      isTrialExpired,
      hasActiveSubscription,
    });

    const [invRes, custRes, shipRes] = await Promise.all([
      supabase.from('invoices').select('*').eq('user_id', authUser.id),
      supabase.from('customers').select('*').eq('user_id', authUser.id),
      supabase.from('notifications').select('*').eq('user_id', authUser.id),
    ]);

    if (custRes.data) setRawCustomers(custRes.data);
    if (invRes.data) setRawInvoices(invRes.data);
    if (shipRes.data) setShipping(shipRes.data);
  };

  useEffect(() => {
    fetchData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchData();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const inventory: Customer[] = useMemo(() => {
    return rawCustomers.map((db) => ({
      id: db.id,
      name: db.name || '',
      company: db.company || '',
      email: db.email || '',
      phone: db.phone || '',
      outstanding: db.outstanding !== undefined ? db.outstanding : 0,
      overdue: db.overdue !== undefined ? db.overdue : 0,
      totalOutstanding: formatCurrency(Number(db.outstanding) || 0),
      totalOverdue: formatCurrency(Number(db.overdue) || 0),
      averageDaysToPay: db.average_days_to_pay !== undefined ? db.average_days_to_pay : 0,
      reliability: db.reliability || 'Good',
      paymentHistory: db.payment_history || [],
    }));
  }, [rawCustomers, formatCurrency]);

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    inventory.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [inventory]);

  // توليد الفواتير مع حساب سعر الصرف التاريخي المحفوظ في قاعدة البيانات
  const orders: Invoice[] = useMemo(() => {
    return rawInvoices.map((db) => {
      const custId = db.customer_id || db.customerId || '';
      const historicalRate = db.exchange_rate !== undefined && db.exchange_rate !== null ? Number(db.exchange_rate) : currentExchangeRate;
      const baseAmountUSD = Number(db.amount) || 0;

      return {
        id: db.id,
        invoiceNumber: db.invoice_number || db.invoiceNumber || '',
        customerId: custId,
        customerName: db.customer_name || customerMap.get(custId) || 'Unknown Customer',
        amount: formatCurrency(baseAmountUSD, historicalRate),
        issueDate: db.issue_date || db.issueDate || '',
        dueDate: db.due_date || db.dueDate || '',
        status: db.status || 'Sent',
        paymentDate: db.payment_date || db.paymentDate || undefined,
        notes: db.notes || '',
        priority: db.priority || 'Medium',
        priorityReason: db.priority_reason || db.priorityReason || '',
        contacted: db.contacted ?? false,
        followUpOn: db.follow_up_on || db.followUpOn || undefined,
      };
    });
  }, [rawInvoices, customerMap, formatCurrency, currentExchangeRate]);

  const signup = async (name: string, email: string, password: string) => {
    if (!name.trim() || !email.trim() || !password) {
      return { success: false, message: 'All fields are required.' };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) return { success: false, message: error.message };
    return { success: true, message: 'Account created successfully. Please check your email or sign in.' };
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, message: error.message };
    await fetchData();
    return { success: true, message: 'Signed in successfully.' };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRawInvoices([]);
    setRawCustomers([]);
    setShipping([]);
  };

  const metrics = useMemo(() => {
    const unpaidInvoices = orders.filter((invoice) => invoice.status !== 'Paid');
    const outstanding = unpaidInvoices.reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const overdue = unpaidInvoices.filter((invoice) => invoice.status === 'Overdue').reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const dueSoon = unpaidInvoices.filter((invoice) => invoice.status === 'Due Soon').reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const collectedThisMonth = orders.filter((invoice) => {
      if (!invoice.paymentDate) return false;
      const paid = new Date(`${invoice.paymentDate}T00:00:00`);
      return paid.getMonth() === currentMonth && paid.getFullYear() === currentYear;
    }).reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const collectionRate = outstanding === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((outstanding - overdue) / outstanding) * 100)));
    const overdueCount = unpaidInvoices.filter((invoice) => invoice.status === 'Overdue').length;
    const cashFlowRisk = Math.min(100, Math.round((overdue / Math.max(outstanding, 1)) * 120));
    const revenue = orders.reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const costs = 0;
    const profit = revenue - costs;
    const openOrders = unpaidInvoices.filter((invoice) => invoice.status === 'Sent' || invoice.status === 'Due Soon').length;
    const inventoryHealth = inventory.length === 0 ? 0 : Math.round((inventory.filter((item) => item.reliability === 'Excellent' || item.reliability === 'Good').length / inventory.length) * 100);
    const shippingOnTime = shipping.length === 0 ? 0 : Math.round((shipping.filter((item) => item.type !== 'Invoice overdue' && item.type !== 'Large invoice overdue').length / shipping.length) * 100);
    return {
      outstanding,
      overdue,
      dueSoon,
      collectedThisMonth,
      collectionRate,
      overdueCount,
      cashFlowRisk,
      revenue,
      costs,
      profit,
      profitMargin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0,
      openOrders,
      inventoryHealth,
      shippingOnTime,
    };
  }, [orders, inventory, shipping]);

  const customerInsights = useMemo(() => {
    return inventory.map((customer) => {
      const customerInvoices = orders.filter((invoice) => invoice.customerId === customer.id);
      const totalInvoices = customerInvoices.length;
      const outstandingBalance = customerInvoices
        .filter((invoice) => invoice.status !== 'Paid')
        .reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
      const overdueBalance = customerInvoices
        .filter((invoice) => invoice.status === 'Overdue')
        .reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
      const paidAmount = customerInvoices
        .filter((invoice) => invoice.status === 'Paid')
        .reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
      const paidInvoices = customerInvoices.filter((invoice) => invoice.status === 'Paid' && invoice.paymentDate);
      const averagePaymentDelay = paidInvoices.length
        ? Math.round(
            paidInvoices.reduce((total, invoice) => {
              const delay = invoice.paymentDate ? diffDays(invoice.paymentDate, invoice.issueDate) : 0;
              return total + Math.max(0, delay);
            }, 0) / paidInvoices.length
          )
        : 0;
      const lateInvoices = customerInvoices.filter((invoice) => invoice.status === 'Overdue' || invoice.status === 'Due Soon');
      const repeatLatePayer = lateInvoices.length > 1;
      const riskScore =
        outstandingBalance <= 0
          ? 'Low'
          : customer.reliability === 'Needs improvement' || overdueBalance > (3000 * currentExchangeRate) || repeatLatePayer
            ? 'High'
            : customer.reliability === 'Fair' || overdueBalance > (1000 * currentExchangeRate)
              ? 'Medium'
              : 'Low';

      return {
        id: customer.id,
        name: customer.name,
        company: customer.company,
        email: customer.email,
        phone: customer.phone,
        totalInvoices,
        outstandingBalance: formatCurrency(outstandingBalance / currentExchangeRate),
        overdueBalance: formatCurrency(overdueBalance / currentExchangeRate),
        paidAmount: formatCurrency(paidAmount / currentExchangeRate),
        averagePaymentDelay,
        repeatLatePayer,
        riskScore: riskScore as 'High' | 'Medium' | 'Low',
        reliability: customer.reliability,
        paymentHistory: customer.paymentHistory,
      };
    });
  }, [orders, inventory, formatCurrency, currentExchangeRate]);

  const forecastData = useMemo(() => {
    const today = getToday();
    const upcoming = orders.filter((invoice) => invoice.status !== 'Paid');
    const expected7 = upcoming
      .filter((invoice) => {
        const diff = diffDays(invoice.dueDate, today);
        return diff >= 0 && diff <= 7;
      })
      .reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const expected14 = upcoming
      .filter((invoice) => {
        const diff = diffDays(invoice.dueDate, today);
        return diff >= 0 && diff <= 14;
      })
      .reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const expected30 = upcoming
      .filter((invoice) => {
        const diff = diffDays(invoice.dueDate, today);
        return diff >= 0 && diff <= 30;
      })
      .reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);
    const overdueAtRisk = upcoming
      .filter((invoice) => invoice.status === 'Overdue')
      .reduce((total, invoice) => total + parseCurrency(invoice.amount), 0);

    return { expected7, expected14, expected30, overdueAtRisk };
  }, [orders]);

  const reportData = useMemo(() => {
    const today = getToday();
    const unpaidInvoices = orders.filter((invoice) => invoice.status !== 'Paid');
    const outstandingReceivables = unpaidInvoices.reduce((amount, invoice) => amount + parseCurrency(invoice.amount), 0);
    const overdueReceivables = unpaidInvoices.filter((invoice) => invoice.status === 'Overdue').reduce((amount, invoice) => amount + parseCurrency(invoice.amount), 0);
    const paidInvoices = orders.filter((invoice) => invoice.status === 'Paid' && invoice.paymentDate);
    const averageDaysToPayment = paidInvoices.length
      ? Math.round(
          paidInvoices.reduce((total, invoice) => {
            const delay = invoice.paymentDate ? diffDays(invoice.paymentDate, invoice.issueDate) : 0;
            return total + Math.max(0, delay);
          }, 0) / paidInvoices.length
        )
      : 0;
    const collectionRate = outstandingReceivables === 0 ? 100 : Math.max(0, Math.min(100, Math.round(((outstandingReceivables - overdueReceivables) / outstandingReceivables) * 100)));
    const aging = [
      { label: 'Not due', total: formatCurrency(unpaidInvoices.filter((invoice) => diffDays(invoice.dueDate, today) < 0).reduce((total, invoice) => total + parseCurrency(invoice.amount), 0) / currentExchangeRate), count: unpaidInvoices.filter((invoice) => diffDays(invoice.dueDate, today) < 0).length },
      { label: '1-30 days overdue', total: formatCurrency(unpaidInvoices.filter((invoice) => { const diff = diffDays(invoice.dueDate, today); return diff >= 1 && diff <= 30; }).reduce((total, invoice) => total + parseCurrency(invoice.amount), 0) / currentExchangeRate), count: unpaidInvoices.filter((invoice) => { const diff = diffDays(invoice.dueDate, today); return diff >= 1 && diff <= 30; }).length },
      { label: '31-60 days overdue', total: formatCurrency(unpaidInvoices.filter((invoice) => { const diff = diffDays(invoice.dueDate, today); return diff >= 31 && diff <= 60; }).reduce((total, invoice) => total + parseCurrency(invoice.amount), 0) / currentExchangeRate), count: unpaidInvoices.filter((invoice) => { const diff = diffDays(invoice.dueDate, today); return diff >= 31 && diff <= 60; }).length },
      { label: '61+ days overdue', total: formatCurrency(unpaidInvoices.filter((invoice) => diffDays(invoice.dueDate, today) >= 61).reduce((total, invoice) => total + parseCurrency(invoice.amount), 0) / currentExchangeRate), count: unpaidInvoices.filter((invoice) => diffDays(invoice.dueDate, today) >= 61).length },
    ];
    const overdueByCustomer = orders.reduce<Record<string, { customerName: string; overdueAmount: number; overdueCount: number }>>((acc, invoice) => {
      if (invoice.status !== 'Overdue') return acc;
      const key = invoice.customerId;
      acc[key] = acc[key] || { customerName: invoice.customerName, overdueAmount: 0, overdueCount: 0 };
      acc[key].overdueAmount += parseCurrency(invoice.amount);
      acc[key].overdueCount += 1;
      return acc;
    }, {});
    const topOverdueCustomers = Object.values(overdueByCustomer)
      .sort((a, b) => b.overdueAmount - a.overdueAmount)
      .slice(0, 5)
      .map((item) => ({ customerName: item.customerName, overdueAmount: formatCurrency(item.overdueAmount / currentExchangeRate), overdueCount: item.overdueCount }));

    return {
      collectionRate,
      averageDaysToPayment,
      outstandingReceivables,
      overdueReceivables,
      expected7: forecastData.expected7,
      expected14: forecastData.expected14,
      expected30: forecastData.expected30,
      aging,
      topOverdueCustomers,
    };
  }, [forecastData, orders, formatCurrency, currentExchangeRate]);

  const getAlerts = () => {
    const today = getToday();
    const overdueInvoices = orders.filter((invoice) => invoice.status === 'Overdue');
    const dueSoonInvoices = orders.filter((invoice) => invoice.status === 'Due Soon');
    const highRiskCustomers = customerInsights.filter((customer) => customer.riskScore === 'High');
    const alerts: Array<any> = [];

    overdueInvoices.slice(0, 3).forEach((invoice) => {
      alerts.push({
        id: `alert-invoice-${invoice.id}`,
        category: 'invoice',
        title: `Overdue invoice ${invoice.invoiceNumber}`,
        message: `${invoice.customerName} has an overdue balance of ${invoice.amount}.`,
        targetPath: `/invoices`,
        badge: 'Overdue',
        actionRequired: true,
        invoiceId: invoice.id,
        customerId: invoice.customerId,
        date: today,
      });
    });

    if (dueSoonInvoices.length > 0) {
      alerts.push({
        id: 'alert-due-soon',
        category: 'invoice',
        title: `${dueSoonInvoices.length} invoices due soon`,
        message: `Review invoices due within the next week to avoid overdue risk.`,
        targetPath: '/invoices',
        badge: 'Due soon',
        actionRequired: true,
        date: today,
      });
    }

    highRiskCustomers.slice(0, 3).forEach((customer) => {
      alerts.push({
        id: `alert-customer-${customer.id}`,
        category: 'customer',
        title: `High-risk customer ${customer.name}`,
        message: `${customer.name} has a high risk score and overdue balance ${customer.overdueBalance}.`,
        targetPath: '/customers',
        badge: 'High risk',
        actionRequired: true,
        customerId: customer.id,
        date: today,
      });
    });

    return alerts;
  };

  const queryAssistant = (query: string) => {
    const normalized = query.trim().toLowerCase().replace(/[-_]+/g, ' ').replace(/[.?!,]/g, '');
    const overdueInvoices = orders.filter((invoice) => invoice.status === 'Overdue');
    const topRisk = customerInsights.filter((customer) => customer.riskScore === 'High').slice(0, 3);

    if (normalized.includes('summarize overdue') || normalized.includes('overdue exposure') || normalized.includes('overdue')) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + parseCurrency(inv.amount), 0);
      return totalOverdue > 0 ? `Rule-based insight: total overdue exposure is ${formatCurrency(totalOverdue / currentExchangeRate)} across ${overdueInvoices.length} invoice(s).` : 'Rule-based insight: there is no overdue exposure right now.';
    }
    if (normalized.includes('highest risk')) {
      return topRisk.length ? `Rule-based insight: highest risk customers are ${topRisk.map((customer) => `${customer.name} (${customer.riskScore})`).join(', ')}.` : 'Rule-based insight: no customers currently flagged as high risk.';
    }
    if (normalized.includes('forecast') || normalized.includes('cash flow') || normalized.includes('explain')) {
      return `Rule-based insight: 30-day cash flow forecast projects ${formatCurrency(forecastData.expected30 / currentExchangeRate)} in incoming collections.`;
    }
    return 'Rule-based insight: ask about highest risk customers, invoices due today, or cash expected in the next 30 days.';
  };

  // حفظ الفاتورة مع تثبيت سعر الصرف التاريخي وقت الإنشاء
  const addOrder = async (order: Omit<Invoice, 'id'>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      showToast('You must be logged in to create an invoice.', 'error');
      return;
    }

    let finalCustomerId: string | null = order.customerId;
    const existingCustomer = inventory.find((c) => c.id === order.customerId);

    if (!existingCustomer && order.customerId) {
      finalCustomerId = order.customerId;
    }

    const inputAmount = parseCurrency(order.amount);
    const baseAmountUSD = inputAmount / currentExchangeRate;

    const payload: any = {
      user_id: authUser.id,
      invoice_number: order.invoiceNumber,
      amount: baseAmountUSD,
      exchange_rate: currentExchangeRate, // تثبيت سعر الصرف التاريخي
      issue_date: order.issueDate,
      due_date: order.dueDate,
      status: order.status,
      notes: order.notes || '',
    };

    if (finalCustomerId) payload.customer_id = finalCustomerId;
    if (order.paymentDate) payload.payment_date = order.paymentDate;

    const { error } = await supabase.from('invoices').insert([payload]);
    if (error) {
      showToast(error.message || 'Error adding invoice', 'error');
    } else {
      showToast('Invoice created successfully with historical exchange rate', 'success');
      await fetchData();
    }
  };

  const updateOrder = async (order: Invoice) => {
    const paymentDate = order.status === 'Paid' ? (order.paymentDate || getToday()) : null;
    const inputAmount = parseCurrency(order.amount);
    const baseAmountUSD = inputAmount / currentExchangeRate;

    const payload: any = {
      amount: baseAmountUSD,
      status: order.status,
      payment_date: paymentDate,
    };
    if (order.notes !== undefined) payload.notes = order.notes;

    const { error } = await supabase.from('invoices').update(payload).eq('id', order.id);
    if (error) {
      showToast(error.message || 'Error updating invoice', 'error');
    } else {
      showToast('Invoice updated successfully', 'success');
      await fetchData();
    }
  };

  const deleteOrder = async (orderId: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', orderId);
    if (error) {
      showToast(error.message || 'Error deleting invoice', 'error');
    } else {
      showToast('Invoice deleted successfully', 'info');
      await fetchData();
    }
  };

  const updateOrderStatus = async (orderId: string, status: Invoice['status']) => {
    const paymentDate = status === 'Paid' ? getToday() : null;
    const { error } = await supabase.from('invoices').update({ 
      status, 
      payment_date: paymentDate 
    }).eq('id', orderId);
    if (error) {
      showToast(error.message || 'Error updating status', 'error');
    } else {
      showToast(`Invoice marked as ${status}`, 'success');
      await fetchData();
    }
  };

  const addInventoryItem = async (item: Omit<Customer, 'id'>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;
    const payload = {
      user_id: authUser.id,
      name: item.name,
      company: item.company,
      email: item.email,
      phone: item.phone,
      outstanding: item.outstanding ? Number(item.outstanding) / currentExchangeRate : 0,
      overdue: item.overdue ? Number(item.overdue) / currentExchangeRate : 0,
      average_days_to_pay: item.averageDaysToPay ? Number(item.averageDaysToPay) : 0,
      reliability: item.reliability,
    };
    const { error } = await supabase.from('customers').insert([payload]);
    if (error) {
      showToast(error.message || 'Error adding customer', 'error');
    } else {
      showToast('Customer added successfully', 'success');
      await fetchData();
    }
  };

  const updateInventoryItem = async (item: Customer & { id: string }) => {
    const payload = {
      name: item.name,
      company: item.company,
      email: item.email,
      phone: item.phone,
      outstanding: item.outstanding ? Number(item.outstanding) / currentExchangeRate : 0,
      overdue: item.overdue ? Number(item.overdue) / currentExchangeRate : 0,
      average_days_to_pay: item.averageDaysToPay ? Number(item.averageDaysToPay) : 0,
      reliability: item.reliability,
    };
    const { error } = await supabase.from('customers').update(payload).eq('id', item.id);
    if (error) {
      showToast(error.message || 'Error updating customer', 'error');
    } else {
      showToast('Customer updated successfully', 'success');
      await fetchData();
    }
  };

  const deleteInventoryItem = async (itemId: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', itemId);
    if (error) {
      showToast(error.message || 'Error deleting customer', 'error');
    } else {
      showToast('Customer deleted successfully', 'info');
      await fetchData();
    }
  };

  const addShippingItem = async (item: Omit<NotificationItem, 'id'>) => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const payload: any = {
      user_id: authUser.id,
      title: item.title,
      type: item.type || 'Invoice overdue',
      status: item.status || 'Pending',
      date: item.date || getToday(),
      action_required: (item as any).actionRequired ?? true,
    };

    if ((item as any).message) payload.message = (item as any).message;
    if ((item as any).invoiceId) payload.invoice_id = (item as any).invoiceId;
    if ((item as any).customerId) payload.customer_id = (item as any).customerId;

    const { error } = await supabase.from('notifications').insert([payload]);
    if (error) {
      showToast(error.message || 'Error adding notification', 'error');
    } else {
      showToast('Action created successfully', 'success');
      await fetchData();
    }
  };

  const updateShippingItem = async (item: NotificationItem) => {
    const payload: any = {
      status: item.status,
    };
    const { error } = await supabase.from('notifications').update(payload).eq('id', item.id);
    if (error) {
      showToast(error.message || 'Error updating action', 'error');
    } else {
      await fetchData();
    }
  };

  const updateShippingStatus = async (itemId: string, status: NotificationItem['status']) => {
    const { error } = await supabase.from('notifications').update({ status }).eq('id', itemId);
    if (error) {
      showToast(error.message || 'Error updating status', 'error');
    } else {
      await fetchData();
    }
  };

  const addAssistantMessage = (message: AssistantMessage) => {
    setAssistantMessages((current) => [...current, message]);
  };

  const resetAssistant = () => setAssistantMessages([]);

  const updateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      window.dispatchEvent(new Event('orderflow_currency_updated'));
    } catch {
      // ignore
    }
  };

  const value = useMemo(
    () => ({
      user,
      signup,
      login,
      logout,
      orders,
      inventory,
      shipping,
      assistantMessages,
      settings,
      metrics,
      customerInsights,
      alerts: getAlerts(),
      forecastData,
      reportData,
      formatCurrency,
      currencySymbol,
      queryAssistant,
      addOrder,
      updateOrder,
      deleteOrder,
      updateOrderStatus,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      addShippingItem,
      updateShippingItem,
      updateShippingStatus,
      addAssistantMessage,
      resetAssistant,
      updateSettings,
    }),
    [assistantMessages, inventory, metrics, orders, shipping, settings, user, customerInsights, forecastData, reportData, formatCurrency, currencySymbol]
  );

  return (
    <AppDataContext.Provider value={value}>
      {children}
      <Toast toasts={toasts} onClose={removeToast} />
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
};