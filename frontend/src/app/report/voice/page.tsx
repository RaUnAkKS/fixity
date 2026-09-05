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
  Building2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { TranscriptionResult, LANGUAGES } from '@/lib/types';

export default function VoiceReportPage() {
  const router = useRouter();

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
        setSuccessMessage('Speech transcription completed. Please review or edit the text below.');
      } else {
        setError('No speech could be recognized. Please speak clearly into your microphone.');
      }
    } catch (err: any) {
      console.error('Voice transcription error:', err);
      setError(
        err.message ||
          'Voice transcription service unavailable. You can record again or enter text manually.'
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
      setError('Audio recording is not supported in this browser.');
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
        setError('Microphone permission denied. Please allow microphone access in your browser.');
      } else {
        setError(err.message || 'Could not access microphone.');
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
      setError('Please record or enter text before proceeding.');
      return;
    }
    router.push(`/report?text=${encodeURIComponent(transcribedText.trim())}`);
  };

  return (
    <div className="bg-slate-50 min-h-screen py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        
        {/* Back navigation */}
        <div className="mb-4">
          <Link
            href="/report"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Standard Complaint Form
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-white rounded-md border border-slate-200 p-6 mb-6 text-center shadow-sm">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded bg-blue-50 text-blue-700 mb-3 border border-blue-200">
            <Mic className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Voice Complaint Registration
          </h1>
          <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">
            Speak in your preferred language to describe the civic issue. Speech recognition will convert your voice into a written complaint.
          </p>
        </div>

        <div className="space-y-6">
          
          {/* Language Hint Selection */}
          <div className="bg-white rounded-md border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <label htmlFor="language-select" className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Languages className="h-4 w-4 text-blue-700" />
                  Select Spoken Language
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Specifying your language improves transcription accuracy.
                </p>
              </div>
              <select
                id="language-select"
                value={languageHint}
                onChange={(e) => setLanguageHint(e.target.value)}
                disabled={isRecording || isTranscribing}
                className="rounded border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none disabled:bg-slate-100"
              >
                <option value="">Auto-Detect Language</option>
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Recording Card */}
          <div className="bg-white rounded-md border border-slate-200 p-8 shadow-sm text-center">
            
            <div className="h-8 flex items-center justify-center mb-6">
              {isRecording ? (
                <div className="inline-flex items-center gap-2 rounded bg-red-50 border border-red-200 px-3 py-1 text-xs font-bold text-red-700">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                  </span>
                  <span>RECORDING ({formatTime(recordingDuration)})</span>
                </div>
              ) : isTranscribing ? (
                <div className="inline-flex items-center gap-2 rounded bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Transcribing Voice File...
                </div>
              ) : audioBlob ? (
                <div className="inline-flex items-center gap-2 rounded bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                  Audio File Captured ({formatTime(recordingDuration)})
                </div>
              ) : (
                <span className="text-xs text-slate-500">
                  Click button below to start audio capture
                </span>
              )}
            </div>

            {/* Record Button */}
            <div className="flex justify-center mb-4">
              <button
                type="button"
                onClick={handleToggleRecord}
                disabled={isTranscribing}
                className={`rounded-full w-20 h-20 flex items-center justify-center text-white font-bold transition-all shadow-md ${
                  isRecording
                    ? 'bg-red-600 hover:bg-red-700 ring-4 ring-red-100'
                    : 'bg-blue-700 hover:bg-blue-800 ring-4 ring-blue-50 disabled:opacity-50'
                }`}
              >
                {isRecording ? (
                  <Square className="h-7 w-7 fill-current" />
                ) : isTranscribing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Mic className="h-8 w-8" />
                )}
              </button>
            </div>

            <p className="text-xs font-bold text-slate-800">
              {isRecording
                ? 'CLICK TO STOP RECORDING'
                : isTranscribing
                ? 'Processing Speech...'
                : audioBlob
                ? 'RECORD AGAIN'
                : 'START SPEAKING'}
            </p>

            {audioUrl && !isRecording && (
              <div className="mt-6 pt-4 border-t border-slate-200 max-w-sm mx-auto">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span className="font-semibold text-slate-700 flex items-center gap-1">
                    <Volume2 className="h-3.5 w-3.5" /> Audio File Preview
                  </span>
                  <span>{formatTime(recordingDuration)}</span>
                </div>
                <audio controls src={audioUrl} className="w-full h-8" />
              </div>
            )}
          </div>

          {/* Errors */}
          {error && (
            <div className="flex items-start gap-2 rounded-md bg-red-50 border border-red-200 p-4 text-xs text-red-800">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Success */}
          {successMessage && !error && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              {successMessage}
            </div>
          )}

          {/* Transcription Result Area */}
          {(transcribedText || isTranscribing) && (
            <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-900">
                  TRANSCRIPT REVIEW & EDIT
                </label>
                {detectedLanguage && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    Language: {detectedLanguage.toUpperCase()}
                  </span>
                )}
              </div>

              <textarea
                rows={4}
                value={transcribedText}
                onChange={(e) => setTranscribedText(e.target.value)}
                disabled={isTranscribing}
                placeholder="Transcription text will display here..."
                className="w-full rounded-md border border-slate-300 p-3 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
              />

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={isTranscribing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Record Again
                </button>

                <button
                  type="button"
                  onClick={handleUseText}
                  disabled={isTranscribing || !transcribedText.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-700 px-5 py-2 text-xs font-bold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  USE THIS TEXT IN COMPLAINT FORM
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
