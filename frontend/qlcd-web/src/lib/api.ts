import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5023/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor to automatically attach JWT token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('qlcd_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// ==================== Authentication ====================
export async function loginApi(payload: any) {
  const res = await api.post('/auth/login', payload);
  return res.data?.data;
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

export async function resetAccountPasswordApi(id: string, payload: any) {
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

export async function createCatalogApi(payload: any) {
  const res = await api.post('/catalogs', payload);
  return res.data;
}

export async function updateCatalogApi(id: string, payload: any) {
  const res = await api.put(`/catalogs/${id}`, payload);
  return res.data;
}

export async function deleteCatalogApi(id: string) {
  const res = await api.delete(`/catalogs/${id}`);
  return res.data;
}

// ==================== Union Units (Tổ chức) ====================
export interface UnionUnitDto {
  id: string;
  tenDonVi: string;
  loaiToChuc: string;
  level: number;
  maParent: string | null;
  maKhoi: string | null;
  soDoanVien: number;
  soDoanVienNam?: number;
  soDoanVienNu?: number;
  soDoanVienDangVien?: number;
  soTrinhDoDaiHoc?: number;
  soCoNgoaiNgu?: number;
  children: UnionUnitDto[];
  trangThai: number;
}

export async function getUnionTree(): Promise<UnionUnitDto | null> {
  try {
    const res = await api.get('/union-units/tree');
    return res.data?.data ?? null;
  } catch { return null; }
}

export interface CreateUnionUnitPayload {
  tenDonVi: string;
  loaiToChuc: number;
  maParent?: string;
  maKhoi?: string;
}

export async function createUnionUnit(payload: CreateUnionUnitPayload) {
  const res = await api.post('/union-units', payload);
  return res.data;
}

export async function updateUnionUnit(id: string, payload: any) {
  const res = await api.put(`/union-units/${id}`, payload);
  return res.data;
}

export async function deleteUnionUnit(id: string) {
  const res = await api.delete(`/union-units/${id}`);
  return res.data;
}

// ==================== Union Members (Đoàn viên) ====================
export interface UnionMemberDto {
  id: string;
  hoTen: string;
  maNhanVien: string;
  soCCCD: string;
  ngaySinh: string;
  gioiTinh: number;
  chucVu: string | null;
  donViCongTac: string | null;
  chucDanhChuyenMon: string | null;
  maToCongDoan: string;
  tenToCongDoan: string;
  vaiTro: string;
  trangThai: string;
  ngayVaoCongDoan: string;
  dangVien: boolean;
  dienThoai: string | null;
  email: string | null;
  trinhDoHocVan: string | null;
}

export interface GetMembersResult {
  items: UnionMemberDto[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface GetMembersParams {
  search?: string;
  toCongDoanId?: string;
  vaiTro?: string;
  trangThai?: string;
  page?: number;
  pageSize?: number;
}

export async function getMembers(params?: GetMembersParams): Promise<GetMembersResult | null> {
  try {
    const res = await api.get('/union-members', { params });
    return res.data?.data ?? null;
  } catch { return null; }
}

export async function getMemberDetailApi(id: string) {
  const res = await api.get(`/union-members/${id}`);
  return res.data?.data ?? null;
}

export async function createMember(payload: any) {
  const res = await api.post('/union-members', payload);
  return res.data;
}

export async function updateMemberApi(id: string, payload: any) {
  const res = await api.put(`/union-members/${id}`, payload);
  return res.data;
}

export async function deleteMemberApi(id: string) {
  const res = await api.delete(`/union-members/${id}`);
  return res.data;
}

export interface TransferPayload {
  denToCongDoanId: string;
  lyDo: string;
  ngayHieuLuc: string;
}

export async function transferMember(memberId: string, payload: TransferPayload) {
  const res = await api.post(`/union-members/${memberId}/transfer`, payload);
  return res.data;
}

// ==================== Union Activities ====================
export async function getActivitiesApi(params?: any) {
  const res = await api.get('/activities', { params });
  return res.data?.data ?? [];
}

export async function createActivityApi(payload: any) {
  const res = await api.post('/activities', payload);
  return res.data;
}

export async function updateActivityApi(id: string, payload: any) {
  const res = await api.put(`/activities/${id}`, payload);
  return res.data;
}

export async function deleteActivityApi(id: string) {
  const res = await api.delete(`/activities/${id}`);
  return res.data;
}

// ==================== Union Finance ====================
export async function getFinanceApi(params?: any) {
  const res = await api.get('/finance', { params });
  return res.data?.data ?? [];
}

export async function createFinanceApi(payload: any) {
  const res = await api.post('/finance', payload);
  return res.data;
}

export async function updateFinanceApi(id: string, payload: any) {
  const res = await api.put(`/finance/${id}`, payload);
  return res.data;
}

export async function deleteFinanceApi(id: string) {
  const res = await api.delete(`/finance/${id}`);
  return res.data;
}

// ==================== Union Welfare ====================
export async function getWelfareApi(params?: any) {
  const res = await api.get('/welfare', { params });
  return res.data?.data ?? [];
}

export async function createWelfareApi(payload: any) {
  const res = await api.post('/welfare', payload);
  return res.data;
}

export async function updateWelfareApi(id: string, payload: any) {
  const res = await api.put(`/welfare/${id}`, payload);
  return res.data;
}

// ==================== Emulation Initiatives ====================
export async function getInitiativesApi(params?: any) {
  const res = await api.get('/initiatives', { params });
  return res.data?.data ?? [];
}

export async function createInitiativeApi(payload: any) {
  const res = await api.post('/initiatives', payload);
  return res.data;
}

export async function updateInitiativeApi(id: string, payload: any) {
  const res = await api.put(`/initiatives/${id}`, payload);
  return res.data;
}

export async function deleteInitiativeApi(id: string) {
  const res = await api.delete(`/initiatives/${id}`);
  return res.data;
}

// ==================== Union Emulations ====================
export async function getEmulationsApi(params?: any) {
  const res = await api.get('/emulations', { params });
  return res.data?.data ?? [];
}

export async function createEmulationApi(payload: any) {
  const res = await api.post('/emulations', payload);
  return res.data;
}

export async function updateEmulationApi(id: string, payload: any) {
  const res = await api.put(`/emulations/${id}`, payload);
  return res.data;
}

export async function deleteEmulationApi(id: string) {
  const res = await api.delete(`/emulations/${id}`);
  return res.data;
}

// ==================== Stats ====================
export interface UnionStatsDto {
  tongDoanVien: number;
  doanVienNam: number;
  doanVienNu: number;
  doanVienDangSinhHoat: number;
  doanVienDangVien: number;
  tiLeDangVien: number;
  tiLeNu: number;
  tongCDBP: number;
  tongToCongDoan: number;
  ketNapMoiThang: number;
  chuyenDiThang: number;
  nghiHuuThang: number;
  
  // Scoped distributions
  doanVienTheoCdbp: { name: string; count: number }[];
  doanVienTheoToCd: { name: string; count: number }[];
  doanVienTheoKhoi: { name: string; count: number }[];
  doanVienTheoGioiTinh: { name: string; count: number }[];
  doanVienTheoTrangThai: { name: string; count: number }[];
  doanVienTheoChucVu: { name: string; count: number }[];
  doanVienTheoNgoaiNgu: { name: string; count: number }[];
  doanVienTheoTrinhDo: { name: string; count: number }[];

  // Scoped submodule totals
  tongThuDoanPhi: number;
  tongChi: number;
  tonQuy: number;
  soHoatDong: number;
  soLuotPhucLoi: number;
  soSangKien: number;
  soKetQuaThiDua: number;
}

export async function getStats(): Promise<UnionStatsDto | null> {
  try {
    const res = await api.get('/union-units/stats');
    return res.data?.data ?? null;
  } catch { return null; }
}

export default api;
