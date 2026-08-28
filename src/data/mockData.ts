import type { AssistantMessage, Customer, Invoice, NotificationItem, NavItem } from '../types';

export const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard' },
  { name: 'Invoices', path: '/invoices' },
  { name: 'Customers', path: '/customers' },
  { name: 'Collections', path: '/collections' },
  { name: 'Cash Flow', path: '/cash-flow' },
  { name: 'Reports', path: '/reports' },
  { name: 'Action Center', path: '/actions' },
  { name: 'AI Assistant', path: '/assistant' },
  { name: 'Settings', path: '/settings' },
  { name: 'Pricing', path: '/pricing' }
];

export const invoices: Invoice[] = [
  {
    id: 'INV-101',
    invoiceNumber: '1001',
    customerId: 'CUST-01',
    customerName: 'Arbor Supply Co.',
    amount: '$5,400.00',
    issueDate: '2026-07-01',
    dueDate: '2026-07-31',
    status: 'Overdue',
    paymentDate: '',
    notes: 'Second reminder sent last week.',
    priority: 'High',
    priorityReason: 'Large amount and 11 days overdue for a repeat late payer.',
    contacted: false,
    followUpOn: '2026-08-14'
  },
  {
    id: 'INV-102',
    invoiceNumber: '1002',
    customerId: 'CUST-02',
    customerName: 'Meridian Logistics',
    amount: '$2,100.00',
    issueDate: '2026-07-15',
    dueDate: '2026-08-14',
    status: 'Due Soon',
    paymentDate: '',
    notes: 'Reminder will send automatically two days before due date.',
    priority: 'Medium',
    priorityReason: 'Approaching due date with moderate risk profile.',
    contacted: false,
    followUpOn: '2026-08-13'
  },
  {
    id: 'INV-103',
    invoiceNumber: '1003',
    customerId: 'CUST-03',
    customerName: 'Vector Architects',
    amount: '$780.00',
    issueDate: '2026-07-20',
    dueDate: '2026-08-19',
    status: 'Sent',
    paymentDate: '',
    notes: 'Sent via portal. Awaiting payment.',
    priority: 'Low',
    priorityReason: 'On-time payer with a small outstanding amount.',
    contacted: false,
    followUpOn: ''
  },
  {
    id: 'INV-104',
    invoiceNumber: '1004',
    customerId: 'CUST-04',
    customerName: 'North Coast Media',
    amount: '$4,550.00',
    issueDate: '2026-07-05',
    dueDate: '2026-08-02',
    status: 'Overdue',
    paymentDate: '',
    notes: 'Invoice is overdue by 9 days. Customer has requested a payment plan.',
    priority: 'High',
    priorityReason: 'Large overdue balance from media contract.',
    contacted: true,
    followUpOn: '2026-08-15'
  },
  {
    id: 'INV-105',
    invoiceNumber: '1005',
    customerId: 'CUST-05',
    customerName: 'Harbor Consulting',
    amount: '$1,980.00',
    issueDate: '2026-07-29',
    dueDate: '2026-08-28',
    status: 'Sent',
    paymentDate: '',
    notes: 'Invoice issued after final project delivery.',
    priority: 'Low',
    priorityReason: 'New client with strong payment history.',
    contacted: false,
    followUpOn: ''
  },
  {
    id: 'INV-106',
    invoiceNumber: '1006',
    customerId: 'CUST-02',
    customerName: 'Meridian Logistics',
    amount: '$3,250.00',
    issueDate: '2026-07-22',
    dueDate: '2026-08-21',
    status: 'Due Soon',
    paymentDate: '',
    notes: 'Includes expedited logistics services.',
    priority: 'Medium',
    priorityReason: 'Repeat client with strong history, due in 10 days.',
    contacted: false,
    followUpOn: '2026-08-18'
  },
  {
    id: 'INV-107',
    invoiceNumber: '1007',
    customerId: 'CUST-06',
    customerName: 'Capstone Retail',
    amount: '$6,720.00',
    issueDate: '2026-06-30',
    dueDate: '2026-07-30',
    status: 'Overdue',
    paymentDate: '',
    notes: 'Urgent collect; customer has missed prior deadlines.',
    priority: 'High',
    priorityReason: 'High balance and repeat overdue behavior.',
    contacted: true,
    followUpOn: '2026-08-16'
  }
];

export const customers: Customer[] = [
  {
    id: 'CUST-01',
    name: 'Arbor Supply Co.',
    company: 'Arbor Supply Co.',
    email: 'accounting@arborsupply.com',
    phone: '+1 312 555 0192',
    totalOutstanding: '$5,400.00',
    totalOverdue: '$5,400.00',
    averageDaysToPay: 27,
    reliability: 'Needs improvement',
    paymentHistory: [
      { invoiceNumber: '0985', paidDate: '2026-06-24', amount: '$8,500.00', status: 'Paid' },
      { invoiceNumber: '0971', paidDate: '2026-05-29', amount: '$3,200.00', status: 'Paid' }
    ]
  },
  {
    id: 'CUST-02',
    name: 'Meridian Logistics',
    company: 'Meridian Logistics',
    email: 'billing@meridianlogistics.com',
    phone: '+1 415 555 0123',
    totalOutstanding: '$5,350.00',
    totalOverdue: '$0.00',
    averageDaysToPay: 14,
    reliability: 'Good',
    paymentHistory: [
      { invoiceNumber: '0999', paidDate: '2026-07-10', amount: '$4,200.00', status: 'Paid' },
      { invoiceNumber: '1008', paidDate: '2026-07-28', amount: '$2,900.00', status: 'Paid' }
    ]
  },
  {
    id: 'CUST-03',
    name: 'Vector Architects',
    company: 'Vector Architects',
    email: 'finance@vectorarch.com',
    phone: '+1 646 555 0147',
    totalOutstanding: '$780.00',
    totalOverdue: '$0.00',
    averageDaysToPay: 8,
    reliability: 'Excellent',
    paymentHistory: [
      { invoiceNumber: '1000', paidDate: '2026-07-30', amount: '$1,250.00', status: 'Paid' }
    ]
  },
  {
    id: 'CUST-04',
    name: 'North Coast Media',
    company: 'North Coast Media',
    email: 'payables@northcoastmedia.com',
    phone: '+1 206 555 0188',
    totalOutstanding: '$4,550.00',
    totalOverdue: '$4,550.00',
    averageDaysToPay: 32,
    reliability: 'Fair',
    paymentHistory: [
      { invoiceNumber: '0950', paidDate: '2026-06-10', amount: '$5,100.00', status: 'Paid' }
    ]
  },
  {
    id: 'CUST-05',
    name: 'Harbor Consulting',
    company: 'Harbor Consulting',
    email: 'finance@harborconsulting.com',
    phone: '+1 617 555 0177',
    totalOutstanding: '$1,980.00',
    totalOverdue: '$0.00',
    averageDaysToPay: 11,
    reliability: 'Good',
    paymentHistory: [
      { invoiceNumber: '1009', paidDate: '2026-08-01', amount: '$3,400.00', status: 'Paid' }
    ]
  },
  {
    id: 'CUST-06',
    name: 'Capstone Retail',
    company: 'Capstone Retail',
    email: 'accounts@capstoneretail.com',
    phone: '+1 312 555 0166',
    totalOutstanding: '$6,720.00',
    totalOverdue: '$6,720.00',
    averageDaysToPay: 38,
    reliability: 'Needs improvement',
    paymentHistory: [
      { invoiceNumber: '0945', paidDate: '2026-06-03', amount: '$7,200.00', status: 'Paid' }
    ]
  }
];

export const notifications: NotificationItem[] = [
  {
    id: 'NOT-01',
    type: 'Invoice overdue',
    title: 'Invoice INV-101 is overdue',
    message: 'Arbor Supply Co. has not paid INV-101, which is now 11 days past due.',
    date: '2026-08-11',
    actionRequired: true,
    invoiceId: 'INV-101',
    customerId: 'CUST-01'
  },
  {
    id: 'NOT-02',
    type: 'Invoice due soon',
    title: 'Invoice INV-102 is due soon',
    message: 'Meridian Logistics invoice INV-102 is due in 3 days.',
    date: '2026-08-11',
    actionRequired: true,
    invoiceId: 'INV-102',
    customerId: 'CUST-02'
  },
  {
    id: 'NOT-03',
    type: 'Large invoice overdue',
    title: 'Capstone Retail overdue amount',
    message: 'Capstone Retail still owes $6,720.00 for INV-1007, overdue by 10 days.',
    date: '2026-08-11',
    actionRequired: true,
    invoiceId: 'INV-107',
    customerId: 'CUST-06'
  },
  {
    id: 'NOT-04',
    type: 'Customer pays late',
    title: 'North Coast Media has slow payment history',
    message: 'North Coast Media averages 32 days to pay, and they have an overdue invoice pending.',
    date: '2026-08-11',
    actionRequired: true,
    customerId: 'CUST-04'
  }
];

export const assistantMessages: AssistantMessage[] = [
  { id: 'msg-1', role: 'assistant', content: 'I can help you prioritize overdue invoices and forecast incoming cash. Ask me anything about cash collection and risk.' }
];
