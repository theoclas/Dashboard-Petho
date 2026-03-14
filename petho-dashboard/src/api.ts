import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('petho_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('petho_token');
      localStorage.removeItem('petho_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Pedidos ──
export const getPedidos = (params?: Record<string, unknown>) =>
  api.get('/pedidos', { params }).then((r) => r.data);

export const getPedidoByDropiId = (idDropi: string) =>
  api.get(`/pedidos/dropi/${idDropi}`).then((r) => r.data);

export const getDashboardStats = (params?: { startDate?: string; endDate?: string }) =>
  api.get('/pedidos/stats', { params }).then((r) => r.data);

export const updatePedido = (id: number, data: Record<string, unknown>) =>
  api.patch(`/pedidos/${id}`, data).then((r) => r.data);

// ── Cartera ──
export const getCartera = (params?: Record<string, unknown>) =>
  api.get('/cartera', { params }).then((r) => r.data);

export const getCarteraPorPedido = (ordenId: string) =>
  api.get(`/cartera/por-pedido/${ordenId}`).then((r) => r.data);

// ── Mapeo Estados ──
export const getMapeoEstados = () =>
  api.get('/mapeo-estados').then((r) => r.data);

export const createMapeoEstado = (data: Record<string, unknown>) =>
  api.post('/mapeo-estados', data).then((r) => r.data);

export const updateMapeoEstado = (id: number, data: Record<string, unknown>) =>
  api.patch(`/mapeo-estados/${id}`, data).then((r) => r.data);

export const deleteMapeoEstado = (id: number) =>
  api.delete(`/mapeo-estados/${id}`).then((r) => r.data);

// ── Productos Detalle ──
export const getProductosDetalle = (pedidoIdDropi?: string) =>
  api.get('/productos-detalle', { params: { pedido_id_dropi: pedidoIdDropi } }).then((r) => r.data);

export const getUniqueProductNames = () =>
  api.get('/productos-detalle/unique/names').then((r) => r.data);

// ── CPA ──
export const getCpas = (params?: Record<string, unknown>) =>
  api.get('/cpa', { params }).then((r) => r.data);

export const getCpaStats = (params?: { startDate?: string; endDate?: string }) =>
  api.get('/cpa/stats', { params }).then((r) => r.data);

export const createCpa = (data: Record<string, unknown>) =>
  api.post('/cpa', data).then((r) => r.data);

export const updateCpa = (id: number, data: Record<string, unknown>) =>
  api.patch(`/cpa/${id}`, data).then((r) => r.data);

export const deleteCpa = (id: number) =>
  api.delete(`/cpa/${id}`).then((r) => r.data);

// ── Import ──
export const importFile = (
  endpoint: 'pedidos' | 'productos' | 'cartera' | 'cpa',
  file: File,
  onProgress?: (percent: number) => void,
) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/import/${endpoint}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  }).then((r) => r.data);
};

export const remapearEstados = () =>
  api.post('/import/remapear-estados').then((r) => r.data);

export default api;
