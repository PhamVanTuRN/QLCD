"use client";

import useConfirmation from "@/components/useConfirmation";

import FormDialog from "@/components/FormDialog";

import { useResource } from "@/lib/use-resource";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import MemberSelect from "@/components/MemberSelect";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import type { EmulationDto } from "@/lib/business-types";
import { apiMessage, getEmulationsApi, createEmulationApi, updateEmulationApi, deleteEmulationApi, getCatalogsApi, getFlattenedUnits } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function EmulationsPage() {
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
  const [memberUnit, setMemberUnit] = useState("");
  const [formData, setFormData] = useState({
    tenPhongTrao: "",
    doanVienId: "",
    donViId: "",
    nam: new Date().getFullYear(),
    diemTuDanhGia: 90,
    diemBchDuyet: 0,
    xepLoai: "",
    khenThuong: "",
    trangThai: 1,
    fileMinhChungUrl: ""
  });

  const readPage = useCallback((signal: AbortSignal) => getEmulationsApi({ search: search.trim() || undefined, page }, signal), [search, page]);
  const { data: list, loading, error: listError, reload: loadData } = useResource(readPage, search ? 200 : 0);
  const emulations = list?.data ?? [];
  const hasMore = list?.hasMore ?? false;

  const readChoices = useCallback(async (signal: AbortSignal) => {
    const [catalog, units] = await Promise.all([
      getCatalogsApi({ loai: "ChatLuongDoanVien", activeOnly: true }, signal),
      getFlattenedUnits(signal),
    ]);
    return { catalog, units };
  }, []);
  const { data: choices, error: choicesError, reload: reloadChoices } = useResource(readChoices);
  const ratings = choices?.catalog ?? [];
  const units = choices?.units ?? [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedMember(null);
    setMemberUnit("");
    setFormData({
      tenPhongTrao: "",
      doanVienId: "",
      donViId: user?.donViId || "",
      nam: new Date().getFullYear(),
      diemTuDanhGia: 90,
      diemBchDuyet: 0,
      xepLoai: ratings[0]?.ma || "HOAN_THANH_TOT",
      khenThuong: "",
      trangThai: 1,
      fileMinhChungUrl: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: EmulationDto) => {
    setEditingId(item.id);
    setSelectedMember(item.hoTenDoanVien);
    setMemberUnit(item.doanVienId ? item.donViId ?? "" : "");
    setFormData({
      tenPhongTrao: item.tenPhongTrao,
      doanVienId: item.doanVienId || "",
      donViId: item.doanVienId ? "" : item.donViId ?? "",
      nam: item.nam || new Date().getFullYear(),
      diemTuDanhGia: item.diemTuDanhGia || 0,
      diemBchDuyet: item.diemBchDuyet || 0,
      xepLoai: item.xepLoai,
      khenThuong: item.khenThuong || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!await confirm("Bạn có chắc chắn muốn xóa kết quả thi đua này?")) return;
    try {
      await deleteEmulationApi(id);
      showAlert("success", "Xóa kết quả thi đua thành công");
      loadData();
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi xóa thi đua"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.tenPhongTrao) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        doanVienId: formData.doanVienId === "" ? null : formData.doanVienId,
        donViId: formData.donViId === "" ? null : formData.donViId,
        nam: Number(formData.nam),
        diemTuDanhGia: Number(formData.diemTuDanhGia),
        diemBchDuyet: Number(formData.diemBchDuyet),
        trangThai: Number(formData.trangThai)
      };

      if (editingId) {
        await updateEmulationApi(editingId, payload);
        showAlert("success", "Cập nhật thi đua thành công");
      } else {
        await createEmulationApi(payload);
        showAlert("success", "Đăng ký thi đua thành công");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showAlert("error", apiMessage(err, "Đã xảy ra lỗi khi lưu thông tin"));
    } finally { setSubmitting(false); }
  };

  const getRatingName = (ma: string) => {
    return ratings.find((r) => r.ma === ma)?.ten || ma;
  };

  const getStatusName = (status: number) => {
    switch (status) {
      case 1: return "Đã đăng ký";
      case 2: return "Đã đánh giá";
      case 3: return "Đạt danh hiệu";
      default: return "Đăng ký";
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return "bg-brand-soft text-brand border-brand-line";
      case 2: return "bg-gold-soft text-gold-ink border-gold-line";
      case 3: return "bg-brand-soft text-brand border-brand-line";
      default: return "bg-soft text-muted border-line";
    }
  };

  return (
    <div className="space-y-6">
      {confirmationDialog}
      {/* Alert */}
      <Notice value={notice} dismiss={dismiss} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Phong trào Thi đua & Đánh giá phân loại</h1>
          <p className="text-xs text-muted mt-1">
            Đăng ký tham gia phong trào, tự đánh giá chấm điểm và bình xét khen thưởng trực tuyến
          </p>
        </div>
        <button
          disabled={!choices} onClick={handleOpenCreate}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-strong/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Khai báo Thi đua
        </button>
      </div>

      {/* Statistics */}
      <h2 className="text-sm font-semibold text-copy">Thống kê trên trang này</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Đăng ký trên trang</span>
          <div className="text-2xl font-extrabold text-ink mt-2">{emulations.length} hồ sơ</div>
          <p className="text-[10px] text-muted mt-1">Gồm thi đua cá nhân và tập thể đơn vị</p>
        </div>
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Lượt được Khen thưởng</span>
          <div className="text-2xl font-extrabold text-brand mt-2">
            {emulations.filter((e) => e.trangThai === 3).length} chiến sĩ thi đua
          </div>
          <p className="text-[10px] text-muted mt-1">Đã được BCH duyệt và cấp bằng khen/giấy khen</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-line p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          aria-label="Tìm kiếm" maxLength={100}
          placeholder="Tìm kiếm theo tên phong trào, khen thưởng..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:max-w-md bg-surface border border-line rounded-xl px-4 py-2 text-xs text-ink focus:outline-none focus:border-brand transition-all"
        />
        <div className="text-xs text-muted">
          Hồ sơ trên trang: <span className="text-brand font-bold">{emulations.length}</span>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="overflow-x-auto" role="region" aria-label="Bảng hồ sơ thi đua" tabIndex={0}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-muted font-semibold">
                <th scope="col" className="py-3 px-4">Tên phong trào thi đua</th>
                <th scope="col" className="py-3 px-4">Đối tượng</th>
                <th scope="col" className="py-3 px-4 text-center">Năm</th>
                <th scope="col" className="py-3 px-4 text-center">Điểm tự chấm</th>
                <th scope="col" className="py-3 px-4 text-center">Điểm duyệt</th>
                <th scope="col" className="py-3 px-4">Xếp loại</th>
                <th scope="col" className="py-3 px-4">Hình thức khen thưởng</th>
                <th scope="col" className="py-3 px-4 text-center">Trạng thái</th>
                <th scope="col" className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listError ? (
                <tr><td colSpan={9}><LoadState retry={loadData} /></td></tr>
              ) : loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    <span className="inline-block w-4 h-4 border-2 border-edge border-t-brand rounded-full animate-spin mr-2" />
                    Đang tải danh sách thi đua...
                  </td>
                </tr>
              ) : emulations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-muted">
                    Chưa có đăng ký thi đua nào được khai báo.
                  </td>
                </tr>
              ) : (
                emulations.map((item) => (
                  <tr key={item.id} className="hover:bg-soft text-copy">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{item.tenPhongTrao}</span>
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
                    </td>
                    <td className="py-3 px-4">
                      {item.hoTenDoanVien ? (
                        <div>
                          <div className="font-semibold text-ink">{item.hoTenDoanVien}</div>
                          <div className="text-[10px] text-muted">Đoàn viên</div>
                        </div>
                      ) : item.tenDonVi ? (
                        <div>
                          <div className="font-semibold text-brand">{item.tenDonVi}</div>
                          <div className="text-[10px] text-muted">Tập thể</div>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{item.nam}</td>
                    <td className="py-3 px-4 text-center font-mono text-muted">{item.diemTuDanhGia}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-brand">{item.diemBchDuyet}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-soft text-copy border border-line text-[10px]">
                        {getRatingName(item.xepLoai)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand font-semibold">{item.khenThuong || "Chưa bình xét"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.trangThai)}`}>
                        {getStatusName(item.trangThai)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(user?.role === "CDCS" || item.trangThai === 1) && (
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
          <ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />
        </div>
      </div>

      {Boolean(choicesError) && <LoadState message="Không thể tải lựa chọn cho biểu mẫu." retry={reloadChoices} />}

      {/* Modal Dialog */}
      {isModalOpen && (
        <FormDialog label="Thông tin thi đua" onClose={() => { setIsModalOpen(false); dismiss(); }} busy={submitting}>
          {notice?.type === "error" && <Notice value={notice} dismiss={dismiss} />}
            <div>
              <h3 className="text-sm font-bold text-ink">{editingId ? "Sửa kết quả thi đua" : "Khai báo kết quả thi đua"}</h3>
              <p className="text-[10px] text-muted mt-0.5">Nhập các chi tiết liên quan đến phong trào bình xét thi đua</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="emulations-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Tên phong trào thi đua *</label>
                <input id="emulations-field-1"
                  type="text"
                  value={formData.tenPhongTrao}
                  onChange={(e) => setFormData({ ...formData, tenPhongTrao: e.target.value })}
                  placeholder="e.g. Phong trào thi đua Lao động giỏi - Lao động sáng tạo"
                  required
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <MemberSelect label="Cá nhân tham gia thi đua" value={formData.doanVienId} selectedName={selectedMember}
                  onChange={(value, unit) => {
                    setMemberUnit(unit ?? "");
                    setFormData(current => ({ ...current, doanVienId: value, donViId: value ? "" : current.donViId }));
                  }} />
                <div>
                  <label htmlFor="emulations-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Thi đua Tập thể (Chọn Đơn vị)</label>
                  <select id="emulations-field-2"
                    value={formData.donViId}
                    onChange={(e) => setFormData({ ...formData, donViId: e.target.value, doanVienId: e.target.value !== "" ? "" : formData.doanVienId })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    <option value="">Chọn tập thể thi đua...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.tenDonVi}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="emulations-field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Năm thi đua *</label>
                  <input id="emulations-field-3"
                    type="number"
                    value={formData.nam}
                    onChange={(e) => setFormData({ ...formData, nam: parseInt(e.target.value) || new Date().getFullYear() })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="emulations-field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Điểm tự đánh giá *</label>
                  <input id="emulations-field-4"
                    type="number"
                    step="0.1"
                    value={formData.diemTuDanhGia}
                    onChange={(e) => setFormData({ ...formData, diemTuDanhGia: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="emulations-field-5" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Điểm BCH duyệt *</label>
                  <input id="emulations-field-5"
                    type="number"
                    step="0.1"
                    value={formData.diemBchDuyet}
                    disabled={user?.role !== "CDCS"}
                    onChange={(e) => setFormData({ ...formData, diemBchDuyet: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emulations-field-6" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Xếp loại thi đua *</label>
                  <select id="emulations-field-6"
                    value={formData.xepLoai}
                    disabled={!!editingId && user?.role !== "CDCS"}
                    onChange={(e) => setFormData({ ...formData, xepLoai: e.target.value })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    {ratings.map((r) => (
                      <option key={r.ma} value={r.ma}>{r.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="emulations-field-7" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Hình thức khen thưởng</label>
                  <input id="emulations-field-7"
                    type="text"
                    value={formData.khenThuong}
                    disabled={user?.role !== "CDCS"}
                    onChange={(e) => setFormData({ ...formData, khenThuong: e.target.value })}
                    placeholder="e.g. Bằng khen Bộ Quốc phòng, Giấy khen"
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emulations-field-8" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Trạng thái thi đua</label>
                  <select id="emulations-field-8"
                    value={formData.trangThai}
                    disabled={user?.role !== "CDCS"}
                    onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    <option value={1}>Mới đăng ký</option>
                    <option value={2}>Đã đánh giá điểm</option>
                    <option value={3}>Đã trao khen thưởng</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">File minh chứng PDF</label>
                  <EvidenceUpload
                    fileId={formData.fileMinhChungUrl}
                    initialFileName={editingId ? emulations.find(e => e.id === editingId)?.evidenceFileName : undefined}
                    onChange={fileId => setFormData(current => ({ ...current, fileMinhChungUrl: fileId ?? "" }))}
                    moduleName="Emulations"
                    organizationId={formData.doanVienId ? memberUnit : formData.donViId}
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
