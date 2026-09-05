import Link from 'next/link';
import {
  FileText,
  MapPin,
  CheckCircle2,
  ArrowRight,
  BarChart3,
  Search,
  Building2,
  ShieldCheck,
  Flame,
  Clock,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      
      {/* Modest Civic Banner / Hero */}
      <section className="bg-slate-900 text-white py-12 md:py-16 border-b border-slate-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            
            <div className="md:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-blue-950 text-blue-300 border border-blue-800 text-xs font-semibold uppercase tracking-wider">
                Official Municipal Service Portal
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Fixity — Civic Issue Reporting & Resolution Platform
              </h1>
              <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
                Report problems in your neighbourhood, track department resolution progress, and verify completed municipal works.
              </p>
              
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/report"
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <FileText className="h-4 w-4" />
                  REPORT AN ISSUE
                </Link>
                <Link
                  href="/complaints"
                  className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
                >
                  <Search className="h-4 w-4" />
                  TRACK A COMPLAINT
                </Link>
              </div>
            </div>

            {/* Quick Helper Box */}
            <div className="md:col-span-4 bg-slate-800/80 border border-slate-700 rounded-lg p-5 text-xs text-slate-300 space-y-3">
              <h3 className="font-semibold text-white text-sm flex items-center gap-1.5 border-b border-slate-700 pb-2">
                <Building2 className="h-4 w-4 text-blue-400" />
                Citizen Assistance
              </h3>
              <p>
                Issues are automatically routed to relevant departments (Public Works, Water Board, Sanitation, Electrical) based on issue details and location.
              </p>
              <div className="pt-1 text-slate-400">
                <span>Toll-Free Helpline: <strong>1800-11-2026</strong></span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Citizen Services Quick Actions Grid */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-5 bg-blue-700 rounded-sm"></span>
            Citizen Services
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <Link
              href="/report"
              className="group p-5 rounded-md border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Form & Voice</span>
                <FileText className="h-5 w-5 text-blue-700" />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                Report a Civic Issue
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Submit potholes, drainage leaks, streetlight failures, or garbage build-up.
              </p>
            </Link>

            <Link
              href="/complaints"
              className="group p-5 rounded-md border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status Tracking</span>
                <Search className="h-5 w-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                Track My Complaints
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Check status updates, department assignments, and resolution progress.
              </p>
            </Link>

            <Link
              href="/dashboard/heatmap"
              className="group p-5 rounded-md border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-orange-600 uppercase tracking-wider">City Density</span>
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                Public Issue Map
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Explore real-time citywide issue density and ward hotspots.
              </p>
            </Link>

            <Link
              href="/dashboard"
              className="group p-5 rounded-md border border-slate-200 bg-white hover:border-blue-500 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Operations</span>
                <BarChart3 className="h-5 w-5 text-emerald-700" />
              </div>
              <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                Municipal Operations
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Officer portal for department dispatch, priority scores, and task tracking.
              </p>
            </Link>

          </div>
        </div>
      </section>

      {/* Public Issue Overview Stats */}
      <section className="py-8 bg-slate-100 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-md bg-white border border-slate-200 text-center">
              <div className="text-2xl font-bold text-slate-900">1,248</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">Open Issues Citywide</div>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 text-center">
              <div className="text-2xl font-bold text-emerald-700">4,892</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">Issues Resolved (YTD)</div>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 text-center">
              <div className="text-2xl font-bold text-blue-700">48 Hours</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">Average Response Time</div>
            </div>

            <div className="p-4 rounded-md bg-white border border-slate-200 text-center">
              <div className="text-2xl font-bold text-slate-900">92%</div>
              <div className="text-xs font-medium text-slate-500 mt-0.5">Citizen Verification Match</div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Process */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-5 bg-blue-700 rounded-sm"></span>
              Resolution Process Workflow
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              How complaints move from citizen submission to verified municipal resolution.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4">
            {[
              { num: '1', title: 'Citizen Report', desc: 'Report issue via form, voice audio, or photo with GPS coordinates.' },
              { num: '2', title: 'Automated Routing', desc: 'Category, severity, and assigned department are automatically determined.' },
              { num: '3', title: 'Priority Dispatch', desc: 'Issue is assigned to municipal field engineers based on ward priority.' },
              { num: '4', title: 'Field Action', desc: 'Municipal teams complete repair work and update case status.' },
              { num: '5', title: 'Citizen Verification', desc: 'Reporting citizen inspects repair and verifies resolution score.' },
            ].map((step) => (
              <div key={step.num} className="p-4 rounded-md border border-slate-200 bg-slate-50/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-white text-xs font-bold">
                    {step.num}
                  </span>
                  <h3 className="font-semibold text-slate-900 text-sm">{step.title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-normal">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Public Complaints List */}
      <section className="py-12 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-5 bg-blue-700 rounded-sm"></span>
                Recent Public Grievance Records
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Live list of registered municipal issues undergoing resolution.
              </p>
            </div>
            <Link
              href="/complaints"
              className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              View All Complaints Registry <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Ref ID</th>
                    <th className="py-3 px-4">Issue Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Ward / Area</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {[
                    { id: 'FX-1024', text: 'Main road asphalt damaged causing traffic slowdown', cat: 'Road Infrastructure', ward: 'Ward 12 (Karol Bagh)', priority: 'High', status: 'In Progress', statusColor: 'bg-amber-100 text-amber-800 border-amber-300' },
                    { id: 'FX-1025', text: 'Clean water pipeline leakage near market square', cat: 'Water Supply', ward: 'Ward 7 (Dwarka)', priority: 'High', status: 'Assigned', statusColor: 'bg-blue-100 text-blue-800 border-blue-300' },
                    { id: 'FX-1026', text: 'Streetlights unlit across 3rd main avenue', cat: 'Electricity', ward: 'Ward 4 (Vasant Kunj)', priority: 'Medium', status: 'Analyzed', statusColor: 'bg-slate-100 text-slate-800 border-slate-300' },
                    { id: 'FX-1027', text: 'Garbage accumulation near community park gate', cat: 'Sanitation & Waste', ward: 'Ward 19 (Rohini)', priority: 'Medium', status: 'Under Review', statusColor: 'bg-slate-100 text-slate-800 border-slate-300' },
                    { id: 'FX-1028', text: 'Stormwater drain blockage causing waterlogging', cat: 'Drainage & Sewage', ward: 'Ward 2 (Chandni Chowk)', priority: 'High', status: 'Resolved', statusColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-800">{row.id}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 max-w-xs truncate">{row.text}</td>
                      <td className="py-3 px-4 text-slate-600">{row.cat}</td>
                      <td className="py-3 px-4 text-slate-600">{row.ward}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${row.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {row.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${row.statusColor}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/complaints/${row.id}`}
                          className="text-blue-700 font-semibold hover:underline"
                        >
                          View File
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
