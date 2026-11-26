"use client";

import useConfirmation from "@/components/useConfirmation";

import { useState, useCallback, use } from "react";
import { apiMessage, getMemberDetailApi, updateMemberApi, deleteMemberApi, getCatalogsApi, type CatalogDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import { useResource } from "@/lib/use-resource";
import type { MemberDetailDto, MemberLanguageInput } from "@/lib/business-types";

const trangThaiLabels: Record<string, string> = {
  DangSinhHoat: "Đang sinh hoạt",
  ChuyenDi: "Chuyển đi",
  NghiHuu: "Nghỉ hưu",
  RaKhoiCongDoan: "Ra khỏi công đoàn",
  TamDung: "Tạm dừng",
  KhoiPhuc: "Khôi phục"
};

const historyLabels: Record<string, string> = {
  KetNapMoi: "Kết nạp",
  ChuyenSinhHoat: "Chuyển sinh hoạt",
  DieuDongCongTac: "Điều động công tác",
  ChuyenToInternal: "Chuyển tổ",
  ChuyenCdbpInternal: "Chuyển công đoàn bộ phận",
  NghiHuu: "Nghỉ hưu",
  RaKhoiCongDoan: "Ra khỏi công đoàn",
  TamDungSinhHoat: "Tạm dừng sinh hoạt",
  KhoiPhucSinhHoat: "Khôi phục sinh hoạt",
};

const historyDate = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

function formatHistoryDate(value: string) {
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : value + "Z");
  return Number.isNaN(date.getTime()) ? "—" : historyDate.format(date);
}

const mapTrangThaiEnumToString = (val: number): string => {
  switch (val) {
    case 1: return "DangSinhHoat";
    case 2: return "ChuyenDi";
    case 3: return "NghiHuu";
    case 4: return "RaKhoiCongDoan";
    case 5: return "TamDung";
    case 6: return "KhoiPhuc";
    default: return "DangSinhHoat";
  }
};

const mapVaiTroEnumToString = (val: number): string => {
  switch (val) {
    case 1: return "DoanVien";
    case 2: return "ToTruong";
    case 3: return "ChuTichCDBP";
    case 4: return "PhoChuTichCDBP";
    case 5: return "ChuTichCDCS";
    case 6: return "PhoChuTichCDCS";
    case 7: return "UyVienBCH";
    default: return "DoanVien";
  }
};

const mapLoaiCanBoEnumToString = (val: number): string => {
  switch (val) {
    case 1: return "SiQuan";
    case 2: return "QuanNhanChuyenNghiep";
    case 3: return "CongNhanVienChucQuocPhong";
    case 4: return "LaoDongHopDong";
    case 5: return "Khac";
    default: return "SiQuan";
  }
};

const mapLoaiCanBoStringToEnum = (valStr: string): number => {
  switch (valStr) {
    case "SiQuan": return 1;
    case "QuanNhanChuyenNghiep": return 2;
    case "CongNhanVienChucQuocPhong": return 3;
    case "LaoDongHopDong": return 4;
    case "Khac": return 5;
    default: return 1;
  }
};

const mapVaiTroStringToEnum = (roleStr: string): number => {
  switch (roleStr) {
    case "DoanVien": return 1;
    case "ToTruong": return 2;
    case "ChuTichCDBP": return 3;
    case "PhoChuTichCDBP": return 4;
    case "ChuTichCDCS": return 5;
    case "PhoChuTichCDCS": return 6;
    case "UyVienBCH": return 7;
    default: return 1;
  }
};

const mapTrangThaiStringToEnum = (statusStr: string): number => {
  switch (statusStr) {
    case "DangSinhHoat": return 1;
    case "ChuyenDi": return 2;
    case "NghiHuu": return 3;
    case "RaKhoiCongDoan": return 4;
    case "TamDung": return 5;
    case "KhoiPhuc": return 6;
    default: return 1;
  }
};

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { notice, dismiss, showAlert } = useNotice();
  const readDetail = useCallback((signal: AbortSignal) => getMemberDetailApi(id, signal), [id]);
  const { data: member, error, loading, reload } = useResource(readDetail);
  const readCatalogs = useCallback((signal: AbortSignal) => Promise.all([
    getCatalogsApi({ loai: "NgoaiNgu", activeOnly: true }, signal),
    getCatalogsApi({ loai: "TrinhDoNgoaiNgu", activeOnly: true }, signal),
  ]), []);
  const { data: catalogs, error: catalogError, reload: reloadCatalogs } = useResource(readCatalogs);

  return <>
    <Notice value={notice} dismiss={dismiss} />
    {loading || !member ? <div className="space-y-4">
      <LoadState loading={loading} message={apiMessage(error, "Không thể tải hồ sơ đoàn viên.")} retry={reload} />
      {!loading && <Link href="/members" className="inline-block text-brand-strong underline">Về danh sách đoàn viên</Link>}
    </div> : <MemberDetail member={member} catalogs={catalogs} showAlert={showAlert} reload={reload} />}
    {Boolean(catalogError) && <LoadState message="Không thể tải danh mục ngoại ngữ." retry={reloadCatalogs} />}
  </>;
}

function MemberDetail({ member, catalogs, showAlert, reload }: {
  member: MemberDetailDto;
  catalogs?: [CatalogDto[], CatalogDto[]];
  showAlert: (type: "success" | "error", message: string) => void;
  reload: () => void;
}) {
  const { confirm, confirmationDialog } = useConfirmation();
  const { id } = member;
  const { user } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [isEditing, setIsEditing] = useState(search.get("edit") === "true");
  const [submitting, setSubmitting] = useState(false);
  const canDelete = user?.role === "ADMIN" || user?.role === "CDCS";
  const [languagesList, levelsList] = catalogs ?? [[], []];

  function makeDraft(data: MemberDetailDto) {
    return {
    hoTen: data.hoTen || "",
    ngaySinh: data.ngaySinh ? data.ngaySinh.split("T")[0] : "",
    gioiTinh: data.gioiTinh ?? 1,
    queQuan: data.queQuan || "",
    danToc: data.danToc || "Kinh",
    tonGiao: data.tonGiao || "Không",
    soCCCD: data.soCCCD || "",
    dienThoai: data.dienThoai || "",
    email: data.email || "",
    diaChiLienHe: data.diaChiLienHe || "",
    maNhanVien: data.maNhanVien || "",
    chucVu: data.chucVu || "",
    chucDanhChuyenMon: data.chucDanhChuyenMon || "",
    donViCongTac: data.donViCongTac || "",
    loaiCanBo: mapLoaiCanBoStringToEnum(data.loaiCanBo),
    maToCongDoan: data.maToCongDoan || "",
    ngayVaoCongDoan: data.ngayVaoCongDoan ? data.ngayVaoCongDoan.split("T")[0] : "",
    soTheDoanVien: data.soTheDoanVien || "",
    vaiTro: mapVaiTroStringToEnum(data.vaiTro),
    trangThai: mapTrangThaiStringToEnum(data.trangThai),
    trinhDoHocVan: data.trinhDoHocVan || "",
    trinhDoChuyenMon: data.trinhDoChuyenMon || "",
    hocHam: data.hocHam || "",
    hocVi: data.hocVi || "",
    chuyenNganhDaoTao: data.chuyenNganhDaoTao || "",
    trinhDoLyLuanChinhTri: data.trinhDoLyLuanChinhTri || "",
    dangVien: data.dangVien ?? false,
    ghiChu: data.ghiChu || "",
    ngoaiNgus: data.ngoaiNgus ? data.ngoaiNgus.map((l) => ({
      ngoaiNgu: l.ngoaiNgu,
      trinhDo: l.trinhDo,
      diemSo: l.diemSo ?? 0,
      ngayCap: l.ngayCap ? l.ngayCap.split("T")[0] : "",
      donViCap: l.donViCap || "",
      fileChungChiUrl: l.fileChungChiUrl || ""
    })) : []
      };
  }
  const [formData, setFormData] = useState(() => makeDraft(member));

  const handleAddLanguageRow = () => {
    setFormData((prev) => ({
      ...prev,
      ngoaiNgus: [
        ...prev.ngoaiNgus,
        {
          ngoaiNgu: languagesList[0]?.ma || "TIENG_ANH",
          trinhDo: levelsList[0]?.ma || "CO_BAN",
          diemSo: 0,
          ngayCap: new Date().toISOString().split("T")[0],
          donViCap: "",
          fileChungChiUrl: ""
        }
      ]
    }));
  };

  const handleRemoveLanguageRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ngoaiNgus: prev.ngoaiNgus.filter((_, idx) => idx !== index)
    }));
  };

  const handleLanguageFieldChange = <K extends keyof MemberLanguageInput>(index: number, field: K, val: MemberLanguageInput[K]) => {
    setFormData((prev) => {
      const updated = [...prev.ngoaiNgus];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, ngoaiNgus: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.hoTen || !formData.soCCCD || !formData.maNhanVien || !formData.maToCongDoan) {
      showAlert("error", "Vui lòng nhập đầy đủ các trường thông tin bắt buộc (*)");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        id,
        ...formData,
        email: formData.email.trim() || null,
        capBacQuanHam: member.capBacQuanHam,
        gioiTinh: Number(formData.gioiTinh),
        loaiCanBo: mapLoaiCanBoEnumToString(Number(formData.loaiCanBo)),
        vaiTro: mapVaiTroEnumToString(Number(formData.vaiTro)),
        trangThai: mapTrangThaiEnumToString(Number(formData.trangThai))
      };

      await updateMemberApi(id, payload);
      showAlert("success", "Cập nhật hồ sơ đoàn viên thành công");
      setIsEditing(false);
      reload();
    } catch (err) {
      showAlert("error", apiMessage(err, "Đã xảy ra lỗi khi lưu thông tin"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!await confirm(`Bạn có chắc chắn muốn xóa hồ sơ đoàn viên "${member.hoTen}" khỏi hệ thống?`)) return;
    try {
      await deleteMemberApi(id);
      router.push("/members");
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi khi xóa hồ sơ đoàn viên"));
    }
  };

  return (
    <div className="space-y-6">
      {confirmationDialog}
      {/* Nav breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/members" className="hover:text-ink transition-all">Quản lý Đoàn viên</Link>
          <span>/</span>
          <span className="text-ink">Hồ sơ chi tiết</span>
        </div>
        <div className="flex gap-2">
          <Link
            href="/members"
            className="bg-soft hover:bg-soft-strong text-copy px-4 py-2 rounded-xl text-xs font-semibold border border-line transition-all"
          >
            ⬅️ Quay lại
          </Link>
          {!isEditing ? (
            <>
              <button
                onClick={() => { setFormData(makeDraft(member)); setIsEditing(true); }}
                className="bg-brand hover:bg-brand-hover text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-brand-strong/20 transition-all"
              >
                📝 Chỉnh sửa
              </button>
              {canDelete && (
              <button
                onClick={handleDelete}
                className="bg-danger hover:bg-danger-strong text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-danger-strong/20 transition-all"
              >
                🗑️ Xóa Hồ Sơ
              </button>
              )}
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-danger-soft hover:bg-danger-line text-danger px-4 py-2 rounded-xl text-xs font-semibold border border-danger-line transition-all"
            >
              Hủy sửa
            </button>
          )}
        </div>
      </div>

      {!isEditing && <section className="panel p-4 sm:p-6" aria-labelledby="member-history-title">
        <h2 id="member-history-title" className="font-semibold">Lịch sử biến động</h2>
        {member.lichSuBienDong.length ? <ol className="mt-2 divide-y divide-line">
          {member.lichSuBienDong.map(event => <li key={event.id} className="space-y-1 py-3 text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong>{historyLabels[event.loaiBienDong] ?? event.loaiBienDong}</strong>
              <time dateTime={event.ngayHieuLuc} className="text-copy">{formatHistoryDate(event.ngayHieuLuc)}</time>
            </div>
            {(event.tuToCongDoan || event.denToCongDoan) && <p className="text-copy">
              {[event.tuToCongDoan, event.denToCongDoan].filter(Boolean).join(" → ")}
            </p>}
            <p className="break-words text-copy">{event.lyDo}</p>
          </li>)}
        </ol> : <p className="mt-2 text-sm text-copy">Chưa có biến động trong phạm vi quản lý.</p>}
      </section>}

      {!isEditing ? (
        // VIEW DETAILS SCREEN
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left card: avatar & general */}
          <div className="bg-surface border border-line p-6 rounded-2xl space-y-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-brand to-brand-strong flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-brand-strong/40 relative">
              {member.hoTen.split(" ").map((w: string) => w[0]).slice(-2).join("")}
              {member.dangVien && (
                <span className="absolute bottom-1 right-1 bg-danger border border-surface rounded-full w-7 h-7 flex items-center justify-center text-xs" title="Đảng viên">
                  ★
                </span>
              )}
            </div>
            <div>
              <h1 className="break-words text-lg font-bold text-ink">{member.hoTen}</h1>
              <p className="text-xs text-muted mt-1">Mã NV: {member.maNhanVien} • {member.gioiTinh === 0 ? "Nữ" : "Nam"}</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold mt-2.5 border ${
                member.trangThai === "DangSinhHoat"
                  ? "bg-brand-soft text-brand border-brand-line"
                  : "bg-gold-soft text-gold-ink border-gold-line"
              }`}>
                {trangThaiLabels[member.trangThai] || member.trangThai}
              </span>
            </div>

            <div className="w-full border-t border-line pt-4 text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Đơn vị sinh hoạt</span>
                <span className="font-semibold text-brand">{member.tenToCongDoan || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Vai trò CĐ</span>
                <span className="font-semibold text-ink">{member.vaiTro}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Chức vụ</span>
                <span className="font-semibold text-copy">{member.chucVu || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Đơn vị công tác</span>
                <span className="font-semibold text-copy text-right">{member.donViCongTac || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Ngày vào CĐ</span>
                <span className="font-semibold text-copy">
                  {member.ngayVaoCongDoan ? new Date(member.ngayVaoCongDoan).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Right section: details and certifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <div className="bg-surface border border-line p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-line pb-2">
                Thông tin cá nhân & Học vấn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted block mb-1">Số CCCD</span>
                  <span className="text-ink font-semibold">{member.soCCCD}</span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Ngày sinh</span>
                  <span className="text-ink font-semibold">
                    {member.ngaySinh ? new Date(member.ngaySinh).toLocaleDateString("vi-VN") : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Dân tộc / Tôn giáo</span>
                  <span className="text-ink font-semibold">{member.danToc || "Kinh"} / {member.tonGiao || "Không"}</span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Quê quán</span>
                  <span className="text-ink font-semibold">{member.queQuan || "—"}</span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Điện thoại / Email</span>
                  <span className="text-ink font-semibold">
                    {member.dienThoai || "—"} {member.email ? `• ${member.email}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Địa chỉ liên hệ</span>
                  <span className="text-ink font-semibold">{member.diaChiLienHe || "—"}</span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Trình độ học vấn / Chuyên môn</span>
                  <span className="text-ink font-semibold">
                    {member.trinhDoHocVan || "—"} / {member.trinhDoChuyenMon || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted block mb-1">Học hàm / Học vị</span>
                  <span className="text-ink font-semibold">
                    {member.hocHam || "—"} / {member.hocVi || "—"}
                  </span>
                </div>
              </div>

              {member.ghiChu && (
                <div className="pt-2 border-t border-line text-xs">
                  <span className="text-muted block mb-1">Ghi chú</span>
                  <p className="text-copy italic">{member.ghiChu}</p>
                </div>
              )}
            </div>

            {/* Foreign languages certifications */}
            <div className="bg-surface border border-line p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider border-b border-line pb-2">
                Trình độ Ngoại ngữ & Chứng chỉ
              </h3>
              <div className="overflow-x-auto" role="region" aria-label="Bảng chứng chỉ ngoại ngữ" tabIndex={0}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-line text-muted font-medium">
                      <th scope="col" className="py-2.5">Ngoại ngữ</th>
                      <th scope="col" className="py-2.5">Trình độ</th>
                      <th scope="col" className="py-2.5 text-center">Điểm số (Nếu có)</th>
                      <th scope="col" className="py-2.5">Ngày cấp chứng chỉ</th>
                      <th scope="col" className="py-2.5">Đơn vị cấp</th>
                      <th scope="col" className="py-2.5 text-right">Chứng chỉ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-copy">
                    {member.ngoaiNgus && member.ngoaiNgus.length > 0 ? (
                      member.ngoaiNgus.map((lang) => (
                        <tr key={lang.id}>
                          <td className="py-3 font-semibold text-brand">{languagesList.find(item => item.ma === lang.ngoaiNgu)?.ten ?? lang.ngoaiNgu}</td>
                          <td className="py-3 font-medium">{levelsList.find(item => item.ma === lang.trinhDo)?.ten ?? lang.trinhDo}</td>
                          <td className="py-3 text-center font-mono">{lang.diemSo > 0 ? lang.diemSo : "—"}</td>
                          <td className="py-3">
                            {lang.ngayCap ? new Date(lang.ngayCap).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="py-3 text-muted">{lang.donViCap || "—"}</td>
                          <td className="py-3 text-right">
                            {lang.fileChungChiUrl ? (
                              <a
                                href={lang.fileChungChiUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-brand hover:underline font-semibold"
                              >
                                Xem file 📁
                              </a>
                            ) : (
                              <span className="text-muted">Chưa có tệp</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted">
                          Chưa cập nhật thông tin chứng chỉ ngoại ngữ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // EDIT MODE FORM SCREEN
        <form onSubmit={handleSave} className="bg-surface border border-line p-6 rounded-2xl space-y-6">
          <h3 className="text-base font-bold text-ink uppercase tracking-wider border-b border-line pb-3 flex items-center gap-2">
            <span>📝</span> Chỉnh sửa thông tin đoàn viên
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* General Info */}
            <div>
              <label htmlFor="members--id--field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Họ và tên *</label>
              <input id="members--id--field-1"
                type="text"
                value={formData.hoTen}
                onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                required
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Ngày sinh *</label>
              <input id="members--id--field-2"
                type="date"
                value={formData.ngaySinh}
                onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                required
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Giới tính</label>
              <select id="members--id--field-3"
                value={formData.gioiTinh}
                onChange={(e) => setFormData({ ...formData, gioiTinh: Number(e.target.value) })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              >
                <option value={1}>Nam</option>
                <option value={0}>Nữ</option>
                <option value={2}>Khác</option>
              </select>
            </div>

            <div>
              <label htmlFor="members--id--field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Số CCCD / CMTQĐ *</label>
              <input id="members--id--field-4"
                type="text"
                value={formData.soCCCD}
                onChange={(e) => setFormData({ ...formData, soCCCD: e.target.value })}
                required
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-5" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Mã nhân viên *</label>
              <input id="members--id--field-5"
                type="text"
                value={formData.maNhanVien}
                onChange={(e) => setFormData({ ...formData, maNhanVien: e.target.value })}
                required
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-6" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Đơn vị Công đoàn *</label>
              <input id="members--id--field-6" readOnly value={member.tenToCongDoan ?? ""} className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-copy" />
              <p className="text-[10px] text-muted mt-1 leading-relaxed">
                * Cho phép chọn Tổ công đoàn hoặc Công đoàn bộ phận (CĐBP) / Công đoàn cơ sở (CĐCS) trực tiếp.
              </p>
            </div>

            <div>
              <label htmlFor="members--id--field-7" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Điện thoại</label>
              <input id="members--id--field-7"
                type="text"
                value={formData.dienThoai}
                onChange={(e) => setFormData({ ...formData, dienThoai: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-8" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Email</label>
              <input id="members--id--field-8"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-9" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Địa chỉ liên hệ</label>
              <input id="members--id--field-9"
                type="text"
                value={formData.diaChiLienHe}
                onChange={(e) => setFormData({ ...formData, diaChiLienHe: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>

            <div>
              <label htmlFor="members--id--field-10" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Quê quán</label>
              <input id="members--id--field-10"
                type="text"
                value={formData.queQuan}
                onChange={(e) => setFormData({ ...formData, queQuan: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-11" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Dân tộc</label>
              <input id="members--id--field-11"
                type="text"
                value={formData.danToc}
                onChange={(e) => setFormData({ ...formData, danToc: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-12" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Tôn giáo</label>
              <input id="members--id--field-12"
                type="text"
                value={formData.tonGiao}
                onChange={(e) => setFormData({ ...formData, tonGiao: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>

            {/* Professional Info */}
            <div>
              <label htmlFor="members--id--field-13" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Chức vụ chính quyền</label>
              <input id="members--id--field-13"
                type="text"
                value={formData.chucVu}
                onChange={(e) => setFormData({ ...formData, chucVu: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-14" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Chức danh chuyên môn</label>
              <input id="members--id--field-14"
                type="text"
                value={formData.chucDanhChuyenMon}
                onChange={(e) => setFormData({ ...formData, chucDanhChuyenMon: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-15" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Khoa/Phòng công tác</label>
              <input id="members--id--field-15"
                type="text"
                value={formData.donViCongTac}
                onChange={(e) => setFormData({ ...formData, donViCongTac: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label htmlFor="members--id--field-16" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Loại cán bộ</label>
              <select id="members--id--field-16"
                value={formData.loaiCanBo}
                onChange={(e) => setFormData({ ...formData, loaiCanBo: Number(e.target.value) })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              >
                <option value={1}>Sĩ quan</option>
                <option value={2}>QN chuyên nghiệp</option>
                <option value={3}>CNV quốc phòng</option>
                <option value={4}>Lao động hợp đồng</option>
                <option value={5}>Khác</option>
              </select>
            </div>

            {/* Union Info */}
            <div>
              <label htmlFor="members--id--field-17" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Vai trò công đoàn</label>
              <select id="members--id--field-17"
                value={formData.vaiTro}
                onChange={(e) => setFormData({ ...formData, vaiTro: Number(e.target.value) })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              >
                <option value={1}>Đoàn viên</option>
                <option value={2}>Tổ trưởng Tổ CĐ</option>
                <option value={3}>Chủ tịch CĐBP</option>
                <option value={4}>Phó Chủ tịch CĐBP</option>
                <option value={5}>Chủ tịch CĐCS</option>
                <option value={6}>Phó Chủ tịch CĐCS</option>
                <option value={7}>Ủy viên BCH</option>
              </select>
            </div>
            <div>
              <label htmlFor="members--id--field-18" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Trạng thái sinh hoạt</label>
              <select id="members--id--field-18"
                value={formData.trangThai}
                onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              >
                <option value={1}>Đang sinh hoạt</option>
                <option value={2}>Chuyển đi</option>
                <option value={3}>Nghỉ hưu</option>
                <option value={4}>Ra khỏi công đoàn</option>
                <option value={5}>Tạm dừng</option>
                <option value={6}>Khôi phục</option>
              </select>
            </div>
            <div>
              <label htmlFor="members--id--field-19" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Ngày vào công đoàn *</label>
              <input id="members--id--field-19"
                type="date"
                value={formData.ngayVaoCongDoan}
                onChange={(e) => setFormData({ ...formData, ngayVaoCongDoan: e.target.value })}
                required
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>

            {/* Academic Info */}
            <div>
              <label htmlFor="members--id--field-20" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Trình độ học vấn</label>
              <input id="members--id--field-20"
                type="text"
                value={formData.trinhDoHocVan}
                onChange={(e) => setFormData({ ...formData, trinhDoHocVan: e.target.value })}
                className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Học hàm / Học vị</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Học hàm"
                  value={formData.hocHam}
                  onChange={(e) => setFormData({ ...formData, hocHam: e.target.value })}
                  className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
                />
                <input
                  type="text"
                  placeholder="Học vị"
                  value={formData.hocVi}
                  onChange={(e) => setFormData({ ...formData, hocVi: e.target.value })}
                  className="w-full bg-surface border border-line rounded-xl px-3 py-2.5 text-ink focus:outline-none focus:border-brand"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Đảng viên</label>
              <div className="flex items-center gap-3 mt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dangVien}
                    onChange={(e) => setFormData({ ...formData, dangVien: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-edge after:border-line after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-danger peer-checked:after:bg-white" />
                  <span className="ml-2 text-xs font-semibold text-muted">Là Đảng viên</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="members--id--field-21" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">Ghi chú bổ sung</label>
            <textarea id="members--id--field-21"
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              rows={2}
              className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-ink focus:outline-none focus:border-brand resize-none"
            />
          </div>

          {/* DYNAMIC LANGUAGES EDITING */}
          <div className="border-t border-line pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ink uppercase tracking-wider">Danh sách Chứng chỉ Ngoại ngữ</span>
              <button
                type="button"
                onClick={handleAddLanguageRow}
                className="bg-brand-soft hover:bg-soft-strong border border-brand-line text-brand hover:text-brand-hover px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              >
                ➕ Thêm ngoại ngữ
              </button>
            </div>

            <div className="space-y-4">
              {formData.ngoaiNgus && formData.ngoaiNgus.length > 0 ? (
                formData.ngoaiNgus.map((lang: MemberLanguageInput, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-surface border border-line p-4 rounded-xl items-end">
                    <div>
                      <label htmlFor={`member-language-22-${index}`} className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Ngoại ngữ</label>
                      <select id={`member-language-22-${index}`}
                        value={lang.ngoaiNgu}
                        onChange={(e) => handleLanguageFieldChange(index, "ngoaiNgu", e.target.value)}
                        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      >
                        {languagesList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {languagesList.length === 0 && <option value="TIENG_ANH">Tiếng Anh</option>}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`member-language-23-${index}`} className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Trình độ</label>
                      <select id={`member-language-23-${index}`}
                        value={lang.trinhDo}
                        onChange={(e) => handleLanguageFieldChange(index, "trinhDo", e.target.value)}
                        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      >
                        {levelsList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {levelsList.length === 0 && <option value="CO_BAN">Cơ bản</option>}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`member-language-24-${index}`} className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Điểm số</label>
                      <input id={`member-language-24-${index}`}
                        type="number"
                        step="0.1"
                        value={lang.diemSo}
                        onChange={(e) => handleLanguageFieldChange(index, "diemSo", parseFloat(e.target.value) || 0)}
                        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label htmlFor={`member-language-25-${index}`} className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Ngày cấp</label>
                      <input id={`member-language-25-${index}`}
                        type="date"
                        value={lang.ngayCap}
                        onChange={(e) => handleLanguageFieldChange(index, "ngayCap", e.target.value)}
                        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div>
                      <label htmlFor={`member-language-26-${index}`} className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Đơn vị cấp</label>
                      <input id={`member-language-26-${index}`}
                        type="text"
                        value={lang.donViCap ?? ""}
                        onChange={(e) => handleLanguageFieldChange(index, "donViCap", e.target.value)}
                        placeholder="e.g. British Council"
                        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="url"
                        aria-label={`URL chứng chỉ ${index + 1}`}
                        placeholder="https://…"
                        value={lang.fileChungChiUrl ?? ""}
                        onChange={(e) => handleLanguageFieldChange(index, "fileChungChiUrl", e.target.value)}
                        className="w-full bg-surface border border-line rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-brand"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguageRow(index)} aria-label={`Xóa ngoại ngữ ${index + 1}`}
                        className="bg-danger-soft hover:bg-danger-line border border-danger-line text-danger hover:text-danger-strong px-3 py-2 rounded-xl transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted bg-surface border border-dashed border-line rounded-xl">
                  Đoàn viên chưa có chứng chỉ ngoại ngữ nào. Bấm nút Thêm ngoại ngữ ở trên để bổ sung.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-line">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-soft hover:bg-soft-strong text-copy px-5 py-2.5 rounded-xl font-bold transition-all"
            >
              Hủy chỉnh sửa
            </button>
            <button
              type="submit" disabled={submitting}
              className="bg-brand hover:bg-brand-hover text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-strong/30 transition-all active:scale-95"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
