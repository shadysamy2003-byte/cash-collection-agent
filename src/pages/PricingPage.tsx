import { useState, useEffect } from 'react';
import { useAppData } from '../context/AppDataContext';

declare global {
  interface Window {
    Paddle?: any;
  }
}

const PADDLE_CLIENT_TOKEN = 'live_f8d11a44516ea2c3d10428f1ecb';

const plans = [
  {
    title: 'Starter',
    priceMonthly: 9,
    priceAnnualMonthlyEquivalent: 7.2,
    annualTotal: 86.4,
    currency: '$',
    description: 'For small teams that need reliable invoice collection',
    features: ['Invoice tracking', 'Due date reminders', 'Customer risk scores'],
    popular: false,
    priceIdMonthly: 'pri_01m1kr7j9e247m5m7gx6gkja82',
    priceIdAnnual: 'pri_01m1kr92g0dzfz7yrpy2j9pxrx',
  },
  {
    title: 'Growth',
    priceMonthly: 29,
    priceAnnualMonthlyEquivalent: 23.2,
    annualTotal: 278.4,
    currency: '$',
    description: 'For growing businesses with recurring receivables',
    features: ['Cash flow forecasting', 'Priority collections', 'Team workflows'],
    popular: true,
    priceIdMonthly: 'pri_01m1kradmabmq0w03jnjx3sfpq',
    priceIdAnnual: 'pri_01m1krdpsbtvtyv28n0mdzdnsc',
  },
  {
    title: 'Enterprise',
    priceMonthly: 79,
    priceAnnualMonthlyEquivalent: 63.2,
    annualTotal: 758.4,
    currency: '$',
    description: 'For finance teams that need scale and automation',
    features: ['Dedicated onboarding', 'Custom integrations', 'Priority support'],
    popular: false,
    priceIdMonthly: 'pri_01m1krf9z8r3txz5q8ch8rn906',
    priceIdAnnual: 'pri_01m1krge6jgxvdtsvptf8cnpg2',
  },
];

const PricingPage = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const { user } = useAppData();

  useEffect(() => {
    // تحميل مكتبة Paddle برمجياً لبيئة Vite
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    script.onload = () => {
      if (window.Paddle) {
        window.Paddle.Initialize({
          token: PADDLE_CLIENT_TOKEN,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCheckout = (priceId: string) => {
    if (window.Paddle) {
      window.Paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user?.email ? { email: user.email } : undefined,
        settings: {
          displayMode: 'overlay',
          theme: 'dark',
          successUrl: `${window.location.origin}/dashboard`,
        },
      });
    } else {
      console.warn('Paddle SDK is still loading...');
    }
  };

  return (
    <div className="space-y-10 relative">
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
          const displayPrice = isAnnual ? plan.priceAnnualMonthlyEquivalent : plan.priceMonthly;
          const targetPriceId = isAnnual ? plan.priceIdAnnual : plan.priceIdMonthly;

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
                  <div className="mt-4 flex items-empty items-baseline gap-1.5">
                    <span className="text-4xl font-semibold text-white">
                      {plan.currency}{displayPrice}
                    </span>
                    <span className="text-sm font-medium text-slate-400">/ month</span>
                  </div>
                  {isAnnual && (
                    <p className="mt-1 text-xs text-emerald-400 font-medium">
                      Billed annually ({plan.currency}{plan.annualTotal}/year)
                    </p>
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
                  onClick={() => handleCheckout(targetPriceId)}
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