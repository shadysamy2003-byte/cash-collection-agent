import { useState } from 'react';
import { useAppData } from '../context/AppDataContext';

const plans = [
  {
    title: 'Starter',
    priceMonthly: 29,
    priceAnnual: 23,
    description: 'For small teams that need reliable invoice collection',
    features: ['Invoice tracking', 'Due date reminders', 'Customer risk scores'],
    popular: false
  },
  {
    title: 'Growth',
    priceMonthly: 79,
    priceAnnual: 63,
    description: 'For growing businesses with recurring receivables',
    features: ['Cash flow forecasting', 'Priority collections', 'Team workflows'],
    popular: true
  },
  {
    title: 'Enterprise',
    priceMonthly: 149,
    priceAnnual: 119,
    description: 'For finance teams that need scale and automation',
    features: ['Dedicated onboarding', 'Custom integrations', 'Priority support'],
    popular: false
  }
];

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const { user } = useAppData();

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setCardNumber('');
    setCardHolder('');
    setExpiry('');
    setCvc('');
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    val = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(val);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`;
    }
    setExpiry(val);
  };

  const handleConfirmSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const planName = selectedPlan?.title;
      setSelectedPlan(null);
      setToastMessage(`🎉 Payment successful! You are now subscribed to the ${planName} Plan.`);
      setTimeout(() => {
        setToastMessage('');
      }, 5000);
    }, 1500);
  };

  return (
    <div className="space-y-10 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/90 px-6 py-4 text-emerald-200 shadow-2xl shadow-black backdrop-blur-xl animate-bounce">
          <span className="text-xl">✅</span>
          <p className="text-sm font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Header & Toggle */}
      <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brand-300 font-semibold">Pricing Plans</p>
            <h1 className="mt-3 text-4xl font-semibold text-white">Simple plans for improving cash flow and reducing overdue exposure.</h1>
            <p className="mt-4 max-w-2xl text-slate-400">Choose the package that fits your finance team, then start recovering cash with fewer manual follow-ups.</p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="mt-8 flex items-center justify-center gap-4 border-t border-slate-800/80 pt-6">
          <span className={`text-sm font-medium ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Monthly</span>
          <button
            type="button"
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative h-8 w-14 rounded-full bg-slate-800 p-1 transition-colors hover:bg-slate-700 focus:outline-none"
          >
            <div
              className={`h-6 w-6 rounded-full bg-brand-500 transition-transform duration-200 ${
                isAnnual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${isAnnual ? 'text-white' : 'text-slate-400'}`}>Annually</span>
            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
              Save 20%
            </span>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const currentPrice = isAnnual ? plan.priceAnnual : plan.priceMonthly;
          return (
            <div
              key={plan.title}
              className={`relative rounded-[2rem] p-6 shadow-xl transition-all duration-300 flex flex-col justify-between ${
                plan.popular
                  ? 'border-2 border-brand-500 bg-slate-900 shadow-brand-500/10 lg:-translate-y-2'
                  : 'border border-slate-800/90 bg-slate-900/90 shadow-slate-950/20 hover:border-slate-700'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-brand-500 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-md shadow-brand-500/40">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{plan.title}</p>
                  <div className="mt-4 flex items-baseline gap-1.5">
                    <span className="text-5xl font-semibold text-white">${currentPrice}</span>
                    <span className="text-sm font-medium text-slate-400">/ month</span>
                  </div>
                  {isAnnual && (
                    <p className="mt-1 text-xs text-emerald-400 font-medium">Billed annually (${currentPrice * 12}/year)</p>
                  )}
                  <p className="mt-3 text-sm text-slate-400">{plan.description}</p>

                  <ul className="mt-6 space-y-3 text-slate-300">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-brand-500 shrink-0"></span>
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                    plan.popular
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400'
                      : 'border border-slate-700 bg-slate-800/80 text-white hover:border-brand-500 hover:bg-slate-800'
                  }`}
                >
                  Choose {plan.title}
                </button>
              </div>
            </div>
          );
        })}
      </section>

      {/* Credit Card Checkout Modal - Centered and Non-Clipping */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/85 p-4 sm:p-6 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl my-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800/80 pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-widest text-brand-300 font-bold">Secure Checkout</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Upgrade to {selectedPlan.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="rounded-xl p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Order Summary Box */}
            <div className="mt-4 rounded-2xl bg-slate-950/90 p-3.5 border border-slate-800/80">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Account:</span>
                <span className="text-slate-200 font-medium">{user?.email || 'shady@orderflow.com'}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-slate-400">
                <span>Billing Cycle:</span>
                <span className="text-slate-200">{isAnnual ? 'Annual (20% Off)' : 'Monthly'}</span>
              </div>
              <div className="mt-2.5 flex justify-between border-t border-slate-800/80 pt-2.5 text-sm font-bold text-white">
                <span>Total Due:</span>
                <span className="text-emerald-400 font-semibold">
                  ${isAnnual ? selectedPlan.priceAnnual * 12 : selectedPlan.priceMonthly}.00
                </span>
              </div>
            </div>

            {/* Card Payment Form */}
            <form onSubmit={handleConfirmSubscription} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Shady Samy"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Card Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="4000 1234 5678 9010"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none font-mono"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-mono">💳</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={handleExpiryChange}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none text-center font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    required
                    maxLength={4}
                    placeholder="123"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:border-brand-500 focus:outline-none text-center font-mono"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPlan(null)}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-3 text-xs font-semibold text-white hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 px-3.5 py-3 text-xs font-semibold text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400 transition disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Pay $${isAnnual ? selectedPlan.priceAnnual * 12 : selectedPlan.priceMonthly}.00`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Benefits */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">Why Cash Collection Agent?</h2>
          <p className="mt-4 text-sm text-slate-400">Stop letting overdue invoices erode working capital. Give your finance team the tools to turn receivables into reliable cash flow.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">Trusted by SMB finance teams</h2>
          <p className="mt-4 text-sm text-slate-400">Manage customer payment risk, automate reminders, and keep forecasted cash flow aligned with real receivables.</p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">Start with confidence</h2>
          <p className="mt-4 text-sm text-slate-400">Launch quickly with low overhead, then scale to advanced collection workflows as your business needs evolve.</p>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;