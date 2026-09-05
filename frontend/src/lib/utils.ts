export { cn } from "cn";

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSeverityColor(severity: number): string {
  if (severity <= 30) return 'text-green-600';
  if (severity <= 60) return 'text-orange-500';
  return 'text-red-600';
}

export function getSeverityBgColor(severity: number): string {
  if (severity <= 30) return 'bg-green-500';
  if (severity <= 60) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getSeverityLabel(severity: number): string {
  if (severity <= 30) return 'Low';
  if (severity <= 60) return 'Medium';
  return 'High';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    submitted: 'bg-gray-100 text-gray-700 border-gray-300',
    analyzing: 'bg-blue-100 text-blue-700 border-blue-300 animate-pulse',
    analyzed: 'bg-blue-100 text-blue-700 border-blue-300',
    assigned: 'bg-purple-100 text-purple-700 border-purple-300',
    in_progress: 'bg-orange-100 text-orange-700 border-orange-300',
    resolved: 'bg-green-100 text-green-700 border-green-300',
    verified: 'bg-green-100 text-green-700 border-green-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700 border-gray-300';
}

export function getStatusLabel(status: string): string {
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

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
