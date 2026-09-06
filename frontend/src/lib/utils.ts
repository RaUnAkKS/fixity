import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function getSeverityColor(severity: number): string {
  if (severity <= 30) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (severity <= 65) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-rose-700 bg-rose-50 border-rose-200';
}

export function getSeverityBgColor(severity: number): string {
  if (severity <= 30) return 'bg-emerald-500';
  if (severity <= 65) return 'bg-amber-500';
  return 'bg-rose-500';
}

export function getSeverityLabel(severity: number, lang: 'en' | 'hi' = 'en'): string {
  if (lang === 'hi') {
    if (severity <= 30) return 'सामान्य (Low)';
    if (severity <= 65) return 'मध्यम (Medium)';
    return 'गंभीर (High)';
  }
  if (severity <= 30) return 'Low';
  if (severity <= 65) return 'Medium';
  return 'High';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    submitted: 'bg-slate-100 text-slate-700 border-slate-200',
    analyzing: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
    analyzed: 'bg-blue-50 text-blue-700 border-blue-200',
    assigned: 'bg-purple-50 text-purple-700 border-purple-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    verified: 'bg-teal-50 text-teal-700 border-teal-200',
  };
  return colors[status] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export function getStatusLabel(status: string, lang: 'en' | 'hi' = 'en'): string {
  if (lang === 'hi') {
    const labelsHi: Record<string, string> = {
      submitted: 'दर्ज (Submitted)',
      analyzing: 'विश्लेषण जारी (Analyzing)',
      analyzed: 'विश्लेषित (Analyzed)',
      assigned: 'आवंटित (Assigned)',
      in_progress: 'कार्य प्रगति पर (In Progress)',
      resolved: 'समाधान हुआ (Resolved)',
      verified: '✓ सत्यापित (Verified)',
    };
    return labelsHi[status] || status;
  }
  const labels: Record<string, string> = {
    submitted: 'Submitted',
    analyzing: 'Analyzing...',
    analyzed: 'Analyzed',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    resolved: 'Resolved',
    verified: '✓ Verified',
  };
  return labels[status] || status;
}

export function getCategoryLabel(category: string | null | undefined, lang: 'en' | 'hi' = 'en'): string {
  if (!category) return '-';
  if (lang === 'hi') {
    const map: Record<string, string> = {
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
    return map[category] || category;
  }
  return category;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}


