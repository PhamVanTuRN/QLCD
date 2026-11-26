import axios from "axios";
import type {
  ActivityDto, ActivityInput, EmulationDto, EmulationInput, FinanceDto, FinanceInput,
  InitiativeDto, InitiativeInput, MemberDetailDto, MemberInput, MemberUpdate, WelfareDto, WelfareInput,
} from "./business-types";

const api = axios.create({ baseURL: "/api/v1", timeout: 45_000 });
const csrfClient = axios.create({ baseURL: "/api/v1", timeout: 10_000 });

export function apiMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError<{ message?: string }>(error)) return fallback;
  return error.response?.data?.message || fallback;
}

api.interceptors.request.use(async config => {
  if (["post", "put", "patch", "delete"].includes(config.method?.toLowerCase() ?? "")) {
    const response = await csrfClient.get<{ token: string }>("/auth/csrf");
    config.headers.set("X-CSRF-Token", response.data.token);
  }
  return config;
});

export const sessionExpiredEvent = "qlcd:session-ended";

api.interceptors.response.use(response => response, error => {
  if (typeof window !== "undefined" && axios.isAxiosError(error) && error.response?.status === 401
    && !["/auth/login", "/auth/login/authenticator", "/auth/session", "/auth/change-password"].includes(error.config?.url ?? "")) {
    window.dispatchEvent(new Event(sessionExpiredEvent));
  }
  return Promise.reject(error);
});

export interface SessionProfile {
  id: string;
  username: string;
  hoTen: string;
  vaiTro: "ADMIN" | "CDCS" | "CDBP" | "TOCD";
  organizationId: string | null;
  donViTen: string | null;
  mustChangePassword: boolean;
  needsAuthenticator: boolean;
  requiresActivation: boolean;
  hasRecoveryCodes: boolean;
}

export async function getSessionApi(): Promise<SessionProfile> {
  const response = await api.get<{ data: SessionProfile }>("/auth/session");
  return response.data.data;
}

export async function loginApi(username: string, password: string) {
  const { data: { data } } = await api.post<{ data: SessionProfile | { challenge: string } }>("/auth/login", {
    username, password, beginAuthenticator: true,
  });
  return data;
}

export async function verifyLoginAuthenticator(challenge: string, code: string): Promise<SessionProfile> {
  const { data } = await api.post<{ data: SessionProfile }>("/auth/login/authenticator", { challenge, code });
  return data.data;
}

export interface AuthenticatorSetup { setup: string; key: string; qrImage: string }

export async function getAuthenticatorStatus(signal: AbortSignal) {
  const { data } = await api.get<{ data: SessionProfile }>("/auth/authenticator", { signal });
  return data.data;
}

export async function beginAuthenticatorSetup(currentPassword: string, activationCode: string) {
  const { data } = await api.post<{ data: AuthenticatorSetup }>("/auth/authenticator/setup", { currentPassword, activationCode });
  return data.data;
}

export async function beginAuthenticatorRecovery(challenge: string, recoveryCode: string) {
  const { data } = await api.post<{ data: AuthenticatorSetup }>("/auth/authenticator/recovery", { challenge, recoveryCode });
  return data.data;
}

export async function confirmAuthenticatorSetup(setup: string, code: string, recovery = false) {
  const path = recovery ? "/auth/authenticator/recovery/confirm" : "/auth/authenticator/confirm";
  const { data } = await api.post<{ data: { codes: string[] } }>(path, { setup, code });
  return data.data;
}

export async function rotateRecoveryCodes(currentPassword: string, code: string) {
  const { data } = await api.post<{ data: { codes: string[] } }>("/auth/authenticator/recovery-codes", { currentPassword, code });
  return data.data.codes;
}

export async function logoutApi() {
  await api.post("/auth/logout");
}

export async function changePasswordApi(currentPassword: string, newPassword: string, confirmPassword: string, code: string) {
  await api.post("/auth/change-password", { currentPassword, newPassword, confirmPassword, code });
}

export interface ListParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface PageSlice<T> {
  data: T[];
  hasMore: boolean;
}

async function getPage<T>(path: string, params?: ListParams, signal?: AbortSignal): Promise<PageSlice<T>> {
  const response = await api.get<PageSlice<T>>(path, { params, signal });
  return { data: response.data.data ?? [], hasMore: response.data.hasMore === true };
}

export interface CredentialPolicy {
  initialPassword: string;
  temporaryPasswordLifetimeHours: number;
  activationCodeLifetimeHours: number;
}

export async function getAccountsApi<T>(params?: ListParams, signal?: AbortSignal) {
  const { data } = await api.get<PageSlice<T> & { canResetCredentials: boolean; credentialPolicy: CredentialPolicy }>("/accounts", { params, signal });
  return { data: data.data ?? [], hasMore: data.hasMore === true, canResetCredentials: data.canResetCredentials === true, credentialPolicy: data.credentialPolicy };
}

export async function toggleAccountApi(id: string) {
  const res = await api.post(`/accounts/${id}/toggle`);
  return res.data;
}

export async function issueAccountActivation(id: string, identityVerified: boolean) {
  const { data } = await api.post<{ data: { activationCode: string } }>(`/accounts/${id}/activate`, { identityVerified });
  return data.data.activationCode;
}

export async function resetAccountPassword(id: string, confirmed: boolean, currentPassword: string, code: string) {
  await api.post(`/accounts/${id}/reset-password`, { confirmed, currentPassword, code });
}

export async function resetAccountAuthenticator(id: string, identityVerified: boolean, currentPassword: string, code: string) {
  const { data } = await api.post<{ data: { activationCode: string } }>(`/accounts/${id}/reset-2fa`, { identityVerified, currentPassword, code });
  return data.data.activationCode;
}

// ==================== Catalogs (Danh mục) ====================
export interface CatalogParams extends ListParams {
  loai?: string;
  activeOnly?: boolean;
}

export interface CatalogDto {
  id: string;
  loai: string;
  ma: string;
  ten: string;
  thuTu: number;
  trangThai: boolean;
  ghiChu: string | null;
}

export function getCatalogsPage(params?: CatalogParams, signal?: AbortSignal) {
  return getPage<CatalogDto>("/catalogs", params, signal);
}

export async function getCatalogsApi(params?: CatalogParams, signal?: AbortSignal): Promise<CatalogDto[]> {
  return (await getCatalogsPage({ ...params, pageSize: 200 }, signal)).data;
}

export async function createCatalogApi(payload: Omit<CatalogDto, "id">) {
  const res = await api.post('/catalogs', payload);
  return res.data;
}

export async function updateCatalogApi(id: string, payload: Pick<CatalogDto, "ten" | "thuTu" | "trangThai" | "ghiChu">) {
  const res = await api.put(`/catalogs/${id}`, { ...payload, id });
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
  coTheTiepNhanDoanVien?: boolean;
}

export async function getUnionTree(signal?: AbortSignal): Promise<UnionUnitDto | null> {
  const res = await api.get<{ data: UnionUnitDto | null }>("/union-units/tree", { signal });
  return res.data?.data ?? null;
}

export interface CreateUnionUnitPayload {
  tenDonVi: string;
  loaiToChuc: "CDCS" | "CDBP" | "TO_CD_TRUC_THUOC_CDCS" | "TO_CD_THUOC_CDBP";
  maParent?: string;
  maKhoi?: string;
}

export async function createUnionUnit(payload: CreateUnionUnitPayload) {
  const res = await api.post('/union-units', payload);
  return res.data;
}

export async function updateUnionUnit(id: string, payload: { id: string; tenDonVi: string; maKhoi: string | null; trangThai: number }) {
  const res = await api.put(`/union-units/${id}`, payload);
  return res.data;
}

export interface InactiveUnitDto {
  id: string;
  tenDonVi: string;
  maParent: string | null;
  parentName: string | null;
  legacyDeleted: boolean;
  canRestore: boolean;
}

export async function getInactiveUnits(page: number, signal?: AbortSignal) {
  return getPage<InactiveUnitDto>("/union-units/inactive", { page }, signal);
}

export async function restoreUnionUnit(id: string) {
  await api.post(`/union-units/${id}/restore`);
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

export async function getMembers(params?: GetMembersParams, signal?: AbortSignal): Promise<GetMembersResult> {
  const response = await api.get<{ data: GetMembersResult }>("/union-members", { params, signal });
  return response.data.data;
}

export async function getMemberDetailApi(id: string, signal?: AbortSignal): Promise<MemberDetailDto> {
  const response = await api.get<{ data: MemberDetailDto }>(`/union-members/${id}`, { signal });
  return response.data.data;
}

export async function createMember(payload: MemberInput) {
  const res = await api.post<{ data: string }>("/union-members", payload);
  return res.data.data;
}

export async function updateMemberApi(id: string, payload: MemberUpdate) {
  const res = await api.put(`/union-members/${id}`, { ...payload, id });
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
export function getActivitiesApi(params?: ListParams, signal?: AbortSignal) {
  return getPage<ActivityDto>("/activities", params, signal);
}

export async function createActivityApi(payload: ActivityInput) {
  const res = await api.post('/activities', payload);
  return res.data;
}

export async function updateActivityApi(id: string, payload: ActivityInput) {
  const res = await api.put(`/activities/${id}`, { ...payload, id });
  return res.data;
}

export async function deleteActivityApi(id: string) {
  const res = await api.delete(`/activities/${id}`);
  return res.data;
}

// ==================== Union Finance ====================
export interface FinancePage extends PageSlice<FinanceDto> {
  totals: { receipt: number; expense: number };
}

export async function getFinanceApi(params?: ListParams, signal?: AbortSignal): Promise<FinancePage> {
  const response = await api.get<FinancePage>("/finance", { params, signal });
  return response.data;
}

export async function createFinanceApi(payload: FinanceInput) {
  const res = await api.post('/finance', payload);
  return res.data;
}

export async function updateFinanceApi(id: string, payload: FinanceInput) {
  const res = await api.put(`/finance/${id}`, { ...payload, id });
  return res.data;
}

export async function deleteFinanceApi(id: string) {
  const res = await api.delete(`/finance/${id}`);
  return res.data;
}

// ==================== Union Welfare ====================
export function getWelfareApi(params?: ListParams, signal?: AbortSignal) {
  return getPage<WelfareDto>("/welfare", params, signal);
}

export async function createWelfareApi(payload: WelfareInput) {
  const res = await api.post('/welfare', payload);
  return res.data;
}

export async function updateWelfareApi(id: string, payload: WelfareInput) {
  const res = await api.put(`/welfare/${id}`, { ...payload, id });
  return res.data;
}

// ==================== Emulation Initiatives ====================
export function getInitiativesApi(params?: ListParams, signal?: AbortSignal) {
  return getPage<InitiativeDto>("/initiatives", params, signal);
}

export async function createInitiativeApi(payload: InitiativeInput) {
  const res = await api.post('/initiatives', payload);
  return res.data;
}

export async function updateInitiativeApi(id: string, payload: InitiativeInput) {
  const res = await api.put(`/initiatives/${id}`, { ...payload, id });
  return res.data;
}

export async function deleteInitiativeApi(id: string) {
  const res = await api.delete(`/initiatives/${id}`);
  return res.data;
}

// ==================== Union Emulations ====================
export function getEmulationsApi(params?: ListParams, signal?: AbortSignal) {
  return getPage<EmulationDto>("/emulations", params, signal);
}

export async function createEmulationApi(payload: EmulationInput) {
  const res = await api.post('/emulations', payload);
  return res.data;
}

export async function updateEmulationApi(id: string, payload: EmulationInput) {
  const res = await api.put(`/emulations/${id}`, { ...payload, id });
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

export async function getStats(signal?: AbortSignal): Promise<UnionStatsDto> {
  const response = await api.get<{ data: UnionStatsDto }>("/union-units/stats", { signal });
  return response.data.data;
}

export interface EmulationSummary {
  year: number;
  registered: number;
  evaluated: number;
  awarded: number;
  ratings: { code: string; name: string; count: number }[];
}

export async function getEmulationSummary(year: number, signal?: AbortSignal): Promise<EmulationSummary> {
  const response = await api.get<{ data: EmulationSummary }>("/emulations/summary", { params: { nam: year }, signal });
  return response.data.data;
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
    params: { moduleName, organizationId }
  });
  return res.data?.data;
}

export async function deleteEvidenceFile(id: string) {
  const res = await api.delete(`/evidence-files/${id}`);
  return res.data;
}

export async function getFlattenedUnits(signal?: AbortSignal): Promise<{ id: string; tenDonVi: string }[]> {
  const tree = await getUnionTree(signal);
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

export default api;
