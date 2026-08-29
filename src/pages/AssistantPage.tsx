import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { EmptyState } from '../components/EmptyState';
import type { AssistantMessage } from '../types';

const parseAmount = (val: unknown): number => {
  if (typeof val === 'number') return Number.isNaN(val) ? 0 : val;
  if (typeof val === 'string') return Number(val.replace(/[^0-9.-]+/g, '')) || 0;
  return 0;
};

const formatCurrency = (val: number) =>
  `$${(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AssistantPage = () => {
  const {
    orders: invoices,
    inventory: customers,
    customerInsights,
    assistantMessages,
    addAssistantMessage,
    resetAssistant,
    queryAssistant
  } = useAppData();

  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const suggestions = [
    'Which invoices should I collect first?',
    'Show me the highest-risk customers.',
    'What payments are due soon?',
    'Summarize overdue exposure.',
    "Write a collection email for Apex",
    'Explain the 30-day cash flow forecast.'
  ];

  // Dynamic Financial Intelligence Engine
  const generateSmartResponse = (input: string): string => {
    const text = input.toLowerCase().trim();

    // 0. Support & Human Help Check
    if (
      text.includes('support') || 
      text.includes('help') || 
      text.includes('contact') || 
      text.includes('issue') || 
      text.includes('bug') || 
      text.includes('human') || 
      text.includes('problem') || 
      text.includes('مساعدة') || 
      text.includes('دعم') || 
      text.includes('مشكلة')
    ) {
      return `💬 Need direct assistance or found an issue?\n\nYou can reach our human support desk anytime at:\n✉️ cashcollectionsupport@gmail.com\n\nOur team actively reviews tickets and will resolve your inquiry promptly.`;
    }

    const overdueInvoices = invoices.filter((inv) => inv.status === 'Overdue');
    const dueSoonInvoices = invoices.filter((inv) => inv.status === 'Due Soon');
    const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + parseAmount(inv.amount), 0);
    const totalDueSoon = dueSoonInvoices.reduce((sum, inv) => sum + parseAmount(inv.amount), 0);
    const totalExpected30d = invoices
      .filter((inv) => inv.status !== 'Paid')
      .reduce((sum, inv) => sum + parseAmount(inv.amount), 0);

    const highRiskInsights = customerInsights.filter(
      (ins) => ins.riskScore === 'High' || ins.riskScore === 'Medium'
    );

    // 1. Email Generation Check
    if (text.includes('email') || text.includes('letter') || text.includes('draft') || text.includes('write') || text.includes('remind')) {
      const targetCustomer = customers.find((c) => text.includes(c.name.toLowerCase())) ||
        customers.find((c) => invoices.some((i) => i.customerId === c.id)) ||
        customers[0];

      const relatedInvoice = invoices.find((inv) =>
        (targetCustomer && inv.customerId === targetCustomer.id) ||
        text.includes(inv.invoiceNumber.toLowerCase())
      ) || invoices[0];

      const custName = targetCustomer ? targetCustomer.name : (relatedInvoice?.customerName || 'Valued Customer');
      const invNum = relatedInvoice ? relatedInvoice.invoiceNumber : 'INV-2026-001';
      const invAmt = relatedInvoice ? formatCurrency(parseAmount(relatedInvoice.amount)) : '$4,500.00';
      const invDue = relatedInvoice ? relatedInvoice.dueDate : 'recently';

      return `Subject: Urgent Notice: Outstanding Balance for Invoice ${invNum}\n\n` +
        `Dear ${custName} Accounting Team,\n\n` +
        `We are writing to follow up on the payment for invoice ${invNum} in the amount of ${invAmt}, which was due on ${invDue}.\n\n` +
        `To keep your account in good standing and avoid service interruptions, please confirm payment dispatch or process the remittance at your earliest convenience.\n\n` +
        `If payment has already been sent, please share the transaction reference so we can update your ledger.\n\n` +
        `Best regards,\nCollections & Finance Department`;
    }

    // 2. Overdue Exposure & Priorities
    if (text.includes('overdue') || text.includes('priority') || text.includes('first') || text.includes('collect')) {
      if (overdueInvoices.length === 0) {
        return `✅ Great news! You have no overdue invoices currently on the books. Total overdue exposure is $0.00.`;
      }
      const list = overdueInvoices
        .map((inv) => `• ${inv.invoiceNumber} (${inv.customerName}) — ${formatCurrency(parseAmount(inv.amount))} | Due: ${inv.dueDate}`)
        .join('\n');
      return `⚠️ Overdue Collection Priorities:\n\nTotal Overdue Exposure: ${formatCurrency(totalOverdue)} across ${overdueInvoices.length} invoice(s).\n\nImmediate Actions Required:\n${list}\n\nRecommendation: Prioritize high-exposure accounts and issue immediate formal follow-ups.`;
    }

    // 3. Cash Flow Forecast & 30 Days
    if (text.includes('cash') || text.includes('30') || text.includes('forecast') || text.includes('inflow') || text.includes('expect')) {
      return `📊 30-Day Cash Inflow Projection:\n\n` +
        `• Total Projected Receivables: ${formatCurrency(totalExpected30d)}\n` +
        `• Overdue Recoverables: ${formatCurrency(totalOverdue)}\n` +
        `• Upcoming Due (Next 7-30 Days): ${formatCurrency(totalDueSoon)}\n\n` +
        `Strategic Insight: Accelerating collections on overdue accounts will secure ${formatCurrency(totalOverdue)} in immediate liquidity.`;
    }

    // 4. High Risk Customers
    if (text.includes('risk') || text.includes('customer') || text.includes('highest')) {
      if (highRiskInsights.length === 0) {
        return `🛡️ All active customer accounts currently demonstrate Low Risk profiles with healthy payment records.`;
      }
      const list = highRiskInsights
        .map((ins) => `• ${ins.customerName || ins.name || 'Account'} — Risk Level: [${ins.riskScore}] | Trend: ${ins.paymentTrend || 'Delinquent'}`)
        .join('\n');
      return `🔍 Customer Risk Assessment:\n\n${list}\n\nActionable Advice: Restrict extended credit lines and enforce milestone or advance payments for High/Medium risk partners.`;
    }

    // 5. Due soon or Due today
    if (text.includes('soon') || text.includes('today') || text.includes('upcoming')) {
      if (dueSoonInvoices.length === 0) {
        return `📅 No immediate invoices due today or in the next few days. All accounts are up to date.`;
      }
      const list = dueSoonInvoices
        .map((inv) => `• ${inv.invoiceNumber} (${inv.customerName}) — ${formatCurrency(parseAmount(inv.amount))} | Due Date: ${inv.dueDate}`)
        .join('\n');
      return `⏰ Upcoming Due Invoices:\n\nTotal Due Soon: ${formatCurrency(totalDueSoon)}\n\n${list}\n\nRecommendation: Send friendly courtesy reminders 3 days before maturity.`;
    }

    // Fallback: try existing context query or provide structured operational overview
    const contextResult = queryAssistant ? queryAssistant(input) : '';
    if (contextResult && !contextResult.includes('Rule-based insight: ask about')) {
      return contextResult;
    }

    return `📋 Live Portfolio Summary:\n\n` +
      `• Total Unpaid Receivables: ${formatCurrency(totalExpected30d)}\n` +
      `• Overdue Amount: ${formatCurrency(totalOverdue)} (${overdueInvoices.length} invoices)\n` +
      `• Due Soon Amount: ${formatCurrency(totalDueSoon)} (${dueSoonInvoices.length} invoices)\n\n` +
      `You can ask me to:\n` +
      `1. Draft a collection email (e.g. "Write a collection email for Apex")\n` +
      `2. Analyze customer credit risks (e.g. "Who are high risk customers?")\n` +
      `3. Project incoming cash flows (e.g. "What is our 30-day forecast?")\n\n` +
      `💡 Need human support? Contact us at cashcollectionsupport@gmail.com`;
  };

  const handleQuickPrompt = (prompt: string) => {
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
    };
    addAssistantMessage(userMessage);

    const responseContent = generateSmartResponse(prompt);

    const response: AssistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: responseContent,
    };
    addAssistantMessage(response);
    setMessage('');
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!query.trim()) {
      setMessage('Please ask a question to continue.');
      return;
    }
    handleQuickPrompt(query.trim());
    setQuery('');
  };

  const chatLog = useMemo(
    () =>
      assistantMessages.map((msg) => (
        <div
          key={msg.id}
          className={`rounded-3xl p-5 ${
            msg.role === 'assistant'
              ? 'border border-slate-800 bg-slate-900/90 text-slate-200'
              : 'bg-brand-500 text-white'
          } shadow-sm shadow-slate-950/10`}
        >
          <p
            className={`text-xs uppercase tracking-[0.3em] ${
              msg.role === 'assistant' ? 'text-brand-300' : 'text-slate-200 font-semibold'
            }`}
          >
            {msg.role === 'assistant' ? 'Assistant' : 'You'}
          </p>
          <p className="mt-3 text-sm leading-7 whitespace-pre-line">{msg.content}</p>
        </div>
      )),
    [assistantMessages]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300">AI Assistant</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Ask the assistant for operations guidance.</h1>
            <p className="mt-2 text-sm text-slate-400">
              Analyze collection risks, calculate cash-flow forecasts, or draft collection letters instantly.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-slate-800/80 px-3 py-2 text-sm text-slate-300">Live Engine</span>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=cashcollectionsupport@gmail.com&su=Cash%20Collection%20Agent%20-%20Support%20Request"
              target="_blank"
              rel="noreferrer"
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
            >
              Contact Support
            </a>
            <button
              type="button"
              onClick={resetAssistant}
              className="rounded-2xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
            >
              Reset chat
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {suggestions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => handleQuickPrompt(item)}
              className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-left text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
            >
              ✨ {item}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          {assistantMessages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Choose one of the suggestions above or type any financial query to start analyzing your operations."
            />
          ) : (
            chatLog
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500/50 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            type="text"
            placeholder="e.g. Write an email for Apex, what is our 30-day forecast, or risk summary..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            className="rounded-3xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-400"
            type="submit"
          >
            Send message
          </button>
        </form>
        {message && <p className="mt-4 rounded-3xl bg-slate-950/70 px-4 py-3 text-sm text-slate-200">{message}</p>}
      </section>
    </div>
  );
};

export default AssistantPage;