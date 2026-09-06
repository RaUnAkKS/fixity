export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_URL = API_BASE_URL;

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined'
    ? localStorage.getItem('civicai_token')
    : null;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    throw new Error(
      `Cannot connect to backend server at ${API_URL}. Please ensure the backend is running.`
    );
  }

  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('civicai_token');
    }

    let message = `Request failed (${res.status})`;
    try {
      const error = await res.json();
      if (Array.isArray(error.detail)) {
        message = error.detail.map((e: any) => e.msg || JSON.stringify(e)).join(', ');
      } else if (typeof error.detail === 'string') {
        message = error.detail;
      } else if (error.detail && typeof error.detail === 'object') {
        message = JSON.stringify(error.detail);
      } else if (error.message) {
        message = error.message;
      }
    } catch {
      message = `Server error: ${res.status} ${res.statusText}`;
    }
    const err = new Error(message);
    (err as any).status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  get: <T>(url: string) => fetchAPI<T>(url),
  post: <T>(url: string, body?: any) =>
    fetchAPI<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined),
    }),
  patch: <T>(url: string, body?: any) =>
    fetchAPI<T>(url, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: any) =>
    fetchAPI<T>(url, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string) => fetchAPI<T>(url, { method: 'DELETE' }),
};

export default api;
