import React, { useState } from 'react';
import { useAppData } from '../context/AppDataContext';

interface Plan {
  id: string;
  title: string;
  priceMonthly: number;
  priceAnnualMonthlyEquivalent: number;
  annualTotal: number;
  currency: string;
  description: string;
  features: string[];
  popular: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    title: 'Starter',
    priceMonthly: 9,
    priceAnnualMonthlyEquivalent: 7.2,
    annualTotal: 86.4,
    currency: '$',
    description: 'For small teams that need reliable invoice collection',
    features: ['Invoice tracking', 'Due date reminders', 'Customer risk scores'],
    popular: false,
  },
  {
    id: 'growth',
    title: 'Growth',
    priceMonthly: 29,
    priceAnnualMonthlyEquivalent: 23.2,
    annualTotal: 278.4,
    currency: '$',
    description: 'For growing businesses with recurring receivables',
    features: ['Cash flow forecasting', 'Priority collections', 'Team workflows'],
    popular: true,
  },
  {
    id: 'enterprise',
    title: 'Enterprise',
    priceMonthly: 79,
    priceAnnualMonthlyEquivalent: 63.2,
    annualTotal: 758.4,
    currency: '$',
    description: 'For finance teams that need scale and automation',
    features: ['Dedicated onboarding', 'Custom integrations', 'Priority support'],
    popular: false,
  },
];

export const PricingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { user } = useAppData();

  const handleCheckout = async (plan: Plan) => {
    if (!agreedToTerms) {
      alert('Please agree to the Terms of Service and Refund Policy to proceed.');
      return;
    }

    const amount = isAnnual ? plan.annualTotal : plan.priceMonthly;
    setLoadingPlan(plan.id);

    try {
      const response = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(amount * 100),
          currency: 'USD',
          planId: plan.id,
          billingPeriod: isAnnual ? 'annual' : 'monthly',
          customer: {
            email: user?.email || 'customer@example.com',
            first_name: user?.email?.split('@')[0] || 'Customer',
            last_name: 'Subscriber',
          },
        }),
      });

      const data = await response.json();

      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert(data.error || 'Failed to initialize payment.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error connecting to payment gateway.');
    } finally {
      setLoadingPlan(null);
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
            <p className="mt-4 max-w-2xl text-slate-400">
              Choose the package that fits your finance team, then start recovering cash with fewer manual follow-ups.
            </p>
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

      {/* Mandatory Checkbox */}
      <div className="max-w-xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500 focus:ring-offset-slate-900"
          />
          <span className="text-sm text-slate-300">
            I agree to the{' '}
            <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-brand-400 underline hover:text-brand-300">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-brand-400 underline hover:text-brand-300">
              Refund Policy
            </a>.
          </span>
        </label>
      </div>

      {/* Pricing Cards */}
      <section className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const displayPrice = isAnnual ? plan.priceAnnualMonthlyEquivalent : plan.priceMonthly;

          return (
            <div
              key={plan.id}
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
                  disabled={loadingPlan === plan.id}
                  onClick={() => handleCheckout(plan)}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-semibold transition ${
                    !agreedToTerms
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : plan.popular
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 hover:bg-brand-400'
                      : 'border border-slate-700 bg-slate-800/80 text-white hover:border-brand-500 hover:bg-slate-800'
                  }`}
                >
                  {loadingPlan === plan.id ? 'Processing...' : `Choose ${plan.title}`}
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
          <p className="mt-4 text-sm text-slate-400">
            Stop letting overdue invoices erode working capital. Give your finance team the tools to turn receivables into reliable cash flow.
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">Trusted by SMB finance teams</h2>
          <p className="mt-4 text-sm text-slate-400">
            Manage customer payment risk, automate reminders, and keep forecasted cash flow aligned with real receivables.
          </p>
        </div>
        <div className="rounded-[2rem] border border-slate-800/90 bg-slate-950/80 p-8 shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-semibold text-white">Start with confidence</h2>
          <p className="mt-4 text-sm text-slate-400">
            Launch quickly with low overhead, then scale to advanced collection workflows as your business needs evolve.
          </p>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;