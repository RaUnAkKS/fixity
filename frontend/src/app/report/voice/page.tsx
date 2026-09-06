'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mic,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Languages,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { api } from '@/lib/api';
import { TranscriptionResult, LANGUAGES } from '@/lib/types';
import { useLanguage } from '@/context/LanguageContext';

export default function VoiceReportPage() {
  const router = useRouter();
  const { language: appLang, t } = useLanguage();

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Transcription states
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [languageHint, setLanguageHint] = useState('');

  // UI status
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Format timer MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Transcribe audio using backend API
  const handleTranscribe = async (blobToTranscribe: Blob, mimeType: string) => {
    setIsTranscribing(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      formData.append('audio_file', blobToTranscribe, `voice_report.${ext}`);

      if (languageHint) {
        formData.append('language', languageHint);
      }

      const result = await api.post<TranscriptionResult>('/api/voice/transcribe', formData);

      if (result && result.text) {
        setTranscribedText(result.text);
        setDetectedLanguage(result.detected_language || null);
        setConfidence(typeof result.confidence === 'number' ? result.confidence : null);
        setSuccessMessage(appLang === 'hi' ? 'आवाज सफलतापूर्वक पहचानी गई। आप नीचे दिए गए टेक्स्ट को संपादित कर सकते हैं।' : 'Speech transcription completed. You can edit the text below or proceed.');
      } else {
        setError(appLang === 'hi' ? 'आवाज पहचानी नहीं जा सकी। कृपया माइक्रोफ़ोन में स्पष्ट रूप से बोलें।' : 'No speech could be recognized. Please speak clearly into your microphone.');
      }
    } catch (err: any) {
      console.error('Voice transcription error:', err);
      setError(
        err.message ||
          (appLang === 'hi' ? 'आवाज सेवा उपलब्ध नहीं है। आप पुनः रिकॉर्ड कर सकते हैं या मैन्युअल रूप से लिख सकते हैं।' : 'Voice transcription service unavailable. You can record again or enter text manually.')
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  // Start audio recording
  const startRecording = async () => {
    setError(null);
    setSuccessMessage(null);
    setAudioBlob(null);

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }

    if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
      setError(appLang === 'hi' ? 'इस ब्राउज़र में ऑडियो रिकॉर्डिंग समर्थित नहीं है।' : 'Audio recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
        const recordedBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        setAudioBlob(recordedBlob);

        const newUrl = URL.createObjectURL(recordedBlob);
        setAudioUrl(newUrl);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        handleTranscribe(recordedBlob, actualMimeType);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError(appLang === 'hi' ? 'माइक्रोफ़ोन की अनुमति अस्वीकृत। कृपया ब्राउज़र सेटिंग्स में माइक्रोफ़ोन की अनुमति दें।' : 'Microphone permission denied. Please allow microphone access in your browser settings.');
      } else {
        setError(err.message || (appLang === 'hi' ? 'माइक्रोफ़ोन तक पहुँचने में विफल।' : 'Could not access microphone.'));
      }
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleToggleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleReset = () => {
    if (isRecording) {
      stopRecording();
    }
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setTranscribedText('');
    setDetectedLanguage(null);
    setConfidence(null);
    setError(null);
    setSuccessMessage(null);
    setRecordingDuration(0);
  };

  const handleUseText = () => {
    if (!transcribedText.trim()) {
      setError(appLang === 'hi' ? 'कृपया आगे बढ़ने से पहले अपनी बात बोलें या लिखें।' : 'Please record or enter text before proceeding.');
      return;
    }

    // Determine and normalize language
    let lang = (detectedLanguage || languageHint || '').toLowerCase().trim();
    if (lang === 'hindi') lang = 'hi';
    else if (lang === 'bengali') lang = 'bn';
    else if (lang === 'tamil') lang = 'ta';
    else if (lang === 'telugu') lang = 'te';
    else if (lang === 'marathi') lang = 'mr';
    else if (lang === 'gujarati') lang = 'gu';
    else if (lang === 'kannada') lang = 'kn';
    else if (lang === 'malayalam') lang = 'ml';
    else if (lang === 'punjabi') lang = 'pa';
    else if (lang === 'urdu') lang = 'ur';
    else if (lang === 'english') lang = 'en';

    // Auto-detect by unicode script if not set
    if (!lang || lang === 'unknown') {
      if (/[\u0900-\u097F]/.test(transcribedText)) lang = 'hi';
      else if (/[\u0980-\u09FF]/.test(transcribedText)) lang = 'bn';
      else if (/[\u0B80-\u0BFF]/.test(transcribedText)) lang = 'ta';
      else if (/[\u0C00-\u0C7F]/.test(transcribedText)) lang = 'te';
      else if (/[\u0A80-\u0AFF]/.test(transcribedText)) lang = 'gu';
      else if (/[\u0C80-\u0CFF]/.test(transcribedText)) lang = 'kn';
      else if (/[\u0D00-\u0D7F]/.test(transcribedText)) lang = 'ml';
      else if (/[\u0A00-\u0A7F]/.test(transcribedText)) lang = 'pa';
      else if (/[\u0600-\u06FF]/.test(transcribedText)) lang = 'ur';
    }

    const query = new URLSearchParams();
    query.set('text', transcribedText.trim());
    if (lang) {
      query.set('lang', lang);
    }
    router.push(`/report?${query.toString()}`);
  };


  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        
        {/* Back navigation */}
        <div className="mb-4">
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {appLang === 'hi' ? 'मानक शिकायत फॉर्म पर वापस जाएं' : 'Back to standard form'}
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 mb-5 text-center shadow-xs">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-blue-50 text-blue-700 mb-3 border border-blue-100">
            <Mic className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {appLang === 'hi' ? 'आवाज द्वारा शिकायत दर्ज करें' : 'Voice Grievance Capture'}
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {appLang === 'hi' 
              ? 'हिंदी, अंग्रेजी या किसी भी क्षेत्रीय भाषा में बोलें। एआई आवाज को टेक्स्ट में बदलकर नगर निगम को भेजेगा।' 
              : 'Speak naturally in Hindi, English, or any regional language. Fixity AI converts speech to text and automatically translates it for municipal routing.'}
          </p>
        </div>

        <div className="space-y-5">
          
          {/* Language Hint Selection */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <label htmlFor="language-select" className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-blue-700" />
                  {appLang === 'hi' ? 'बोली जाने वाली भाषा' : 'Spoken Language'}
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {appLang === 'hi' ? 'एआई को क्षेत्रीय भाषा सटीक रूप से पहचानने में मदद करता है।' : 'Helps the AI recognizer detect regional dialects accurately.'}
                </p>
              </div>
              <select
                id="language-select"
                value={languageHint}
                onChange={(e) => setLanguageHint(e.target.value)}
                disabled={isRecording || isTranscribing}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none disabled:bg-slate-50 font-medium"
              >
                <option value="">{appLang === 'hi' ? 'स्वचालित भाषा पहचान (Auto)' : 'Auto-Detect Language'}</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Studio Recording Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-6">
            
            {/* Status Pill */}
            <div className="h-8 flex items-center justify-center">
              {isRecording ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1 text-xs font-bold text-rose-700">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                  </span>
                  <span>{appLang === 'hi' ? `रिकॉर्डिंग जारी (${formatTime(recordingDuration)})` : `RECORDING (${formatTime(recordingDuration)})`}</span>
                </div>
              ) : isTranscribing ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 border border-blue-200 px-3.5 py-1 text-xs font-semibold text-blue-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>{appLang === 'hi' ? 'एआई द्वारा आवाज का विश्लेषण हो रहा है...' : 'Transcribing with AI Speech Model...'}</span>
                </div>
              ) : audioBlob ? (
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3.5 py-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{appLang === 'hi' ? `ऑडियो रिकॉर्ड हुआ (${formatTime(recordingDuration)})` : `Audio Captured (${formatTime(recordingDuration)})`}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  {appLang === 'hi' ? 'रिकॉर्डिंग शुरू करने के लिए माइक बटन दबाएं' : 'Press the microphone button to start recording'}
                </span>
              )}
            </div>

            {/* Pulsing Aura & Big Button */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={handleToggleRecord}
                disabled={isTranscribing}
                className={`relative rounded-full w-24 h-24 flex items-center justify-center text-white font-bold transition-all shadow-lg cursor-pointer ${
                  isRecording
                    ? 'bg-rose-600 hover:bg-rose-700 ring-8 ring-rose-100 animate-pulse'
                    : 'bg-blue-700 hover:bg-blue-800 ring-8 ring-blue-50 hover:scale-105 disabled:opacity-50'
                }`}
              >
                {isRecording ? (
                  <Square className="h-8 w-8 fill-current" />
                ) : isTranscribing ? (
                  <Loader2 className="h-9 w-9 animate-spin" />
                ) : (
                  <Mic className="h-9 w-9" />
                )}
              </button>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {isRecording
                  ? (appLang === 'hi' ? 'रिकॉर्डिंग रोकने के लिए टैप करें' : 'Tap to Stop Recording')
                  : isTranscribing
                  ? (appLang === 'hi' ? 'ऑडियो का विश्लेषण जारी...' : 'Processing audio speech...')
                  : audioBlob
                  ? (appLang === 'hi' ? 'दोबारा रिकॉर्ड करने के लिए टैप करें' : 'Tap to Record Again')
                  : (appLang === 'hi' ? 'बोलने के लिए टैप करें' : 'Tap to Speak')}
              </p>
            </div>

            {audioUrl && !isRecording && (
              <div className="pt-4 border-t border-slate-100 max-w-sm mx-auto">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5 text-blue-600" /> {appLang === 'hi' ? 'रिकॉर्ड किया गया ऑडियो' : 'Recorded Audio'}
                  </span>
                  <span className="font-mono">{formatTime(recordingDuration)}</span>
                </div>
                <audio controls src={audioUrl} className="w-full h-9 rounded-lg" />
              </div>
            )}
          </div>

          {/* Errors */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Success */}
          {successMessage && !error && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Transcription Result Area */}
          {(transcribedText || isTranscribing) && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  {appLang === 'hi' ? 'पहचाना गया विवरण' : 'Transcript Review'}
                </label>
                {detectedLanguage && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    {appLang === 'hi' ? 'पहचानी गई भाषा' : 'Detected'}: {detectedLanguage.toUpperCase()}
                  </span>
                )}
              </div>

              <textarea
                rows={4}
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                disabled={isTranscribing}
                placeholder={appLang === 'hi' ? 'बोला गया विवरण यहाँ दिखेगा...' : 'Transcribed voice text will appear here...'}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 focus:outline-none transition-all resize-y"
              />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isTranscribing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> {appLang === 'hi' ? 'दोबारा रिकॉर्ड करें' : 'Record Again'}
                </button>

                <button
                  type="button"
                  onClick={handleUseText}
                  disabled={isTranscribing || !transcribedText.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50 transition-all shadow-md shadow-blue-700/20 cursor-pointer"
                >
                  <span>{appLang === 'hi' ? 'शिकायत फॉर्म में उपयोग करें' : 'Use in Complaint Form'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

