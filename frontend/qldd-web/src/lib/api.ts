import axios from 'axios';

const getBaseURL = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `http://${host}:5023/api/v1`;
  }
  return 'http://localhost:5023/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor to automatically attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('AttendanceManagement_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor to handle unauthorized/expired token responses
api.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('AttendanceManagement_user');
      localStorage.removeItem('AttendanceManagement_token');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
  }
  return Promise.reject(error);
});

// ==================== Authentication ====================
export async function loginApi(payload: Record<string, unknown>) {
  const res = await api.post('/auth/login', payload);
  return res.data?.data;
}

export async function changePasswordApi(payload: Record<string, unknown>) {
  const res = await api.post('/auth/change-password', payload);
  return res.data;
}

// ==================== Accounts ====================
export async function getAccountsApi() {
  const res = await api.get('/accounts');
  return res.data?.data ?? [];
}

export async function toggleAccountApi(id: string) {
  const res = await api.post(`/accounts/${id}/toggle`);
  return res.data;
}

export async function resetAccountPasswordApi(id: string, payload: Record<string, unknown>) {
  const res = await api.post(`/accounts/${id}/reset-password`, payload);
  return res.data;
}

// ==================== Catalogs (Danh mục) ====================
export interface CatalogDto {
  id: string;
  loai: string;
  ma: string;
  ten: string;
  thuTu: number;
  trangThai: boolean;
  ghiChu: string | null;
}

export async function getCatalogsApi(params?: { loai?: string; search?: string; activeOnly?: boolean }): Promise<CatalogDto[]> {
  try {
    const res = await api.get('/catalogs', { params });
    return res.data?.data ?? [];
  } catch {
    return [];
  }
}

export async function createCatalogApi(payload: Record<string, unknown>) {
  const res = await api.post('/catalogs', payload);
  return res.data;
}

export async function updateCatalogApi(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/catalogs/${id}`, payload);
  return res.data;
}

export async function deleteCatalogApi(id: string) {
  const res = await api.delete(`/catalogs/${id}`);
  return res.data;
}

// ==================== Master Data ====================
export async function getMasterDepartmentsApi() {
  const res = await api.get('/masterdata/departments');
  return res.data?.data ?? [];
}

export async function getMasterPersonsApi() {
  const res = await api.get('/masterdata/persons');
  return res.data?.data ?? [];
}

export async function getMasterLocationsApi() {
  const res = await api.get('/masterdata/locations');
  return res.data?.data ?? [];
}

export async function getMasterDevicesApi() {
  const res = await api.get('/masterdata/devices');
  return res.data?.data ?? [];
}

// ==================== Events ====================
export async function getEventsApi(params?: any) {
  const res = await api.get('/events', { params });
  return res.data; // expecting { data: [], totalCount: 0 }
}

export async function getEventDetailApi(id: string) {
  const res = await api.get(`/events/${id}`);
  return res.data?.data;
}

export async function createEventApi(payload: any) {
  const res = await api.post('/events', payload);
  return res.data;
}

export async function updateEventApi(id: string, payload: any) {
  const res = await api.put(`/events/${id}`, payload);
  return res.data;
}

export async function deleteEventApi(id: string) {
  const res = await api.delete(`/events/${id}`);
  return res.data;
}

export async function publishEventApi(id: string) {
  const res = await api.post(`/events/${id}/publish`);
  return res.data;
}

export async function duplicateEventApi(id: string) {
  const res = await api.post(`/events/${id}/duplicate`);
  return res.data;
}

export default api;
