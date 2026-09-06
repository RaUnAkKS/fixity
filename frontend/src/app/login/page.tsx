'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Building2, User, Shield, KeyRound, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickLogin = async (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login({ email: demoEmail, password: demoPass });
      if (loggedUser.role === 'officer' || loggedUser.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/complaints');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Quick login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login({ email, password });
      if (loggedUser.role === 'officer' || loggedUser.role === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/complaints');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-md space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-600 text-white font-black text-xl shadow-md shadow-blue-700/20 mb-3">
            F
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Sign In to Fixity
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Municipal Civic Grievance &amp; Resolution Grid
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs space-y-4">
          
          {/* Quick Demo Fill Pills */}
          <div className="space-y-1.5 pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Quick 1-Click Demo Logins:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => quickLogin('citizen@fixity.demo', 'demo123')}
                className="px-2.5 py-2 rounded-xl bg-blue-50/70 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <User className="h-3.5 w-3.5" /> Citizen
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => quickLogin('officer@fixity.demo', 'demo123')}
                className="px-2.5 py-2 rounded-xl bg-purple-50/70 hover:bg-purple-100 border border-purple-200 text-purple-700 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <Shield className="h-3.5 w-3.5" /> Officer
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => quickLogin('admin@fixity.demo', 'demo123')}
                className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <KeyRound className="h-3.5 w-3.5" /> Admin
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-800 mb-1.5">
                Email Address / User ID
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com / citizen@fixity.demo"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-800 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your account password"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-xs text-slate-500">
          Need a citizen account?{' '}
          <Link href="/register" className="font-bold text-blue-700 hover:underline">
            Register New Account
          </Link>
        </p>
      </div>
    </div>
  );
}

