'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type { Complaint, PaginatedResponse } from '@/lib/types';

interface UseComplaintsOptions {
  ward_id?: number;
  category?: string;
  status?: string;
  severity_min?: number;
  severity_max?: number;
  page?: number;
  limit?: number;
  endpoint?: string; // defaults to /api/complaints
}

export function useComplaints(options: UseComplaintsOptions = {}) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.ward_id) params.set('ward_id', String(options.ward_id));
      if (options.category) params.set('category', options.category);
      if (options.status) params.set('status', options.status);
      if (options.severity_min) params.set('severity_min', String(options.severity_min));
      if (options.severity_max) params.set('severity_max', String(options.severity_max));
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));

      const endpoint = options.endpoint || '/api/complaints';
      const query = params.toString() ? `?${params.toString()}` : '';
      const data = await api.get<PaginatedResponse<Complaint>>(`${endpoint}${query}`);
      setComplaints(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch complaints');
    } finally {
      setLoading(false);
    }
  }, [
    options.ward_id,
    options.category,
    options.status,
    options.severity_min,
    options.severity_max,
    options.page,
    options.limit,
    options.endpoint,
  ]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return { complaints, total, pages, loading, error, refetch: fetchComplaints };
}
