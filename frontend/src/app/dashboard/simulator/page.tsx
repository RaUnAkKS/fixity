'use client';

import React, { useState, useMemo } from 'react';
import {
  Calculator,
  IndianRupee,
  TrendingUp,
  Zap,
  Star,
  Sliders,
  Filter,
  AlertCircle,
  CheckCircle2,
  Users,
  BarChart3,
  Loader2,
  MapPin,
  RefreshCw,
  Layers
} from 'lucide-react';
import { COMPLAINT_CATEGORIES, SimulationResult } from '@/lib/types';

// Mock wards
const MOCK_WARDS = [
  { id: 7, name: 'Ward 7 - Connaught Place', zone: 'Central' },
  { id: 12, name: 'Ward 12 - Karol Bagh', zone: 'North-West' },
  { id: 25, name: 'Ward 25 - Okhla', zone: 'South-East' },
  { id: 22, name: 'Ward 22 - Dwarka', zone: 'South-West' },
  { id: 9, name: 'Ward 9 - Seelampur', zone: 'East' },
];

// Preset budget buttons in INR
const BUDGET_PRESETS = [
  { label: '₹10 Lakh', value: 1000000 },
  { label: '₹25 Lakh', value: 2500000 },
  { label: '₹50 Lakh', value: 5000000 },
  { label: '₹75 Lakh', value: 7500000 },
  { label: '₹1 Crore', value: 10000000 },
];

// Helper to format currency in Indian numbering format
const formatINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(val);
};

// Helper for readable Lakh/Crore compact notation
const formatCompactINR = (val: number): string => {
  if (val >= 10000000) {
    const cr = (val / 10000000).toFixed(2).replace(/\.?0+$/, '');
    return `₹${cr} Cr`;
  }
  if (val >= 100000) {
    const lakh = (val / 100000).toFixed(2).replace(/\.?0+$/, '');
    return `₹${lakh} Lakh`;
  }
  return formatINR(val);
};

// Realistic mock baseline project options
const BASELINE_PROJECTS = [
  {
    title: 'Arterial Road Resurfacing & Drainage Integration',
    category: 'Road Infrastructure',
    description: 'High-density bituminized asphalt resurfacing, pothole eradication, and stormwater runoff channel integration to prevent seasonal waterlogging.',
    baseCost: 3500000,
    basePopulation: 42500,
    basePriority: 92,
    baseImpact: 89,
    baseEfficiency: 18.2,
    tags: ['High Traffic', 'Safety Critical', 'Monsoon Ready'],
  },
  {
    title: 'Potable Water Pipeline Overhaul & Pressure Stabilization',
    category: 'Water Supply',
    description: 'Replacement of corroded ductile iron main conduits, installation of IoT pressure balancing valves, and ultrasonic acoustic leak sensors.',
    baseCost: 4800000,
    basePopulation: 58000,
    basePriority: 88,
    baseImpact: 85,
    baseEfficiency: 15.6,
    tags: ['Public Health', 'Water Loss Reduction', 'Continuous Supply'],
  },
  {
    title: 'Decentralized Solid Waste Segregation & Composting Hubs',
    category: 'Sanitation & Waste',
    description: 'Establishment of ward-level micro-processing wet/dry segregation kiosks, solar composter digesters, and smart automated bin telemetry.',
    baseCost: 2200000,
    basePopulation: 31000,
    basePriority: 81,
    baseImpact: 78,
    baseEfficiency: 19.4,
    tags: ['Clean City', 'Circular Economy', 'Zero Landfill'],
  },
  {
    title: 'Community Eco-Park Revitalization & Rainwater Harvesting',
    category: 'Parks & Recreation',
    description: 'Transformation of degraded public grounds with permeable walking tracks, native urban forestry, solar pathway lights, and percolation recharge wells.',
    baseCost: 1600000,
    basePopulation: 19500,
    basePriority: 73,
    baseImpact: 71,
    baseEfficiency: 14.8,
    tags: ['Green Spaces', 'Recreation', 'Groundwater Recharge'],
  },
];

// Calculation function to generate SimulationResult based on inputs
function calculateSimulation(
  budget: number,
  wardId: string,
  selectedCategory: string
): SimulationResult {
  const selectedWard = MOCK_WARDS.find((w) => w.id.toString() === wardId);
  const wardName = selectedWard ? selectedWard.name : 'All Wards (City-wide)';

  // Scale and adjust projects based on budget and filters
  const scaledOptions = BASELINE_PROJECTS.map((project, idx) => {
    // If a category filter is active and matches, boost priority slightly
    const categoryMatch = selectedCategory && project.category === selectedCategory;
    const categoryModifier = categoryMatch ? 1.15 : 1.0;

    // Ward scale factor
    const wardMultiplier = selectedWard ? 0.9 + (selectedWard.id % 5) * 0.05 : 1.0;

    const estimated_cost = Math.round(project.baseCost * wardMultiplier);
    const affected_population = Math.round(project.basePopulation * wardMultiplier);
    const priority_score = Math.min(
      99,
      Math.round(project.basePriority * categoryModifier)
    );
    const impact_estimate = Math.min(
      98,
      Math.round(project.baseImpact * (categoryMatch ? 1.08 : 1.0))
    );

    // Cost efficiency: impact index points generated per 1 Lakh of expenditure
    const costInLakhs = estimated_cost / 100000;
    const cost_efficiency = Number(((impact_estimate / costInLakhs) * 1.5).toFixed(1));

    return {
      title: project.title,
      category: project.category,
      estimated_cost,
      affected_population,
      priority_score,
      impact_estimate,
      cost_efficiency,
      fitsBudget: estimated_cost <= budget,
    };
  });

  // Determine the recommended option
  const affordableOptions = scaledOptions.filter((opt) => opt.fitsBudget);
  let recommendedIndex = 0;

  if (affordableOptions.length > 0) {
    let bestScore = -1;
    scaledOptions.forEach((opt, idx) => {
      if (opt.fitsBudget) {
        const score = opt.cost_efficiency * 2 + opt.priority_score;
        if (score > bestScore) {
          bestScore = score;
          recommendedIndex = idx;
        }
      }
    });
  } else {
    let highestPriority = -1;
    scaledOptions.forEach((opt, idx) => {
      if (opt.priority_score > highestPriority) {
        highestPriority = opt.priority_score;
        recommendedIndex = idx;
      }
    });
  }

  const bestOption = scaledOptions[recommendedIndex];

  // Construct intelligent recommendation narrative
  let recommendationNarrative = '';
  if (bestOption.fitsBudget) {
    recommendationNarrative = `Fixity Analysis: "${bestOption.title}" in ${wardName} delivers the optimal civic return on investment within your ${formatCompactINR(
      budget
    )} budget. With a Cost Efficiency rating of ${bestOption.cost_efficiency} pts/₹L and a Priority Score of ${bestOption.priority_score}/100, this project directly addresses high-severity issues in ${bestOption.category} for ${bestOption.affected_population.toLocaleString(
      'en-IN'
    )} residents.`;
  } else {
    recommendationNarrative = `Budget Allocation Notice: Your current budget of ${formatCompactINR(
      budget
    )} is lower than the allocation required for "${bestOption.title}" (${formatCompactINR(
      bestOption.estimated_cost
    )}). Consider increasing budget allocation to at least ${formatCompactINR(
      bestOption.estimated_cost
    )} or selecting an alternative phased project for ${wardName}.`;
  }

  return {
    options: scaledOptions.map(({ fitsBudget, ...rest }) => rest),
    recommendation: recommendationNarrative,
    disclaimer: 'Prototype simulation — estimated impact only',
  };
}

export default function WhatIfSimulatorPage() {
  // Budget state (default ₹50 Lakh = 5,000,000)
  const [budget, setBudget] = useState<number>(5000000);
  const [wardId, setWardId] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [hasSimulated, setHasSimulated] = useState<boolean>(true);
  const [simulationCount, setSimulationCount] = useState<number>(1);

  // Current simulation result state
  const [results, setResults] = useState<SimulationResult>(() =>
    calculateSimulation(5000000, '', '')
  );

  // Recommended option index in current results
  const recommendedIndex = useMemo(() => {
    if (!results || !results.options || results.options.length === 0) return 0;

    const matchIdx = results.options.findIndex((opt) =>
      results.recommendation.includes(opt.title)
    );
    return matchIdx !== -1 ? matchIdx : 0;
  }, [results]);

  // Handle budget input changes
  const handleBudgetChange = (value: number) => {
    const clamped = Math.max(0, Math.min(10000000, value || 0));
    setBudget(clamped);
  };

  // Run simulation handler
  const handleSimulate = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const newResults = calculateSimulation(budget, wardId, category);
      setResults(newResults);
      setHasSimulated(true);
      setSimulationCount((prev) => prev + 1);
      setIsSimulating(false);
    }, 400);
  };

  // Reset to default scenario
  const handleReset = () => {
    setBudget(5000000);
    setWardId('');
    setCategory('');
    const defaultRes = calculateSimulation(5000000, '', '');
    setResults(defaultRes);
    setHasSimulated(true);
  };

  const selectedWardObj = MOCK_WARDS.find((w) => w.id.toString() === wardId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">What-If Budget Simulator</h1>
          <p className="text-sm text-slate-600 mt-1">
            Model municipal budget allocations, evaluate project trade-offs, and project civic impact
          </p>
        </div>

        <button
          onClick={handleReset}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-2xs transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          Reset Parameters
        </button>
      </div>

      {/* Control Panel / Simulation Inputs */}
      <div className="bg-white rounded-md border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Simulation Parameters & Budget Constraints
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Fixity Municipal Planning Engine
          </span>
        </div>

        <div className="p-5 space-y-5">
          {/* Budget Input Section */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label
                htmlFor="budget-input"
                className="text-sm font-semibold text-slate-800 flex items-center gap-1.5"
              >
                <span>Total Capital Budget Allocation (₹)</span>
                <span className="text-xs text-slate-500 font-normal">
                  (Up to ₹1,00,00,000 / 1 Crore)
                </span>
              </label>

              {/* Formatted Display Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded border border-blue-200 bg-blue-50/70 text-blue-900 text-xs font-bold">
                <span>Selected:</span>
                <span className="text-blue-800 text-sm font-extrabold">
                  {formatCompactINR(budget)}
                </span>
                <span className="text-[11px] font-normal text-slate-600">
                  ({formatINR(budget)})
                </span>
              </div>
            </div>

            {/* Number Input and Slider Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              {/* Numeric Input */}
              <div className="lg:col-span-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-medium">
                  <IndianRupee className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  id="budget-input"
                  type="number"
                  min={0}
                  max={10000000}
                  step={50000}
                  value={budget || ''}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  placeholder="Enter amount in ₹"
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 focus:border-blue-700 rounded-md text-sm font-semibold text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-700"
                />
              </div>

              {/* Range Slider */}
              <div className="lg:col-span-8 flex flex-col justify-center space-y-1">
                <input
                  type="range"
                  min={0}
                  max={10000000}
                  step={50000}
                  value={budget}
                  onChange={(e) => handleBudgetChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-700"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>₹0</span>
                  <span>₹25 Lakh</span>
                  <span>₹50 Lakh</span>
                  <span>₹75 Lakh</span>
                  <span>₹1.00 Crore</span>
                </div>
              </div>
            </div>

            {/* Budget Presets */}
            <div className="flex items-center flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-500 font-medium mr-1">Budget Presets:</span>
              {BUDGET_PRESETS.map((preset) => {
                const isActive = budget === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => handleBudgetChange(preset.value)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-all border ${
                      isActive
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ward Filter */}
              <div className="space-y-1">
                <label
                  htmlFor="ward-select"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-700" />
                  Target Municipal Ward
                </label>
                <select
                  id="ward-select"
                  value={wardId}
                  onChange={(e) => setWardId(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-700 rounded-md px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer"
                >
                  <option value="">All Wards (City-wide Model)</option>
                  {MOCK_WARDS.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.zone} Zone)
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1">
                <label
                  htmlFor="category-select"
                  className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Filter className="w-3.5 h-3.5 text-blue-700" />
                  Priority Sector
                </label>
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 focus:border-blue-700 rounded-md px-3 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-700 cursor-pointer"
                >
                  <option value="">All Sectors</option>
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Multi-criteria assessment based on demand priority and cost efficiency index</span>
            </div>

            <button
              id="simulate-btn"
              type="button"
              disabled={isSimulating}
              onClick={handleSimulate}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs rounded-md shadow-2xs transition-colors cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Computing Models...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Run Allocation Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Simulation Output Area */}
      {isSimulating && (
        <div className="py-12 text-center space-y-3 bg-white rounded-md border border-slate-200 shadow-xs">
          <Loader2 className="w-6 h-6 animate-spin text-blue-700 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Calculating Municipal Scenarios...</h3>
            <p className="text-xs text-slate-500">Evaluating population reach and severity mitigation index</p>
          </div>
        </div>
      )}

      {!isSimulating && hasSimulated && results && (
        <div className="space-y-6">
          {/* Top Recommendation Box */}
          <div className="rounded-md border border-blue-200 bg-blue-50/50 p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-700 text-white rounded shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Optimal Project Recommendation
                  </h2>
                  <span className="text-xs text-slate-500">
                    Run #{simulationCount} • Budget: {formatCompactINR(budget)}
                  </span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {results.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Project Options Comparison */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-700" />
                Capital Project Proposals
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                4 Scenarios Evaluated
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.options.map((option, idx) => {
                const isRecommended = idx === recommendedIndex;
                const fitsBudget = option.estimated_cost <= budget;
                const costDifference = Math.abs(budget - option.estimated_cost);

                return (
                  <div
                    key={option.title}
                    className={`rounded-md border p-5 bg-white flex flex-col justify-between space-y-4 ${
                      isRecommended
                        ? 'border-blue-700 shadow-xs ring-1 ring-blue-700'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Header */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold uppercase tracking-wider rounded">
                          {option.category}
                        </span>

                        {fitsBudget ? (
                          <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider rounded">
                            Within Budget
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] font-bold uppercase tracking-wider rounded">
                            Exceeds by {formatCompactINR(costDifference)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">
                        {option.title}
                      </h3>

                      {/* Cost */}
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Estimated Cost</span>
                          <span className="text-lg font-bold text-slate-900">₹{option.estimated_cost.toLocaleString('en-IN')}</span>
                        </div>
                        <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                          {formatCompactINR(option.estimated_cost)}
                        </span>
                      </div>

                      {/* Key Indicators */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 border border-slate-200 rounded bg-white">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Population Impact</span>
                          <span className="font-bold text-slate-900">{option.affected_population.toLocaleString('en-IN')} residents</span>
                        </div>

                        <div className="p-2.5 border border-slate-200 rounded bg-white">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Priority Score</span>
                          <span className="font-bold text-slate-900">{option.priority_score} / 100</span>
                        </div>

                        <div className="p-2.5 border border-slate-200 rounded bg-white">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Impact Efficacy</span>
                          <span className="font-bold text-emerald-700">{option.impact_estimate}%</span>
                        </div>

                        <div className="p-2.5 border border-slate-200 rounded bg-white">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">Cost Efficiency</span>
                          <span className="font-bold text-blue-800">{option.cost_efficiency} pts/₹L</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      {isRecommended ? (
                        <span className="font-bold text-blue-800 flex items-center gap-1">
                          <Star size={12} className="fill-blue-700 text-blue-700" />
                          Recommended Option
                        </span>
                      ) : (
                        <span>Option Proposal</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRITICAL: Mandatory Disclaimer */}
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900 flex items-start gap-3 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold uppercase tracking-wider text-amber-800 block">
                Prototype simulation — estimated impact only
              </span>
              <p className="mt-0.5 text-amber-900">
                Projections are generated for administrative scenario planning and preliminary capital budget exploration. Final project sanctioning requires municipal council resolution, engineering audit, and procurement tender.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

