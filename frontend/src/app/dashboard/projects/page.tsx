'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FolderKanban, Plus, Filter, Building2 } from 'lucide-react';

const MOCK_PROJECTS = [
  { id: 'proj_1', title: 'Main Road Resurfacing Project', category: 'Road Infrastructure', ward: 'Ward 7', status: 'In Progress', cost: 1500000, priority: 92 },
  { id: 'proj_2', title: 'New Water Pipeline Installation', category: 'Water Supply', ward: 'Ward 3', status: 'Planned', cost: 2400000, priority: 85 },
  { id: 'proj_3', title: 'Streetlight Replacement Drive', category: 'Electricity', ward: 'Ward 12', status: 'Completed', cost: 450000, priority: 78 },
  { id: 'proj_4', title: 'Drainage Clearing & Desilting', category: 'Drainage & Sewage', ward: 'Ward 5', status: 'In Progress', cost: 300000, priority: 88 },
  { id: 'proj_5', title: 'Community Park Green Renovation', category: 'Parks & Recreation', ward: 'Ward 2', status: 'Planned', cost: 850000, priority: 65 },
  { id: 'proj_6', title: 'Junction Traffic Signal Upgrade', category: 'Public Safety', ward: 'Ward 9', status: 'Proposed', cost: 1200000, priority: 70 },
];

export default function ProjectsPage() {
  const [filter, setFilter] = useState('All');

  const filteredProjects = filter === 'All' 
    ? MOCK_PROJECTS 
    : MOCK_PROJECTS.filter(p => p.status === filter);

  return (
    <div className="space-y-6 bg-slate-50">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-md border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" /> Municipal Infrastructure Works
          </div>
          <h1 className="text-xl font-bold text-slate-900">Municipal Projects Pipeline</h1>
          <p className="text-xs text-slate-600 mt-0.5">Sanctioned works, estimated budgets, and linked grievance clusters.</p>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-blue-700 text-white rounded text-xs font-bold hover:bg-blue-800 transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Propose New Project
        </button>
      </div>

      <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden text-xs">
        <div className="p-3.5 border-b border-slate-200 flex items-center gap-3 bg-slate-100 font-semibold text-slate-800">
          <Filter className="w-4 h-4 text-slate-500" />
          <span>Filter Status:</span>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-slate-300 rounded text-xs p-1.5 bg-white text-slate-800 focus:border-blue-700 focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Proposed">Proposed</option>
            <option value="Planned">Planned</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="p-3">Project Title</th>
                <th className="p-3">Category</th>
                <th className="p-3">Ward</th>
                <th className="p-3">Status</th>
                <th className="p-3">Est. Budget (₹)</th>
                <th className="p-3">Priority Score</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredProjects.map(project => (
                <tr key={project.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">
                    <Link href={`/dashboard/projects/${project.id}`} className="hover:text-blue-700">
                      {project.title}
                    </Link>
                  </td>
                  <td className="p-3 text-slate-600">{project.category}</td>
                  <td className="p-3 text-slate-900 font-semibold">{project.ward}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      project.status === 'Completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                      project.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                      project.status === 'Planned' ? 'bg-amber-50 text-amber-800 border-amber-300' :
                      'bg-slate-100 text-slate-800 border-slate-300'
                    }`}>
                      {project.status}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-900">₹{project.cost.toLocaleString('en-IN')}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${project.priority >= 80 ? 'bg-red-600' : 'bg-amber-500'}`} 
                          style={{ width: `${project.priority}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-slate-900">{project.priority}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/dashboard/projects/${project.id}`}
                      className="text-blue-700 font-semibold hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProjects.length === 0 && (
            <div className="p-6 text-center text-slate-500">
              No projects found for the selected status.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
