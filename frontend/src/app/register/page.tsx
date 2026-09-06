'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { LANGUAGES } from '@/lib/types';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Languages as LanguagesIcon,
  Shield,
  AlertCircle,
  UserPlus,
  Loader2,
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    preferred_language: 'en',
    role: 'citizen',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        phone: form.phone || undefined,
        preferred_language: form.preferred_language,
        role: form.role,
      });
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify form details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 bg-slate-50">
      <div className="w-full max-w-lg space-y-5">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-700 to-blue-600 text-white font-black text-xl shadow-md shadow-blue-700/20 mb-3">
            F
          </div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Create Fixity Account
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Municipal Grievance Reporting &amp; Resolution Grid
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Role selector */}
            <div className="space-y-1.5 pb-2 border-b border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => updateField('role', 'citizen')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer ${
                    form.role === 'citizen'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-700 ring-1 ring-blue-600 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  <span>Citizen User</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('role', 'officer')}
                  className={`flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer ${
                    form.role === 'officer'
                      ? 'border-purple-600 bg-purple-50/70 text-purple-700 ring-1 ring-purple-600 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Municipal Officer</span>
                </button>
              </div>
            </div>

            {/* Full name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-bold text-slate-800 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  required
                  placeholder="Official full name"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-800 mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => updateField('password', e.target.value)}
                    required
                    minLength={8}
                    placeholder="Min 8 chars"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => updateField('confirmPassword', e.target.value)}
                    required
                    placeholder="Re-enter password"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-10 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
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
            </div>

            {/* Phone & Language */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="language" className="block text-xs font-bold text-slate-800 mb-1.5">
                  Language Preference
                </label>
                <select
                  id="language"
                  value={form.preferred_language}
                  onChange={(e) => updateField('preferred_language', e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none font-medium"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Register Account
                </>
              )}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-blue-700 hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}

