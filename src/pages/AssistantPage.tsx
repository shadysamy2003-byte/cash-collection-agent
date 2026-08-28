import { useMemo, useState } from 'react';
import { useAppData } from '../context/AppDataContext';
import { EmptyState } from '../components/EmptyState';
import type { AssistantMessage } from '../types';

const AssistantPage = () => {
  const { assistantMessages, addAssistantMessage, resetAssistant, queryAssistant } = useAppData();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');

  const suggestions = [
    'Which invoices should I collect first?',
    'Show me the highest-risk customers.',
    'What payments are due soon?',
    'Summarize overdue exposure.',
    "Give me today's collection priorities.",
    'Explain the cash-flow forecast.'
  ];

  const handleQuickPrompt = (prompt: string) => {
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: prompt,
    };
    addAssistantMessage(userMessage);

    const response: AssistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: queryAssistant(prompt),
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
              Analyze collection risks, ask about cash-flow forecasts, or get daily collection priorities.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-2xl bg-slate-800/80 px-3 py-2 text-sm text-slate-300">Live suggestions</span>
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
              description="Choose one of the suggestions above or type a question to start analyzing your financial data."
            />
          ) : (
            chatLog
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4 sm:flex-row">
          <input
            className="min-w-0 flex-1 rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            type="text"
            placeholder="Ask about overdue collection priorities, customer risks, or cash flow..."
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