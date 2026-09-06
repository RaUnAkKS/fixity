'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  ArrowLeft,
  Star,
  ShieldCheck,
  AlertCircle,
  Send,
  Loader2,
  ThumbsUp,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export default function VerifyResolutionPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { t, language } = useLanguage();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [resolutionStatus, setResolutionStatus] = useState<'fixed' | 'partial' | 'not_fixed' | ''>('');
  const [comment, setComment] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !resolutionStatus) {
      setError(language === 'hi' ? 'कृपया स्टार रेटिंग दें और समाधान स्थिति चुनें।' : 'Please provide a star rating and select the resolution status.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await api.post(`/api/complaints/${id}/verify`, {
        rating,
        status: resolutionStatus,
        comment
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || (language === 'hi' ? 'सत्यापन जमा करने में विफल' : 'Failed to submit verification'));
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] bg-slate-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            {language === 'hi' ? 'सत्यापन सफलतापूर्वक दर्ज हुआ' : 'Verification Submitted'}
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            {t('verification_success')}
          </p>
          <div className="pt-2">
            <Link 
              href="/complaints" 
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-700/20"
            >
              {language === 'hi' ? '← मेरी शिकायतों पर वापस जाएं' : 'Return to My Complaints'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="max-w-xl mx-auto px-4 sm:px-6 space-y-5">
        <div>
          <Link href={`/complaints/${id}`} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors mb-3">
            <ArrowLeft className="h-4 w-4" /> {language === 'hi' ? 'शिकायत विवरण पर वापस जाएं' : 'Back to Case Details'}
          </Link>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t('verify_title')}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('verify_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 space-y-6 shadow-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Resolution Status Radio Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('verify_status_label')} <span className="text-rose-500">*</span>
            </label>
            <div className="grid gap-2.5">
              {[
                { 
                  id: 'fixed', 
                  label: t('verify_status_fixed'), 
                  desc: language === 'hi' ? 'कार्य 100% संतोषजनक रूप से पूर्ण हुआ' : 'Work is 100% complete to standard', 
                  icon: ThumbsUp, 
                  color: 'text-emerald-600' 
                },
                { 
                  id: 'partial', 
                  label: t('verify_status_partial'), 
                  desc: language === 'hi' ? 'कार्य शुरू हुआ है परंतु अभी अधूरा है' : 'Work has begun but is incomplete', 
                  icon: AlertTriangle, 
                  color: 'text-amber-600' 
                },
                { 
                  id: 'not_fixed', 
                  label: t('verify_status_not_fixed'), 
                  desc: language === 'hi' ? 'समस्या अभी भी वैसी ही बनी हुई है' : 'Problem still persists unchanged', 
                  icon: XCircle, 
                  color: 'text-rose-600' 
                },
              ].map((option) => (
                <label
                  key={option.id}
                  className={`flex items-center gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    resolutionStatus === option.id
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="resolutionStatus"
                    value={option.id}
                    checked={resolutionStatus === option.id}
                    onChange={(e) => setResolutionStatus(e.target.value as any)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
                  />
                  <option.icon className={`h-5 w-5 shrink-0 ${option.color}`} />
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-900">{option.label}</span>
                    <span className="block text-[11px] text-slate-500">{option.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Star Rating Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('verify_rating_label')} <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1.5 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        (hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700 ml-2">
                {rating > 0 
                  ? `${rating} / 5 ${language === 'hi' ? 'सितारे' : 'Stars'}` 
                  : (language === 'hi' ? 'रेटिंग चुनें' : 'Select rating')}
              </span>
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-1.5">
            <label htmlFor="comment" className="block text-xs font-bold uppercase tracking-wider text-slate-800">
              {t('verify_comment_label')}
            </label>
            <textarea 
              id="comment"
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t('verify_comment_placeholder')}
              className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 transition-all resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-700/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('btn_submitting_verification')}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t('btn_submit_verification')}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

