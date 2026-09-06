import Link from 'next/link';
import { ShieldCheck, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-8 text-xs text-slate-500">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-700 text-white font-bold text-xs shadow-xs">
            F
          </div>
          <span className="font-semibold text-slate-800">FIXITY</span>
          <span className="text-slate-300">•</span>
          <span>Municipal Civic Issue Resolution Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/report" className="hover:text-blue-700 transition-colors font-medium">
            Report Issue
          </Link>
          <Link href="/complaints" className="hover:text-blue-700 transition-colors font-medium">
            Track Status
          </Link>
          <Link href="/dashboard" className="hover:text-blue-700 transition-colors font-medium">
            Officer Dashboard
          </Link>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          <span>Official Public Services Grid</span>
        </div>
      </div>
    </footer>
  );
}

