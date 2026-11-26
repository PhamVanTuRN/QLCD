"use client";

import TableText from "@/components/TableText";
import DataTable from "@/components/DataTable";

import useConfirmation from "@/components/useConfirmation";

import FormDialog from "@/components/FormDialog";

import { useResource } from "@/lib/use-resource";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import MemberSelect from "@/components/MemberSelect";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import type { InitiativeDto } from "@/lib/business-types";
import { apiMessage, getInitiativesApi, createInitiativeApi, updateInitiativeApi, deleteInitiativeApi, getCatalogsApi, getFlattenedUnits } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function InitiativesPage() {
  const { confirm, confirmationDialog } = useConfirmation();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { notice, dismiss, showAlert } = useNotice();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    doanVienId: "",
    tenDeTai: "",
    linhVuc: "",
    capDeTai: "",
    hieuQuaKinhTe: "",
    ngayNghiemThu: "",
    namThucHien: new Date().getFullYear(),
    ketQuaNghiemThu: "",
    trangThai: 1,
    fileMinhChungUrl: "",
    donViId: ""
  });

  const readPage = useCallback((signal: AbortSignal) => getInitiativesApi({ search: search.trim() || undefined, page }, signal), [search, page]);
  const { data: list, loading, error: listError, reload: loadData } = useResource(readPage, search ? 200 : 0);
  const initiatives = list?.data ?? [];
  const hasMore = list?.hasMore ?? false;

  const readChoices = useCallback(async (signal: AbortSignal) => {
    const [catalog, units] = await Promise.all([
      getCatalogsApi({ loai: "LoaiSangKien", activeOnly: true }, signal),
      getFlattenedUnits(signal),
    ]);
    return { catalog, units };
  }, []);
  const { data: choices, error: choicesError, reload: reloadChoices } = useResource(readChoices);
  const types = choices?.catalog ?? [];
  const units = choices?.units ?? [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedMember(null);
    setFormData({
      doanVienId: "",
      tenDeTai: "",
      linhVuc: "Y khoa",
      capDeTai: types[0]?.ma || "CAP_CO_SO",
      hieuQuaKinhTe: "",
      ngayNghiemThu: "",
      namThucHien: new Date().getFullYear(),
      ketQuaNghiemThu: "",
      trangThai: 1,
      fileMinhChungUrl: "",
      donViId: user?.role === "TOCD" ? user.donViId || "" : ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InitiativeDto) => {
    setEditingId(item.id);
    setSelectedMember(item.hoTenDoanVien);
    setFormData({
      doanVienId: item.doanVienId ?? "",
      tenDeTai: item.tenDeTai,
      linhVuc: item.linhVuc || "",
      capDeTai: item.capDeTai,
      hieuQuaKinhTe: item.hieuQuaKinhTe || "",
      ngayNghiemThu: item.ngayNghiemThu ? item.ngayNghiemThu.split("T")[0] : "",
      namThucHien: item.namThucHien || new Date().getFullYear(),
      ketQuaNghiemThu: item.ketQuaNghiemThu || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!await confirm("Bạn có chắc chắn muốn xóa sáng kiến này?")) return;
    try {
      await deleteInitiativeApi(id);
      showAlert("success", "Xóa sáng kiến thành công");
      if (initiatives.length === 1 && page > 1) setPage(page - 1);
      else loadData();
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi xóa sáng kiến"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.doanVienId || !formData.tenDeTai || !formData.linhVuc) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        donViId: formData.donViId || user?.donViId || "00000000-0000-0000-0000-000000000000",
        namThucHien: Number(formData.namThucHien),
        trangThai: Number(formData.trangThai),
        ngayNghiemThu: formData.ngayNghiemThu === "" ? null : formData.ngayNghiemThu
      };

      if (editingId) {
        await updateInitiativeApi(editingId, payload);
        showAlert("success", "Cập nhật sáng kiến thành công");
      } else {
        await createInitiativeApi(payload);
        showAlert("success", "Thêm mới sáng kiến thành công");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showAlert("error", apiMessage(err, "Đã xảy ra lỗi khi lưu thông tin"));
    } finally { setSubmitting(false); }
  };

  const getTypeName = (ma: string) => {
    return types.find((t) => t.ma === ma)?.ten || ma;
  };

  const getStatusName = (status: number) => {
    switch (status) {
      case 1: return "Đăng ký mới";
      case 2: return "Nghiệm thu Đạt";
      case 3: return "Từ chối/Hủy";
      default: return "Đăng ký";
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return "bg-brand-soft text-brand border-brand-line";
      case 2: return "bg-brand-soft text-brand border-brand-line";
      case 3: return "bg-danger-soft text-danger border-danger-line";
      default: return "bg-soft text-muted border-line";
    }
  };

  return (
    <div className="space-y-6">
      {confirmationDialog}
      {/* Alert */}
      <Notice value={notice} dismiss={dismiss} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Phong trào Sáng kiến & Đề tài Khoa học</h1>
          <p className="text-xs text-muted mt-1">
            Quản lý danh sách sáng kiến cải tiến kỹ thuật và đề tài nghiên cứu khoa học của cán bộ, đoàn viên
          </p>
        </div>
        <button
          disabled={!choices} onClick={handleOpenCreate}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-strong/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Đăng ký Sáng kiến
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Đề tài và sáng kiến trên trang</span>
          <div className="text-2xl font-extrabold text-ink mt-2">{initiatives.length} đăng ký</div>
          <p className="text-[10px] text-muted mt-1">Ghi nhận từ các tổ công đoàn trực thuộc</p>
        </div>
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Đã nghiệm thu thông qua</span>
          <div className="text-2xl font-extrabold text-brand mt-2">
            {initiatives.filter((i) => i.trangThai === 2).length} sáng kiến
          </div>
          <p className="text-[10px] text-muted mt-1">Có tính thực tiễn và hiệu quả kinh tế cao</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-line p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          aria-label="Tìm kiếm" maxLength={100}
          placeholder="Tìm kiếm theo tên đề tài, lĩnh vực, tác giả..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:max-w-md bg-surface border border-line rounded-xl px-4 py-2 text-xs text-ink focus:outline-none focus:border-brand transition-all"
        />
        <div className="text-xs text-muted">
          Hồ sơ trên trang: <span className="text-brand font-bold">{initiatives.length}</span>
        </div>
      </div>

      {/* Initiatives table */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <DataTable label="Bảng sáng kiến" footer={<ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-muted font-semibold">
                <th scope="col" className="py-3 px-4">Tên đề tài / Sáng kiến</th>
                <th scope="col" className="py-3 px-4">Cấp đề tài</th>
                <th scope="col" className="py-3 px-4">Tác giả (Đoàn viên)</th>
                <th scope="col" className="py-3 px-4">Lĩnh vực</th>
                <th scope="col" className="py-3 px-4 text-center">Năm thực hiện</th>
                <th scope="col" className="py-3 px-4 text-center">Nghiệm thu</th>
                <th scope="col" className="py-3 px-4 text-center">Trạng thái</th>
                <th scope="col" className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listError ? (
                <tr><td colSpan={8}><LoadState retry={loadData} /></td></tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    <span className="inline-block w-4 h-4 border-2 border-edge border-t-brand rounded-full animate-spin mr-2" />
                    Đang tải danh sách sáng kiến...
                  </td>
                </tr>
              ) : initiatives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    Chưa có sáng kiến nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                initiatives.map((item) => (
                  <tr key={item.id} className="hover:bg-soft text-copy">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-ink"><TableText text={item.tenDeTai} /></div>
                      {item.hieuQuaKinhTe && <div className="text-[10px] text-muted max-w-[200px]" title={item.hieuQuaKinhTe || undefined}><TableText text={item.hieuQuaKinhTe} /></div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-soft text-copy border border-line text-[10px]">
                        {getTypeName(item.capDeTai)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-ink"><TableText text={item.hoTenDoanVien} /></div>
                        {item.evidenceFileId && (
                          <a
                            href={`/api/v1/evidence-files/download/${item.evidenceFileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] text-brand hover:text-brand-hover font-bold bg-brand-soft border border-brand-line px-1 py-0.2 rounded transition-all"
                            title="Tải file minh chứng"
                          >
                            📄 PDF
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-muted">Mã NV: {item.maNhanVien || "—"} {item.tenDonVi && `• ${item.tenDonVi}`}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.linhVuc}</td>
                    <td className="py-3 px-4 text-center font-mono">{item.namThucHien}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-semibold text-copy">{item.ketQuaNghiemThu || "—"}</div>
                      {item.ngayNghiemThu && <div className="text-[9px] text-muted">{new Date(item.ngayNghiemThu).toLocaleDateString("vi-VN")}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.trangThai)}`}>
                        {getStatusName(item.trangThai)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(Boolean(item.doanVienId) && (user?.role === "CDCS" || item.trangThai === 1)) && (
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="bg-brand-soft hover:bg-soft-strong border border-brand-line text-brand px-2 py-1 rounded text-[10px] font-bold transition-all"
                        >
                          Sửa
                        </button>
                        )}
                        {(user?.role === "CDCS" || user?.role === "CDBP") && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-danger-soft hover:bg-danger-line border border-danger-line text-danger px-2 py-1 rounded text-[10px] font-bold transition-all"
                        >
                          Xóa
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </div>

      {Boolean(choicesError) && <LoadState message="Không thể tải lựa chọn cho biểu mẫu." retry={reloadChoices} />}

      {/* Modal Dialog */}
      {isModalOpen && (
        <FormDialog label="Thông tin sáng kiến" onClose={() => { setIsModalOpen(false); dismiss(); }} busy={submitting}>
          {notice?.type === "error" && <Notice value={notice} dismiss={dismiss} />}
            <div>
              <h3 className="text-sm font-bold text-ink">
                {editingId ? "Sửa thông tin đề tài" : "Đăng ký đề tài / sáng kiến mới"}
              </h3>
              <p className="text-[10px] text-muted mt-0.5">Nhập các chi tiết liên quan đến đề tài sáng kiến khoa học</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="initiatives-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Đơn vị *
                </label>
                <select id="initiatives-field-1"
                  value={formData.donViId}
                  onChange={(e) => setFormData({ ...formData, donViId: e.target.value, doanVienId: "" })}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  required
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.tenDonVi}</option>
                  ))}
                </select>
              </div>

              <MemberSelect label="Tác giả đăng ký" value={formData.doanVienId} selectedName={selectedMember} organizationId={formData.donViId} required
                  onChange={(value, organizationId) => setFormData(current => ({ ...current, doanVienId: value, donViId: organizationId ?? current.donViId }))} />

              <div>
                <label htmlFor="initiatives-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Tên đề tài / Sáng kiến *</label>
                <input id="initiatives-field-2"
                  type="text"
                  value={formData.tenDeTai}
                  onChange={(e) => setFormData({ ...formData, tenDeTai: e.target.value })}
                  placeholder="e.g. Cải tiến quy trình tiếp đón người bệnh bằng thẻ quét mã QR"
                  required
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="initiatives-field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Lĩnh vực nghiên cứu *</label>
                  <input id="initiatives-field-3"
                    type="text"
                    value={formData.linhVuc}
                    onChange={(e) => setFormData({ ...formData, linhVuc: e.target.value })}
                    placeholder="e.g. Quản lý Y tế"
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="initiatives-field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Cấp đề tài *</label>
                  <select id="initiatives-field-4"
                    value={formData.capDeTai}
                    onChange={(e) => setFormData({ ...formData, capDeTai: e.target.value })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="initiatives-field-5" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Năm thực hiện *</label>
                  <input id="initiatives-field-5"
                    type="number"
                    value={formData.namThucHien}
                    onChange={(e) => setFormData({ ...formData, namThucHien: parseInt(e.target.value) || new Date().getFullYear() })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="initiatives-field-6" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Ngày nghiệm thu</label>
                  <input id="initiatives-field-6"
                    type="date"
                    value={formData.ngayNghiemThu}
                    onChange={(e) => setFormData({ ...formData, ngayNghiemThu: e.target.value })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="initiatives-field-7" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Kết quả nghiệm thu</label>
                  <input id="initiatives-field-7"
                    type="text"
                    value={formData.ketQuaNghiemThu}
                    disabled={user?.role !== "CDCS"}
                    onChange={(e) => setFormData({ ...formData, ketQuaNghiemThu: e.target.value })}
                    placeholder="e.g. Đạt, Xuất sắc"
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="initiatives-field-8" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Hiệu quả kinh tế / thực tiễn</label>
                <textarea id="initiatives-field-8"
                  value={formData.hieuQuaKinhTe}
                  onChange={(e) => setFormData({ ...formData, hieuQuaKinhTe: e.target.value })}
                  placeholder="Mô tả hiệu quả xã hội hoặc số tiền tiết kiệm được cho bệnh viện..."
                  rows={2}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="initiatives-field-9" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Trạng thái đề tài</label>
                  <select id="initiatives-field-9"
                    value={formData.trangThai}
                    disabled={user?.role !== "CDCS"}
                    onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    <option value={1}>Mới đăng ký</option>
                    <option value={2}>Nghiệm thu Đạt</option>
                    <option value={3}>Từ chối/Hủy đề tài</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">File minh chứng PDF</label>
                  <EvidenceUpload
                    fileId={formData.fileMinhChungUrl}
                    initialFileName={editingId ? initiatives.find(i => i.id === editingId)?.evidenceFileName : undefined}
                    onChange={fileId => setFormData(current => ({ ...current, fileMinhChungUrl: fileId ?? "" }))}
                    moduleName="Initiatives"
                    organizationId={formData.donViId || user?.donViId || ""}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); dismiss(); }} disabled={submitting}
                  className="bg-soft hover:bg-soft-strong text-copy px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-strong/30 transition-all active:scale-95"
                >
                  Lưu
                </button>
              </div>
            </form>
        </FormDialog>
      )}
    </div>
  );
}
