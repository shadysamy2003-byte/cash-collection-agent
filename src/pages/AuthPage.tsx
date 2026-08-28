import { Link, useNavigate } from 'react-router-dom';
import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthPage = ({ mode }: { mode: AuthMode }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name }
          }
        });
        if (error) throw error;
        setMessage('Registration successful! Please check your email for verification.');
        setTimeout(() => navigate('/dashboard'), 1500);
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Signed in successfully!');
        navigate('/dashboard');
      } else {
        // Forgot password mode
        if (!email.trim()) {
          setMessage('Please enter your email to reset your password.');
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('Password recovery instructions sent to your inbox.');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err: any) {
      setMessage(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 sm:px-6">
      <div className="w-full max-w-md rounded-[2rem] border border-slate-800/90 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="mb-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-brand-300">Cash Collection Agent</p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            {mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            {mode === 'login'
              ? 'Sign in to manage invoices, customer risk, and cash flow.'
              : mode === 'signup'
              ? 'Create your account and start recovering overdue payments faster.'
              : 'Send a password reset link to your email.'}
          </p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label className="block text-sm font-medium text-slate-200">
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>
          )}
          <label className="block text-sm font-medium text-slate-200">
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </label>
          {mode !== 'forgot' && (
            <label className="block text-sm font-medium text-slate-200">
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="mt-2 w-full rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </label>
          )}
          <button 
            className="w-full rounded-3xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-50" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
          </button>
        </form>
        {message && <p className="mt-4 rounded-3xl bg-slate-950/70 px-4 py-3 text-sm text-slate-200">{message}</p>}
        <div className="mt-6 flex flex-col gap-3 text-center text-sm text-slate-400">
          {mode === 'login' ? (
            <>
              <p>
                New to Cash Collection Agent? <Link to="/signup" className="text-brand-400 hover:text-brand-300">Create an account</Link>
              </p>
              <p>
                <Link to="/forgot-password" className="text-brand-400 hover:text-brand-300">Forgot password?</Link>
              </p>
            </>
          ) : mode === 'signup' ? (
            <p>
              Already have an account? <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
            </p>
          ) : (
            <p>
              Back to <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;