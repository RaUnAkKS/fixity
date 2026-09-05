'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { COMPLAINT_CATEGORIES, LANGUAGES } from '@/lib/types';
import {
  Send,
  MapPin,
  ImagePlus,
  Mic,
  Globe,
  Tag,
  AlertCircle,
  Loader2,
  X,
  CheckCircle2,
  FileText,
  Building2,
  ShieldCheck
} from 'lucide-react';

const MapComponent = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="h-[350px] bg-slate-100 rounded-md border border-slate-200 animate-pulse flex items-center justify-center">
      <MapPin className="h-6 w-6 text-slate-400" />
    </div>
  ),
});

export default function ReportPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const geo = useGeolocation();

  const [text, setText] = useState('');
  const [language, setLanguage] = useState('en');
  const [category, setCategory] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Pre-fill text from query param (e.g. redirected from voice report)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const initialText = params.get('text');
      if (initialText) {
        setText(initialText);
      }
    }
  }, []);

  // Set location from geolocation
  useEffect(() => {
    if (geo.latitude && geo.longitude && !latitude && !longitude) {
      setLatitude(geo.latitude);
      setLongitude(geo.longitude);
    }
  }, [geo.latitude, geo.longitude, latitude, longitude]);

  // Default location (New Delhi) if GPS not available
  const defaultLat = 28.6139;
  const defaultLng = 77.209;
  const mapCenter: [number, number] = [
    latitude || defaultLat,
    longitude || defaultLng,
  ];

  const handleLocationSelect = (lat: number, lng: number) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!text.trim()) {
      setError('Please provide a detailed description of the civic problem');
      return;
    }

    if (!latitude || !longitude) {
      setError('Please confirm or select the location on the municipal map');
      return;
    }

    setLoading(true);
    try {
      // Step 1: Create complaint
      const complaint = await api.post<{ id: string }>('/api/complaints', {
        original_text: text,
        latitude,
        longitude,
        language,
        category: category || undefined,
      });

      // Step 2: Upload evidence photo
      if (photo) {
        const formData = new FormData();
        formData.append('file', photo);
        formData.append('evidence_type', 'photo');
        await api.post(`/api/complaints/${complaint.id}/evidence`, formData);
      }

      // Step 3: Trigger AI analysis
      try {
        await api.post(`/api/complaints/${complaint.id}/analyze`);
      } catch {
        console.warn('Automated analysis trigger fallback activated');
      }

      setSuccess(true);

      setTimeout(() => {
        router.push(`/complaints/${complaint.id}`);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to register complaint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If not authenticated, prompt sign-in
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 bg-slate-50">
        <div className="bg-white rounded-md border border-slate-200 p-8 text-center max-w-md shadow-sm">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded bg-blue-50 text-blue-700 mb-4 border border-blue-200">
            <Building2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Citizen Grievance Registration
          </h1>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            Please sign in to your Fixity account to register a complaint and track department resolution updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-5 py-2 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Register Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-12 bg-slate-50">
        <div className="bg-white rounded-md border border-slate-200 p-8 text-center max-w-md shadow-sm">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded bg-emerald-50 text-emerald-700 mb-4 border border-emerald-200">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Complaint Registered Successfully
          </h1>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Your grievance has been filed into the Fixity municipal tracking system. Automatic department routing is underway.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
            Redirecting to official case record...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        
        {/* Header */}
        <div className="bg-white rounded-md border border-slate-200 p-6 mb-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Building2 className="h-4 w-4" /> Official Complaint Portal
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Report a Civic Issue
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Provide the details below so the issue can be assigned to the appropriate municipal department.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          {/* SECTION 1: Issue Details */}
          <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4 flex items-center justify-between">
              <span>SECTION 1: Issue Details</span>
              <Link
                href="/report/voice"
                className="inline-flex items-center gap-1.5 text-xs text-blue-700 font-semibold hover:underline"
              >
                <Mic className="h-3.5 w-3.5" /> Use Voice Registration
              </Link>
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="description"
                  className="block text-xs font-semibold text-slate-800 mb-1.5"
                >
                  Problem Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Describe the civic issue in detail (e.g. location markers, severity, duration of problem). You may write in any preferred Indian language."
                  className="w-full rounded-md border border-slate-300 bg-white p-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 focus:outline-none transition-colors resize-y"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Automatic translation is enabled for all regional languages.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Reported Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                    Category Preference
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="">Auto-detect Department Category</option>
                    {COMPLAINT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Location */}
          <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">
              SECTION 2: Location & Ward Details
            </h2>

            <div className="space-y-3">
              <p className="text-xs text-slate-600">
                Click on the map or drag the marker to pinpoint the exact location of the issue.
              </p>

              {geo.loading ? (
                <div className="h-[350px] bg-slate-100 rounded-md flex items-center justify-center border border-slate-200">
                  <div className="text-center">
                    <Loader2 className="h-6 w-6 text-blue-700 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-600">Acquiring GPS Coordinates...</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-md overflow-hidden border border-slate-300">
                  <MapComponent
                    center={mapCenter}
                    zoom={14}
                    markerPosition={latitude && longitude ? [latitude, longitude] : null}
                    onLocationSelect={handleLocationSelect}
                    height="350px"
                  />
                </div>
              )}

              {latitude && longitude && (
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <span>GPS Position: <strong>{latitude.toFixed(6)}, {longitude.toFixed(6)}</strong></span>
                  {!geo.latitude && (
                    <span className="text-amber-700 font-medium">Default location — click map to adjust</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Evidence */}
          <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-3 mb-4">
              SECTION 3: Photo Evidence <span className="text-slate-400 font-normal text-xs">(Optional)</span>
            </h2>

            {photoPreview ? (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Evidence Preview"
                  className="h-44 w-auto rounded border border-slate-300 object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-sm"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center h-28 rounded-md border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
                <div className="text-center text-xs text-slate-600">
                  <ImagePlus className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                  <span className="font-semibold text-blue-700">Click to upload photo evidence</span> (JPEG, PNG)
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* SECTION 4: Automated Classification Banner */}
          <div className="bg-slate-100 rounded-md border border-slate-300 p-4 text-xs text-slate-700 flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">Automatic Department Routing & Priority Calculation</span>
              Upon submission, your complaint will be processed through Fixity&apos;s automated classification system to determine severity, ward priority, and assigned municipal officers.
            </div>
          </div>

          {/* SECTION 5: Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  SUBMITTING COMPLAINT...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  SUBMIT COMPLAINT
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
