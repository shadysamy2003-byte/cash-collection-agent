import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useAppData } from './context/AppDataContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';
import DashboardPage from './pages/DashboardPage';
import InvoicesPage from './pages/OrdersPage';
import CustomersPage from './pages/InventoryPage';
import CollectionsPage from './pages/CollectionsPage';
import CashFlowPage from './pages/ProfitPage';
import ReportsPage from './pages/ReportsPage';
import ActionsPage from './pages/ActionsPage';
import AssistantPage from './pages/AssistantPage';
import SettingsPage from './pages/SettingsPage';
import Legal from './pages/LegalPage';
import PageShell from './components/PageShell';

const App = () => {
  const navigate = useNavigate();
  const { user, logout } = useAppData();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!user) {
      return <Navigate replace to="/login" />;
    }

    // إذا انتهت الفترة التجريبية (7 أيام) ولم يكن لديه اشتراك مدفوع
    if (user.isTrialExpired && !user.hasActiveSubscription) {
      return (
        <div className="space-y-6">
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-center text-rose-300">
            <h3 className="text-lg font-bold text-rose-200">⚠️ Your 7-Day Free Trial Has Ended</h3>
            <p className="mt-1 text-sm text-rose-300/80">
              Please choose a plan to unlock your collection dashboard, invoices, and automated follow-ups.
            </p>
          </div>
          <PricingPage />
        </div>
      );
    }

    return children;
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-xl font-semibold text-white tracking-wide hover:text-brand-300 transition">
            Cash Collection Agent
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* شريط حالة الفترة التجريبية */}
                {!user.hasActiveSubscription && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                    user.isTrialExpired
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${user.isTrialExpired ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'}`} />
                    {user.isTrialExpired ? 'Trial Expired' : '7 days left in trial'}
                  </span>
                )}

                <span className="hidden rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 sm:inline-block">
                  {user.name}
                </span>

                <Link
                  to="/dashboard"
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/pricing"
                  className="rounded-2xl border border-transparent px-4 py-2 text-sm text-slate-300 transition hover:text-white"
                >
                  Pricing
                </Link>
                <Link
                  to="/login"
                  className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-200 transition hover:border-brand-500 hover:text-white"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rounded-2xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
                >
                  Start Free Trial
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex-1 w-full">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signup" element={<AuthPage mode="signup" />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/legal" element={<Legal />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <PageShell>
                  <Routes>
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="invoices" element={<InvoicesPage />} />
                    <Route path="customers" element={<CustomersPage />} />
                    <Route path="collections" element={<CollectionsPage />} />
                    <Route path="cash-flow" element={<CashFlowPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="actions" element={<ActionsPage />} />
                    <Route path="assistant" element={<AssistantPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate replace to="dashboard" />} />
                  </Routes>
                </PageShell>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer معتمد ومستوفي لشروط Paddle */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-sm text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Cash Collection Agent. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/legal" className="hover:text-white transition">Terms & Privacy Policy</Link>
            <Link to="/pricing" className="hover:text-white transition">Pricing & Refunds</Link>
            <a href="mailto:Shadysamy2003@gmail.com" className="hover:text-white transition">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;