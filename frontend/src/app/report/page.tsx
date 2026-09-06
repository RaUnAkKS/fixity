'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { COMPLAINT_CATEGORIES, LANGUAGES } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  Send,
  MapPin,
  ImagePlus,
  Mic,
  Languages as LanguagesIcon,
  Tag,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  Building2,
  Crosshair,
  Sparkles,
  Camera,
  Check,
  RotateCcw,
  Zap,
} from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] bg-slate-100 rounded-xl border border-slate-200/80 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
      <MapPin className="h-6 w-6" />
      <span className="text-xs">Loading municipal map grid...</span>
    </div>
  ),
});

interface ScanResult {
  description: string;
  category: string;
  subcategory?: string;
  severity: number;
  detected_issues: string[];
  suggested_department: string;
  is_relevant: boolean;
  has_exif_gps: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

function detectLanguageFromText(str: string): string | null {
  if (!str) return null;
  if (/[\u0900-\u097F]/.test(str)) return 'hi'; // Devanagari (Hindi)
  if (/[\u0980-\u09FF]/.test(str)) return 'bn'; // Bengali
  if (/[\u0B80-\u0BFF]/.test(str)) return 'ta'; // Tamil
  if (/[\u0C00-\u0C7F]/.test(str)) return 'te'; // Telugu
  if (/[\u0A80-\u0AFF]/.test(str)) return 'gu'; // Gujarati
  if (/[\u0C80-\u0CFF]/.test(str)) return 'kn'; // Kannada
  if (/[\u0D00-\u0D7F]/.test(str)) return 'ml'; // Malayalam
  if (/[\u0A00-\u0A7F]/.test(str)) return 'pa'; // Punjabi
  if (/[\u0600-\u06FF]/.test(str)) return 'ur'; // Urdu
  return null;
}

export default function ReportPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { language: appLang, t } = useLanguage();
  const geo = useGeolocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState<number | null>(28.6475);
  const [longitude, setLongitude] = useState<number | null>(77.3150);
  const [address, setAddress] = useState<string>('Near Anand Vihar, Ward 14, Delhi');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reverse geocoding helper
  const fetchAddressForCoords = async (lat: number, lng: number) => {
    try {
      setResolvingAddress(true);
      const res = await api.get<any>(`/api/complaints/reverse-geocode?lat=${lat}&lng=${lng}`);
      if (res && res.address) {
        setAddress(res.address);
      }
    } catch (e) {
      console.warn('Geocoding notice:', e);
    } finally {
      setResolvingAddress(false);
    }
  };

  // Locate User GPS
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        fetchAddressForCoords(lat, lng);
        setLocatingUser(false);
      },
      (err) => {
        console.warn('Geolocation warning:', err);
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // AI Auto-Scan State
  const [scanningPhoto, setScanningPhoto] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [autoFilled, setAutoFilled] = useState(false);

  // Pre-fill text and language from query param (e.g. redirected from voice report)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initialText = params.get('text');
      const initialLang = params.get('lang') || params.get('language');

      if (initialText) {
        setText(initialText);
        if (initialLang) {
          let normalized = initialLang.toLowerCase().trim();
          if (normalized === 'hindi') normalized = 'hi';
          else if (normalized === 'bengali') normalized = 'bn';
          else if (normalized === 'tamil') normalized = 'ta';
          else if (normalized === 'telugu') normalized = 'te';
          else if (normalized === 'marathi') normalized = 'mr';
          else if (normalized === 'gujarati') normalized = 'gu';
          else if (normalized === 'kannada') normalized = 'kn';
          else if (normalized === 'malayalam') normalized = 'ml';
          else if (normalized === 'punjabi') normalized = 'pa';
          else if (normalized === 'urdu') normalized = 'ur';
          else if (normalized === 'english') normalized = 'en';

          setLanguage(normalized);
        } else {
          const autoLang = detectLanguageFromText(initialText);
          if (autoLang) {
            setLanguage(autoLang);
          }
        }
      } else if (initialLang) {
        setLanguage(initialLang.toLowerCase().trim());
      }
    }
  }, []);

  // Update from browser geolocation on mount if available
  useEffect(() => {
    if (geo.latitude && geo.longitude) {
      setLatitude(geo.latitude);
      setLongitude(geo.longitude);
      fetchAddressForCoords(geo.latitude, geo.longitude);
    }
  }, [geo.latitude, geo.longitude]);

  // Default location (Anand Vihar / New Delhi)
  const defaultLat = 28.6475;
  const defaultLng = 77.3150;
  const mapCenter: [number, number] = [
    latitude || defaultLat,
    longitude || defaultLng,
  ];

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
    fetchAddressForCoords(lat, lng);
  };

  // AI Photo Scan Handler
  const handlePhotoScan = async (file: File) => {
    setPhoto(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setScanningPhoto(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post<ScanResult>('/api/complaints/scan-photo', formData);
      setScanResult(res);

      if (res.description) {
        setText(res.description);
      }
      if (res.category) {
        setCategory(res.category);
      }
      if (res.has_exif_gps && res.latitude && res.longitude) {
        setLatitude(res.latitude);
        setLongitude(res.longitude);
      }
      setAutoFilled(true);
    } catch (err: any) {
      console.warn('Photo scan error:', err);
    } finally {
      setScanningPhoto(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handlePhotoScan(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    setScanResult(null);
    setAutoFilled(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError(t('error_fill_description'));
      return;
    }

    if (!latitude || !longitude) {
      setError(t('error_fill_location'));
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create complaint
      const complaint = await api.post<{ id: string }>('/api/complaints', {
        original_text: text,
        latitude: latitude || 28.6475,
        longitude: longitude || 77.3150,
        address: address.trim() || undefined,
        language,
        category: category || undefined,
      });

      // Step 2: Upload evidence photo if attached
      if (photo) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('evidence_type', 'photo');
        await api.post(`/api/complaints/${complaint.id}/evidence`, formData);
      }

      // Step 3: Trigger AI analysis in background without delaying user navigation
      api.post(`/api/complaints/${complaint.id}/analyze`).catch((err) => {
        console.warn('AI background analysis notice:', err);
      });

      setSuccess(true);
      router.push(`/complaints/${complaint.id}`);
    } catch (err: any) {
      setError(err.message || (appLang === 'hi' ? 'शिकायत दर्ज करने में विफल। पुनः प्रयास करें।' : 'Failed to register complaint. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, prompt sign-in
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 bg-slate-50">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-md shadow-sm">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 text-blue-700 mb-4 border border-blue-100">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {appLang === 'hi' ? 'नागरिक शिकायत पंजीकरण' : 'Citizen Grievance Registration'}
          </h1>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            {t('error_auth_required')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-800 transition-colors shadow-sm shadow-blue-700/20"
            >
              {t('sign_in')}
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {appLang === 'hi' ? 'नया खाता बनाएं' : 'Register Account'}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 bg-slate-50">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center max-w-md shadow-sm">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 mb-4 border border-emerald-100">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            {t('report_success_title')}
          </h1>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            {t('report_success_desc')}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
            {t('redirecting_case_file')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {t('report_title')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t('report_subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/report/voice"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold hover:bg-blue-100 transition-colors shadow-xs"
            >
              <Mic className="h-4 w-4 text-blue-600" />
              <span>{t('voice_report_btn')}</span>
            </Link>
          </div>
        </div>

        {/* HERO ACCESSIBILITY CARD: Snap & Auto-Scan with AI */}
        <div className="mb-6 bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden border border-blue-800/50">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 text-[11px] font-bold">
                <Sparkles className="h-3.5 w-3.5 text-blue-300 animate-pulse" />
                {t('hero_card_badge')}
              </div>
              {autoFilled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
                  <Check className="h-3 w-3" /> {t('form_autofilled')}
                </span>
              )}
            </div>

            <h2 className="text-base font-bold text-white mb-1">
              {t('hero_card_title')}
            </h2>
            <p className="text-xs text-blue-100/80 mb-4 max-w-xl leading-relaxed">
              {t('hero_card_desc')}
            </p>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {!photoPreview ? (
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-blue-50 transition-all shadow-sm cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-blue-700" />
                  {t('btn_snap_photo')}
                </button>
                <div className="flex items-center gap-2 text-[11px] text-blue-200/70 self-center">
                  <Zap className="h-3.5 w-3.5 text-amber-300" />
                  {t('scan_meta_hint')}
                </div>
              </div>
            ) : scanningPhoto ? (
              <div className="flex items-center gap-3 bg-blue-950/60 rounded-xl p-3.5 border border-blue-400/30">
                <Loader2 className="h-5 w-5 text-blue-300 animate-spin shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white">{t('scanning_title')}</div>
                  <div className="text-[11px] text-blue-200/70">{t('scanning_desc')}</div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900/80 rounded-xl p-3 border border-blue-400/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={photoPreview}
                    alt="Scanned Preview"
                    className="h-14 w-14 rounded-lg object-cover border border-white/20 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {t('scan_complete')}
                    </div>
                    <div className="text-[11px] text-blue-100/90 font-medium line-clamp-1">
                      {scanResult?.category || 'Civic Issue'} • {scanResult?.suggested_department || 'Municipal Corporation'}
                    </div>
                    {scanResult?.has_exif_gps ? (
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {t('gps_photo_extracted')}: {latitude?.toFixed(4)}, {longitude?.toFixed(4)}
                      </div>
                    ) : (
                      <div className="text-[10px] text-blue-300/70">
                        {t('gps_device_set')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-800/80 hover:bg-blue-700 text-white text-[11px] font-semibold border border-blue-400/20 transition-all cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> {t('btn_rescan')}
                  </button>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-500/30 transition-all cursor-pointer"
                    title="Remove Photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Visual Diagnosis Summary Tag Pill List */}
            {scanResult && scanResult.detected_issues && scanResult.detected_issues.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-800/40 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-blue-300 text-[10px] uppercase font-bold tracking-wider mr-1">
                  {t('hazards_detected')}
                </span>
                {scanResult.detected_issues.map((issue, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/30 text-blue-100 font-medium text-[10px]"
                  >
                    {issue}
                  </span>
                ))}
                {scanResult.severity && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    scanResult.severity >= 70
                      ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                      : scanResult.severity >= 40
                      ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                      : 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
                  }`}>
                    {t('severity_score_label')} {scanResult.severity}/100
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* SECTION 1: Issue Details */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('step_problem_details')}
              </span>
              {autoFilled ? (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="h-3 w-3" /> {t('autofilled_from_photo')}
                </span>
              ) : (
                <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> {t('multilingual_ai_active')}
                </span>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-bold text-slate-800 mb-1.5"
              >
                {t('label_problem_description')} <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="description"
                rows={4}
                value={text}
                onChange={(e) => {
                  const val = e.target.value;
                  setText(val);
                  const detected = detectLanguageFromText(val);
                  if (detected && (language === 'en' || !language)) {
                    setLanguage(detected);
                  }
                }}
                placeholder={t('placeholder_description')}
                className="w-full rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all resize-y"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <LanguagesIcon className="h-3.5 w-3.5 text-slate-400" />
                  {t('label_language_select')}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none font-medium"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  {t('label_category')}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none font-medium"
                >
                  <option value="">
                    {t('auto_detect_category')}
                  </option>
                  {COMPLAINT_CATEGORIES.map((cat) => {
                    const hiNames: Record<string, string> = {
                      'Road Infrastructure': 'सड़क एवं गड्ढे (Roads)',
                      'Water Supply': 'जल आपूर्ति (Water Supply)',
                      'Drainage & Sewage': 'नाली एवं सीवर (Drainage)',
                      'Sanitation & Waste': 'कचरा एवं सफाई (Sanitation)',
                      'Electricity': 'बिजली एवं स्ट्रीटलाइट (Electricity)',
                      'Healthcare': 'स्वास्थ्य सेवाएं (Healthcare)',
                      'Education': 'शिक्षा (Education)',
                      'Public Transport': 'सार्वजनिक परिवहन (Transport)',
                      'Parks & Recreation': 'पार्क एवं हरियाली (Parks)',
                      'Building & Construction': 'भवन निर्माण (Construction)',
                      'Pollution': 'प्रदूषण (Pollution)',
                      'Public Safety': 'सार्वजनिक सुरक्षा (Safety)',
                      'Other': 'अन्य समस्या (Other)',
                    };
                    const label = appLang === 'hi' && hiNames[cat] ? hiNames[cat] : cat;
                    return (
                      <option key={cat} value={cat}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Location & Map Pinning */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-blue-600" />
                {t('step_location')}
              </span>
              
              <div className="flex items-center gap-2">
                {latitude && longitude && (
                  <span className="text-[11px] font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                    <Crosshair className="h-3 w-3 text-emerald-600" />
                    {latitude.toFixed(4)}, {longitude.toFixed(4)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleLocateMe}
                  disabled={locatingUser}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 hover:bg-blue-100/80 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  {locatingUser ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  <span>{locatingUser ? 'Locating...' : 'Locate Me'}</span>
                </button>
              </div>
            </div>

            {/* Resolved Address & Landmark Input */}
            <div className="space-y-2">
              <label htmlFor="landmark-input" className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>Verified Location &amp; Landmark</span>
                {resolvingAddress && (
                  <span className="text-[10px] text-blue-600 font-normal flex items-center gap-1">
                    <Loader2 className="h-2.5 w-2.5 animate-spin" /> Resolving address...
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  id="landmark-input"
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Metro Pillar 148, Outer Ring Road Link, Anand Vihar"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-all font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-500">
                Auto-resolved from map coordinates. You can also specify exact landmarks or house/gate numbers.
              </p>
            </div>

            {/* Quick Locality Hotspots */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Select:</span>
              {[
                { name: 'Anand Vihar (Ward 14)', lat: 28.6475, lng: 77.3150 },
                { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
                { name: 'Karol Bagh', lat: 28.6515, lng: 77.1906 },
                { name: 'Rohini Sector 7', lat: 28.7118, lng: 77.1235 },
                { name: 'Hauz Khas', lat: 28.5494, lng: 77.2001 },
              ].map((loc) => (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => {
                    setLatitude(loc.lat);
                    setLongitude(loc.lng);
                    setAddress(`Near ${loc.name}, Delhi`);
                    fetchAddressForCoords(loc.lat, loc.lng);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-[10px] font-semibold text-slate-600 border border-slate-200 transition-all cursor-pointer"
                >
                  {loc.name}
                </button>
              ))}
            </div>

            {/* Interactive Map Canvas with Pin */}
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs relative">
              <MapComponent
                center={mapCenter}
                zoom={14}
                markerPosition={[latitude || defaultLat, longitude || defaultLng]}
                onLocationSelect={handleLocationSelect}
                height="320px"
              />
              <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200 text-[10px] font-semibold text-slate-600 shadow-xs pointer-events-none">
                📍 Click map or drag pin to fine-tune exact spot
              </div>
            </div>
          </div>

          {/* SECTION 3: Evidence */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('step_evidence')}
              </span>
              {photo && (
                <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="h-3 w-3" /> {t('evidence_ready')}
                </span>
              )}
            </div>

            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Evidence Preview"
                  className="h-44 w-auto rounded-xl border border-slate-200 object-cover shadow-xs"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-sm cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 cursor-pointer hover:bg-slate-50 hover:border-blue-400 transition-all"
              >
                <ImagePlus className="h-6 w-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-blue-700">
                  {t('click_to_attach')}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">JPEG, PNG, WebP</span>
              </label>
            )}
          </div>

          {/* SECTION 4: Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || scanningPhoto}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-700/20 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('btn_submitting')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t('btn_submit_report')}
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}


