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
    const token = localStorage.getItem('qlcd_token');
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
      localStorage.removeItem('qlcd_user');
      localStorage.removeItem('qlcd_token');
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

export async function updateUnionUnit(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/union-units/${id}`, payload);
  return res.data;
}

export async function deleteUnionUnit(id: string) {
  const res = await api.delete(`/union-units/${id}`);
  return res.data;
}

export interface KhoiChuyenMonDto {
  id: string;
  tenKhoi: string;
}

export async function getKhoiChuyenMonApi(): Promise<KhoiChuyenMonDto[]> {
  try {
    const res = await api.get('/union-units/khoi-chuyen-mon');
    return res.data?.data ?? [];
  } catch {
    return [];
  }
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

export async function createMember(payload: Record<string, unknown>) {
  const res = await api.post('/union-members', payload);
  return res.data;
}

export async function updateMemberApi(id: string, payload: Record<string, unknown>) {
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
  fileMinhChungUrl?: string;
}

export async function transferMember(memberId: string, payload: TransferPayload) {
  const res = await api.post(`/union-members/${memberId}/transfer`, payload);
  return res.data;
}

// ==================== Union Activities ====================
export async function getActivitiesApi(params?: Record<string, unknown>) {
  const res = await api.get('/activities', { params });
  return res.data?.data ?? [];
}

export async function createActivityApi(payload: Record<string, unknown>) {
  const res = await api.post('/activities', payload);
  return res.data;
}

export async function updateActivityApi(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/activities/${id}`, payload);
  return res.data;
}

export async function deleteActivityApi(id: string) {
  const res = await api.delete(`/activities/${id}`);
  return res.data;
}

// ==================== Union Finance ====================
export async function getFinanceApi(params?: Record<string, unknown>) {
  const res = await api.get('/finance', { params });
  return res.data?.data ?? [];
}

export async function createFinanceApi(payload: Record<string, unknown>) {
  const res = await api.post('/finance', payload);
  return res.data;
}

export async function updateFinanceApi(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/finance/${id}`, payload);
  return res.data;
}

export async function deleteFinanceApi(id: string) {
  const res = await api.delete(`/finance/${id}`);
  return res.data;
}

// ==================== Union Welfare ====================
export async function getWelfareApi(params?: Record<string, unknown>) {
  const res = await api.get('/welfare', { params });
  return res.data?.data ?? [];
}

export async function createWelfareApi(payload: Record<string, unknown>) {
  const res = await api.post('/welfare', payload);
  return res.data;
}

export async function updateWelfareApi(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/welfare/${id}`, payload);
  return res.data;
}

export async function deleteWelfareApi(id: string) {
  const res = await api.delete(`/welfare/${id}`);
  return res.data;
}

// ==================== Emulation Initiatives ====================
export async function getInitiativesApi(params?: Record<string, unknown>) {
  const res = await api.get('/initiatives', { params });
  return res.data?.data ?? [];
}

export async function createInitiativeApi(payload: Record<string, unknown>) {
  const res = await api.post('/initiatives', payload);
  return res.data;
}

export async function updateInitiativeApi(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/initiatives/${id}`, payload);
  return res.data;
}

export async function deleteInitiativeApi(id: string) {
  const res = await api.delete(`/initiatives/${id}`);
  return res.data;
}

// ==================== Union Emulations ====================
export async function getEmulationsApi(params?: Record<string, unknown>) {
  const res = await api.get('/emulations', { params });
  return res.data?.data ?? [];
}

export async function createEmulationApi(payload: Record<string, unknown>) {
  const res = await api.post('/emulations', payload);
  return res.data;
}

export async function updateEmulationApi(id: string, payload: Record<string, unknown>) {
  const res = await api.put(`/emulations/${id}`, payload);
  return res.data;
}

export async function deleteEmulationApi(id: string) {
  const res = await api.delete(`/emulations/${id}`);
  return res.data;
}

// ==================== Stats ====================
export interface StatsFilter {
  maKhoi?: string;
  filterOrgId?: string;
  fromDate?: string;
  toDate?: string;
  month?: number;
  quarter?: number;
  year?: number;
  searchKeyword?: string;
}

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
  doanVienTheoChatLuong: { name: string; count: number }[];
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

  // Biểu đồ mới
  thuChiTheoThoiGian: { timeLabel: string; thu: number; chi: number }[];
  hoatDongTheoThang: { timeLabel: string; count: number }[];
  thiDuaTheoToChuc: { organizationName: string; datGiai: number; datYeuCau: number; chuaDat: number }[];
}

export async function getStats(filters?: StatsFilter): Promise<UnionStatsDto | null> {
  try {
    const params = new URLSearchParams();
    if (filters) {
      if (filters.maKhoi) params.append('maKhoi', filters.maKhoi);
      if (filters.filterOrgId) params.append('filterOrgId', filters.filterOrgId);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.month !== undefined && filters.month !== null) params.append('month', filters.month.toString());
      if (filters.quarter !== undefined && filters.quarter !== null) params.append('quarter', filters.quarter.toString());
      if (filters.year !== undefined && filters.year !== null) params.append('year', filters.year.toString());
      if (filters.searchKeyword) params.append('searchKeyword', filters.searchKeyword);
    }
    const res = await api.get(`/union-units/stats?${params.toString()}`);
    return res.data?.data ?? null;
  } catch { return null; }
}

// ==================== Evidence Files (Minh chứng) ====================
export interface EvidenceFileDto {
  id: string;
  originalFileName: string;
  downloadUrl: string;
}

export async function uploadEvidenceFile(file: File, moduleName: string, organizationId: string): Promise<EvidenceFileDto> {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await api.post(`/evidence-files/upload`, formData, {
    params: { moduleName, organizationId },
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return res.data?.data;
}

export async function deleteEvidenceFile(id: string): Promise<unknown> {
  const res = await api.delete(`/evidence-files/${id}`);
  return res.data;
}

export function getDownloadUrl(fileId: string): string {
  const token = typeof window !== 'undefined' ? localStorage.getItem('qlcd_token') : '';
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5023/api/v1';
  return `${baseUrl}/evidence-files/download/${fileId}?access_token=${token}`;
}

export async function getFlattenedUnits(): Promise<{ id: string; tenDonVi: string }[]> {
  const tree = await getUnionTree();
  if (!tree) return [];
  const list: { id: string; tenDonVi: string }[] = [];
  function recurse(node: UnionUnitDto) {
    list.push({ id: node.id, tenDonVi: node.tenDonVi });
    if (node.children) {
      for (const child of node.children) {
        recurse(child);
      }
    }
  }
  recurse(tree);
  return list;
}

// ==================== Union Quality (Chất lượng Công đoàn) ====================
export interface QualityEvaluationPeriodDto {
  id: string;
  nam: number;
  ky: string;
  tenKy: string;
  trangThai: number; // 0: Closed, 1: Open, 2: Locked
}

export interface QualityCriteriaDto {
  id: string;
  ma: string;
  ten: string;
  phanLoai: string;
  mucTieu: number;
  donViTinh: string;
  isInverse: boolean;
  thuTu: number;
  trangThai: boolean;
  moTa: string | null;
  autoCalculationKey: string | null;
}

export interface QualityEvaluationDetailDto {
  id?: string;
  criteriaId: string;
  ma: string;
  ten: string;
  phanLoai: string;
  donViTinh: string;
  mucTieu: number;
  thucTe: number;
  isPassed: boolean;
  diemSo: number;
  fileMinhChungUrl?: string | null;
  ghiChu?: string | null;
}

export interface SummaryStatsDto {
  subUnitsTotal: number;
  subUnitsEvaluated: number;
  subUnitsExcellent: number;
  subUnitsStrong: number;
  subUnitsGood: number;
  subUnitsUnfinished: number;
}

export interface QualityEvaluationDto {
  id: string | null;
  donViCongDoanId: string;
  periodId: string;
  tongDiem: number;
  xepLoai: string;
  datSoTieuChi: number;
  tongSoTieuChi: number;
  ngayDanhGia: string;
  nguoiDanhGia: string | null;
  ghiChu: string | null;
  details: QualityEvaluationDetailDto[];
}

export async function getQualityPeriodsApi(): Promise<QualityEvaluationPeriodDto[]> {
  const res = await api.get('/union-quality/periods');
  return res.data?.data ?? [];
}

export async function getQualityCriteriaApi(): Promise<QualityCriteriaDto[]> {
  const res = await api.get('/union-quality/criteria');
  return res.data?.data ?? [];
}

export async function getQualityEvaluationApi(
  organizationId: string,
  year: number,
  period: string
): Promise<{ success: boolean; data: QualityEvaluationDto | null; summaryStats: SummaryStatsDto }> {
  const res = await api.get('/union-quality/evaluation', {
    params: { organizationId, year, period }
  });
  return res.data;
}

export async function getManualInputsApi(
  organizationId: string,
  year: number,
  period: string
): Promise<{ criteriaId: string; criteriaMa: string; value: number }[]> {
  const res = await api.get('/union-quality/manual-inputs', {
    params: { organizationId, year, period }
  });
  return res.data?.data ?? [];
}

export async function saveManualInputsApi(payload: {
  organizationId: string;
  year: number;
  period: string;
  inputs: { criteriaMa: string; value: number }[];
}) {
  const res = await api.post('/union-quality/manual-inputs', payload);
  return res.data;
}

export async function calculateQualityApi(payload: {
  organizationId: string;
  year: number;
  period: string;
  manualInputs?: { criteriaMa: string; value: number }[];
}): Promise<{ success: boolean; data: QualityEvaluationDto; summaryStats: SummaryStatsDto }> {
  const res = await api.post('/union-quality/calculate', payload);
  return res.data;
}

export async function saveQualityEvaluationApi(payload: {
  organizationId: string;
  year: number;
  period: string;
  tongDiem: number;
  xepLoai: string;
  datSoTieuChi: number;
  tongSoTieuChi: number;
  ghiChu?: string | null;
  details: {
    criteriaId: string;
    criteriaMa: string;
    mucTieu: number;
    thucTe: number;
    isPassed: boolean;
    diemSo: number;
    fileMinhChungUrl?: string | null;
    ghiChu?: string | null;
  }[];
}) {
  const res = await api.post('/union-quality/save', payload);
  return res.data;
}

export default api;
