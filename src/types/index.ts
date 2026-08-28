export type NavItem = {
  name: string;
  path: string;
};

export type InvoiceStatus =
  | 'Draft'
  | 'Sent'
  | 'Due Soon'
  | 'Overdue'
  | 'Partially Paid'
  | 'Paid'
  | 'Pending'
  | 'Shipped'
  | 'Delivered'
  | 'Canceled';

export type PriorityLabel = 'High' | 'Medium' | 'Low';

export type Invoice = {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: string | number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentDate?: string;
  notes?: string;
  priority?: PriorityLabel;
  priorityReason?: string;
  contacted?: boolean;
  followUpOn?: string;
  // compatibility helpers
  customer?: string;
  date?: string;
};

export type Customer = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalOutstanding?: string;
  totalOverdue?: string;
  outstanding?: number | string;
  overdue?: number | string;
  averageDaysToPay?: number;
  reliability: 'Excellent' | 'Good' | 'Fair' | 'Needs improvement';
  paymentHistory?: Array<{
    invoiceNumber: string;
    paidDate: string;
    amount: string;
    status: InvoiceStatus;
  }>;
  // legacy compatibility fields
  stock?: number;
  status?: 'In stock' | 'Low stock' | 'Out of stock';
};

export type NotificationItem = {
  id: string;
  type: 'Invoice overdue' | 'Large invoice overdue' | 'Customer pays late' | 'Invoice due soon' | 'Follow-up required';
  title: string;
  message: string;
  date: string;
  actionRequired: boolean;
  invoiceId?: string;
  customerId?: string;
  // legacy compatibility fields
  destination?: string;
  carrier?: string;
  eta?: string;
  status?: InvoiceStatus | 'In transit' | 'Delivered' | 'Delayed' | 'Awaiting pickup';
};

export type CustomerInsights = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  totalOutstanding: string;
  totalOverdue: string;
  averageDaysToPay: number;
  reliability: 'Excellent' | 'Good' | 'Fair' | 'Needs improvement';
  paymentHistory: Array<{
    invoiceNumber: string;
    paidDate: string;
    amount: string;
    status: InvoiceStatus;
  }>;
  totalInvoices: number;
  outstandingBalance: string;
  overdueBalance: string;
  paidAmount: string;
  averagePaymentDelay: number;
  repeatLatePayer: boolean;
  riskScore: 'Low' | 'Medium' | 'High';
};

export type AlertItem = {
  id: string;
  category: 'invoice' | 'customer' | 'system';
  title: string;
  message: string;
  targetPath: string;
  badge: string;
  actionRequired?: boolean;
  invoiceId?: string;
  customerId?: string;
  date?: string;
};

export type ForecastSnapshot = {
  expected7: number;
  expected14: number;
  expected30: number;
  overdueAtRisk: number;
};

export type AgingBucket = {
  label: string;
  total: string;
  count: number;
};

export type CashFlowForecast = {
  expectedIncoming: string;
  atRisk: string;
  overdue: string;
  upcomingPayments: string;
};

export type Metric = {
  label: string;
  value: string;
  change: string;
};

export type Settings = {
  workspaceName: string;
  timezone: string;
  invoiceReminders: boolean;
  dueSoonAlerts: boolean;
  largeOverdueAlerts: boolean;
  orderAlerts?: boolean;
  inventoryWarnings?: boolean;
  shippingUpdates?: boolean;
};

export type User = {
  name: string;
  email: string;
};

export type AssistantMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type LegacyOrder = {
  id: string;
  customer: string;
  date: string;
  status: InvoiceStatus;
  amount: string;
};

export type LegacyInventoryItem = {
  id: string;
  name: string;
  stock: number;
  status: 'In stock' | 'Low stock' | 'Out of stock';
};

export type LegacyShippingItem = {
  id: string;
  destination: string;
  carrier: string;
  eta: string;
  status: 'In transit' | 'Delivered' | 'Delayed' | 'Awaiting pickup';
};

// Compatibility aliases for legacy page types.
export type Order = LegacyOrder & Partial<Invoice>;
export type InventoryItem = LegacyInventoryItem & Partial<Customer>;
export type ShippingItem = LegacyShippingItem & Partial<NotificationItem>;