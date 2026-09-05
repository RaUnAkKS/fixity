'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Camera, CheckCircle2, AlertCircle, Send, ArrowLeft, Building2 } from 'lucide-react';

export default function VerifyPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [resolutionStatus, setResolutionStatus] = useState<'resolved' | 'partial' | 'not_fixed' | ''>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTimeout(() => {
      setSubmitted(true);
    }, 400);
  };

  if (submitted) {
    return (
      <div className="bg-slate-50 min-h-screen py-12 flex items-center justify-center">
        <div className="bg-white rounded-md border border-slate-200 p-8 text-center max-w-md shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={24} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Resolution Verification Recorded</h1>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Thank you for verifying the municipal repair work. Your evaluation has been registered into the Fixity resolution metrics database.
          </p>
          <div className="flex gap-3 justify-center">
            <Link 
              href={`/complaints/${id}`}
              className="px-4 py-2 bg-blue-700 text-white rounded text-xs font-bold hover:bg-blue-800 transition-colors"
            >
              Return to Case File
            </Link>
            <Link 
              href="/dashboard"
              className="px-4 py-2 bg-white text-slate-700 border border-slate-300 rounded text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              View Operations Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        
        <div className="mb-4">
          <Link 
            href={`/complaints/${id}`}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back to Case File #{id}
          </Link>
        </div>

        <div className="bg-white rounded-md border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" /> Official Resolution Verification Form
          </div>
          <h1 className="text-xl font-bold text-slate-900">Verify Resolution Work</h1>
          <p className="text-xs text-slate-600 mt-1">
            Provide citizen inspection feedback on the completed municipal works for Case #{id}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-md border border-slate-200 shadow-sm">
          
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-900">
              WAS THE REPORTED PROBLEM ACTUALLY FIXED? <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'resolved', label: 'Yes, Fully Resolved', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300' },
                { id: 'partial', label: 'Partially Improved', icon: AlertCircle, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300' },
                { id: 'not_fixed', label: 'Not Fixed at All', icon: AlertCircle, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300' },
              ].map((option) => {
                const Icon = option.icon;
                const isSelected = resolutionStatus === option.id;
                return (
                  <button
                    type="button"
                    key={option.id}
                    onClick={() => setResolutionStatus(option.id as any)}
                    className={`flex flex-col items-center justify-center p-3 border rounded text-xs font-semibold transition-all ${
                      isSelected 
                        ? `${option.border} ${option.bg} text-slate-900 font-bold ring-1 ring-blue-700` 
                        : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <Icon className={`mb-1.5 ${isSelected ? option.color : 'text-slate-400'}`} size={20} />
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              RATE THE QUALITY OF COMPLETED WORK <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-105"
                >
                  <Star
                    size={28}
                    className={`${
                      star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900">
              UPLOAD INSPECTION PHOTO EVIDENCE <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            
            {!photoUrl ? (
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="text-center text-xs text-slate-600">
                  <Camera className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                  <span>Click to attach verification photo</span>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              </label>
            ) : (
              <div className="relative w-full h-40 rounded border border-slate-300 overflow-hidden">
                <img src={photoUrl} alt="Inspection Photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="absolute top-2 right-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded hover:bg-slate-900"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="block text-xs font-bold text-slate-900">
              CITIZEN FEEDBACK COMMENTS
            </label>
            <textarea
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded text-xs text-slate-900 focus:border-blue-700 outline-none"
              placeholder="Provide specific notes regarding the condition of the repaired area..."
            />
          </div>

          <button
            type="submit"
            disabled={!resolutionStatus || rating === 0}
            className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-bold"
          >
            <Send className="mr-1.5" size={16} />
            SUBMIT VERIFICATION RECORD
          </button>

        </form>
      </div>
    </div>
  );
}
