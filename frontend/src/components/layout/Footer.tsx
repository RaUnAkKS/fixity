import Link from 'next/link';
import { Building2, Phone, Mail, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-300 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-600 text-white font-bold text-base">
                F
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                FIXITY
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Fixity is the official municipal civic issue reporting, automated department routing, and citizen resolution verification platform.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Citizen Services</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/report" className="hover:text-white transition-colors">Report a Civic Issue</Link>
              </li>
              <li>
                <Link href="/report/voice" className="hover:text-white transition-colors">Voice Complaint Portal</Link>
              </li>
              <li>
                <Link href="/complaints" className="hover:text-white transition-colors">Track Complaint Status</Link>
              </li>
              <li>
                <Link href="/dashboard/heatmap" className="hover:text-white transition-colors">Public Issue Heatmap</Link>
              </li>
            </ul>
          </div>

          {/* Officer & Operations */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Municipal Operations</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/login" className="hover:text-white transition-colors">Officer / Staff Sign In</Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">Operations Dashboard</Link>
              </li>
              <li>
                <Link href="/dashboard/priorities" className="hover:text-white transition-colors">Ward Priority Index</Link>
              </li>
              <li>
                <Link href="/dashboard/impact" className="hover:text-white transition-colors">Resolution Metrics</Link>
              </li>
            </ul>
          </div>

          {/* Contact & Helpline */}
          <div>
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Municipal Contact</h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-blue-400" />
                <span>Toll-Free Helpline: 1800-11-2026</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-blue-400" />
                <span>helpdesk@fixity.gov.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-blue-400" />
                <span>Municipal Corporation HQ</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Fixity Municipal Grievance & Resolution Portal. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
