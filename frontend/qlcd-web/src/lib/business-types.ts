interface EvidenceFields {
  evidenceFileId: string | null;
  fileMinhChungUrl: string | null;
  evidenceFileName: string | null;
  downloadUrl: string | null;
}

export interface ActivityInput {
  donViId: string;
  tenHoatDong: string;
  loaiHoatDong: string;
  tuNgay: string;
  denNgay: string;
  diaDiem: string;
  kinhPhi: number;
  moTa?: string | null;
  ketQua?: string | null;
  maQRCode?: string | null;
  fileMinhChungUrl?: string | null;
}

export type ActivityDto = ActivityInput & EvidenceFields & {
  id: string;
  tenDonVi: string | null;
  tenLoaiHoatDong: string | null;
};

export interface FinanceInput {
  donViId: string;
  loaiGiaoDich: string;
  soTien: number;
  ngayGiaoDich: string;
  nguoiGiaoDich: string;
  doanVienId: string | null;
  thangNam: string | null;
  ghiChu: string | null;
  fileMinhChungUrl?: string | null;
}

export type FinanceDto = FinanceInput & EvidenceFields & {
  id: string;
  tenDonVi: string | null;
  tenLoaiGiaoDich: string | null;
  hoTenDoanVien: string | null;
};

export interface WelfareInput {
  doanVienId: string;
  loaiPhucLoi: string;
  kinhPhiHoTro: number;
  ngayHoTro: string;
  lyDo: string;
  trangThai: number;
  fileMinhChungUrl?: string | null;
}

export type WelfareDto = Omit<WelfareInput, "doanVienId"> & EvidenceFields & {
  id: string;
  donViId: string;
  tenDonVi: string | null;
  doanVienId: string | null;
  hoTenDoanVien: string | null;
  maNhanVien: string | null;
  tenLoaiPhucLoi: string | null;
};

export interface InitiativeInput {
  doanVienId: string;
  tenDeTai: string;
  linhVuc: string;
  capDeTai: string;
  hieuQuaKinhTe: string;
  ngayNghiemThu: string | null;
  namThucHien: number;
  ketQuaNghiemThu: string;
  trangThai: number;
  fileMinhChungUrl?: string | null;
}

export type InitiativeDto = Omit<InitiativeInput, "doanVienId" | "hieuQuaKinhTe" | "ketQuaNghiemThu"> & EvidenceFields & {
  id: string;
  donViId: string;
  tenDonVi: string | null;
  doanVienId: string | null;
  hoTenDoanVien: string | null;
  maNhanVien: string | null;
  tenCapDeTai: string | null;
  hieuQuaKinhTe: string | null;
  ketQuaNghiemThu: string | null;
};

export interface EmulationInput {
  tenPhongTrao: string;
  doanVienId: string | null;
  donViId: string | null;
  nam: number;
  diemTuDanhGia: number;
  diemBchDuyet: number;
  xepLoai: string;
  khenThuong: string | null;
  trangThai: number;
  fileMinhChungUrl?: string | null;
}

export type EmulationDto = EmulationInput & EvidenceFields & {
  id: string;
  tenDonVi: string | null;
  hoTenDoanVien: string | null;
  maNhanVien: string | null;
  tenXepLoai: string | null;
};

export interface MemberLanguageInput {
  ngoaiNgu: string;
  trinhDo: string;
  diemSo: number;
  ngayCap: string;
  donViCap: string | null;
  fileChungChiUrl: string | null;
}

export interface MemberInput {
  hoTen: string;
  maNhanVien: string;
  soCCCD: string;
  ngaySinh: string;
  gioiTinh: number;
  loaiCanBo: string;
  maToCongDoan: string;
  ngayVaoCongDoan: string;
  vaiTro: string;
  dangVien: boolean;
  email: string | null;
  ngoaiNgus: MemberLanguageInput[];
  chucVu?: string | null;
  donViCongTac?: string | null;
  chucDanhChuyenMon?: string | null;
  trinhDoHocVan?: string | null;
  dienThoai?: string | null;
  danToc?: string | null;
  tonGiao?: string | null;
  queQuan?: string | null;
}

type MemberDetailFields = {
  id: string;
  tenToCongDoan: string | null;
  capBacQuanHam: string | null;
  anhDaiDienUrl: string | null;
  trangThai: string;
  diaChiLienHe: string | null;
  soTheDoanVien: string | null;
  trinhDoChuyenMon: string | null;
  hocHam: string | null;
  hocVi: string | null;
  chuyenNganhDaoTao: string | null;
  trinhDoLyLuanChinhTri: string | null;
  ghiChu: string | null;
};

export type MemberDetailDto = Omit<MemberInput, "ngoaiNgus"> & MemberDetailFields & {
  ngoaiNgus: (MemberLanguageInput & { id: string })[];
  lichSuBienDong: {
    id: string;
    loaiBienDong: string;
    ngayHieuLuc: string;
    tuToCongDoan: string | null;
    denToCongDoan: string | null;
    lyDo: string;
  }[];
};

export type MemberUpdate = MemberInput & Omit<MemberDetailFields, "tenToCongDoan" | "anhDaiDienUrl">;
