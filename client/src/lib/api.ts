const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data;
}

// Vehicles
export const api = {
  vehicles: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/vehicles${qs}`);
    },
    get: (id: string) => request<any>(`/vehicles/${id}`),
    create: (data: any) => request<any>('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/vehicles/${id}`, { method: 'DELETE' }),
    uploadPhoto: (id: string, file: File, isCover?: boolean) => {
      const form = new FormData();
      form.append('photo', file);
      if (isCover) form.append('isCover', 'true');
      return fetch(`${BASE}/vehicles/${id}/photos`, { method: 'POST', body: form }).then((r) => r.json());
    },
    deletePhoto: (vehicleId: string, photoId: string) =>
      request<void>(`/vehicles/${vehicleId}/photos/${photoId}`, { method: 'DELETE' }),
    setCoverPhoto: (vehicleId: string, photoId: string) =>
      request<any>(`/vehicles/${vehicleId}/photos/${photoId}/cover`, { method: 'PUT' }),
    getDueStatus: (id: string) => request<any>(`/vehicles/${id}/due-status`),
  },

  services: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<{ records: any[]; total: number }>(`/services${qs}`);
    },
    get: (id: string) => request<any>(`/services/${id}`),
    create: (data: any) => request<any>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/services/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/services/${id}`, { method: 'DELETE' }),
    uploadPhoto: (id: string, file: File, photoType?: string) => {
      const form = new FormData();
      form.append('photo', file);
      if (photoType) form.append('photoType', photoType);
      return fetch(`${BASE}/services/${id}/photos`, { method: 'POST', body: form }).then((r) => r.json());
    },
    deletePhoto: (serviceId: string, photoId: string) =>
      request<void>(`/services/${serviceId}/photos/${photoId}`, { method: 'DELETE' }),
  },

  inventory: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/inventory${qs}`);
    },
    get: (id: string) => request<any>(`/inventory/${id}`),
    create: (data: any) => request<any>('/inventory', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => request<any>(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/inventory/${id}`, { method: 'DELETE' }),
    adjust: (id: string, data: { quantity: number; type: string; notes?: string }) =>
      request<any>(`/inventory/${id}/adjust`, { method: 'POST', body: JSON.stringify(data) }),
    uploadPhoto: (id: string, file: File) => {
      const form = new FormData();
      form.append('photo', file);
      return fetch(`${BASE}/inventory/${id}/photo`, { method: 'POST', body: form }).then((r) => r.json());
    },
    stats: () => request<any>('/inventory/stats/summary'),
  },

  receipts: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/receipts${qs}`);
    },
    get: (id: string) => request<any>(`/receipts/${id}`),
    upload: (file: File, serviceRecordId?: string, vehicleId?: string) => {
      const form = new FormData();
      form.append('receipt', file);
      if (serviceRecordId) form.append('serviceRecordId', serviceRecordId);
      if (vehicleId) form.append('vehicleId', vehicleId);
      return fetch(`${BASE}/receipts/upload`, { method: 'POST', body: form }).then((r) => r.json());
    },
    runOcr: (id: string) => request<any>(`/receipts/${id}/ocr`, { method: 'POST' }),
    update: (id: string, data: any) => request<any>(`/receipts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => request<void>(`/receipts/${id}`, { method: 'DELETE' }),
  },

  reminders: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : '';
      return request<any[]>(`/reminders${qs}`);
    },
    count: () => request<{ count: number }>('/reminders/count'),
    markRead: (id: string) => request<any>(`/reminders/${id}/read`, { method: 'PUT' }),
    markAllRead: () => request<any>('/reminders/read-all', { method: 'PUT' }),
    dismiss: (id: string) => request<any>(`/reminders/${id}/dismiss`, { method: 'PUT' }),
    generate: () => request<any>('/reminders/generate', { method: 'POST' }),
  },

  settings: {
    get: () => request<any>('/settings'),
    update: (data: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(data) }),
  },

  backups: {
    configs: () => request<any[]>('/backups/configs'),
    createConfig: (data: any) => request<any>('/backups/configs', { method: 'POST', body: JSON.stringify(data) }),
    updateConfig: (id: string, data: any) =>
      request<any>(`/backups/configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteConfig: (id: string) => request<void>(`/backups/configs/${id}`, { method: 'DELETE' }),
    create: (configId?: string) =>
      request<any>('/backups/create', { method: 'POST', body: JSON.stringify({ configId }) }),
    export: () => fetch(`${BASE}/backups/export`).then((r) => r.blob()),
  },

  exports: {
    pdf: (vehicleId: string) => fetch(`${BASE}/exports/vehicle/${vehicleId}/pdf`).then((r) => r.blob()),
    csv: (vehicleId: string) => fetch(`${BASE}/exports/vehicle/${vehicleId}/csv`).then((r) => r.blob()),
  },
};
