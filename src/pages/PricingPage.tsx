import { Link } from 'react-router-dom';

const plans = [
  {
    title: 'Starter',
    price: '$29',
    description: 'For small teams that need reliable invoice collection',
    features: ['Invoice tracking', 'Due date reminders', 'Customer risk scores']
  },
  {
    title: 'Growth',
    price: '$79',
    description: 'For growing businesses with recurring receivables',
    features: ['Cash flow forecasting', 'Priority collections', 'Team workflows']
  },
  {
    title: 'Enterprise',
    price: '$149',
    description: 'For finance teams that need scale and automation',
    features: ['Dedicated onboarding', 'Custom integrations', 'Priority support']
  }
];

const PricingPage = () => (
  <div className="space-y-10">
    <section className="rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/25 backdrop-blur-xl">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Pricing</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Simple plans for improving cash flow and reducing overdue exposure.</h1>
          <p className="mt-4 max-w-2xl text-slate-400">Choose the package that fits your finance team, then start recovering cash with fewer manual follow-ups.</p>
        </div>
        <Link to="/signup" className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
          Start free trial
        </Link>
      </div>
    </section>

    <section className="grid gap-6 lg:grid-cols-3">
      {plans.map((plan) => (
        <div key={plan.title} className="rounded-[2rem] border border-slate-800/90 bg-slate-900/90 p-6 shadow-xl shadow-slate-950/20">
          <div className="space-y-4">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">{plan.title}</p>
              <p className="mt-4 text-5xl font-semibold text-white">{plan.price}</p>
              <p className="mt-2 text-sm text-slate-400">{plan.description}</p>
            </div>
            <ul className="space-y-3 text-slate-300">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500"></span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/signup" className="inline-flex w-full items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400">
              Choose plan
            </Link>
          </div>
        </div>
      ))}
    </section>

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

export default PricingPage;
