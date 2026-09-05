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
  Globe,
  Shield,
  AlertCircle,
  UserPlus,
  Building2
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

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
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
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded bg-blue-700 text-white font-bold text-xl shadow-sm mb-3">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Register Account — Fixity
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Municipal Grievance Reporting & Resolution Portal
          </p>
        </div>

        {/* Form */}
        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                {error}
              </div>
            )}

            {/* Full name */}
            <div>
              <label htmlFor="full_name" className="block text-xs font-semibold text-slate-800 mb-1">
                Full Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                  required
                  placeholder="Enter official full name"
                  className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-800 mb-1">
                Email Address <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-slate-800 mb-1">
                  Password <span className="text-red-600">*</span>
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  minLength={6}
                  placeholder="Min 6 chars"
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-slate-800 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => updateField('confirmPassword', e.target.value)}
                  required
                  placeholder="Re-enter password"
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Phone & Language */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="phone" className="block text-xs font-semibold text-slate-800 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-xs font-semibold text-slate-800 mb-1">
                  Language Preference
                </label>
                <select
                  id="language"
                  value={form.preferred_language}
                  onChange={(e) => updateField('preferred_language', e.target.value)}
                  className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                Account Category
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateField('role', 'citizen')}
                  className={`flex items-center justify-center gap-2 rounded border px-3 py-2 text-xs font-semibold transition-colors ${
                    form.role === 'citizen'
                      ? 'border-blue-700 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Citizen
                </button>
                <button
                  type="button"
                  onClick={() => updateField('role', 'officer')}
                  className={`flex items-center justify-center gap-2 rounded border px-3 py-2 text-xs font-semibold transition-colors ${
                    form.role === 'officer'
                      ? 'border-blue-700 bg-blue-50 text-blue-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  Municipal Officer
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {loading ? 'REGISTERING ACCOUNT...' : 'REGISTER ACCOUNT'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="mt-4 text-center text-xs text-slate-600">
          Already registered?{' '}
          <Link href="/login" className="font-bold text-blue-700 hover:underline">
            Sign In Here
          </Link>
        </p>
      </div>
    </div>
  );
}
