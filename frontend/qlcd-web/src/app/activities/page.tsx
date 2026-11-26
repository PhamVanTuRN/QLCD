"use client";

import TableText from "@/components/TableText";
import DataTable from "@/components/DataTable";

import useConfirmation from "@/components/useConfirmation";

import FormDialog from "@/components/FormDialog";

import { useResource } from "@/lib/use-resource";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import type { ActivityDto } from "@/lib/business-types";
import { apiMessage, getActivitiesApi, createActivityApi, updateActivityApi, deleteActivityApi, getCatalogsApi, getFlattenedUnits } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function ActivitiesPage() {
  const { confirm, confirmationDialog } = useConfirmation();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { notice, dismiss, showAlert } = useNotice();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenHoatDong: "",
    loaiHoatDong: "",
    tuNgay: "",
    denNgay: "",
    diaDiem: "",
    kinhPhi: 0,
    moTa: "",
    ketQua: "",
    fileMinhChungUrl: "",
    donViId: ""
  });

  const readPage = useCallback((signal: AbortSignal) => getActivitiesApi({ search: search.trim() || undefined, page }, signal), [search, page]);
  const { data: list, loading, error: listError, reload: loadData } = useResource(readPage, search ? 200 : 0);
  const activities = list?.data ?? [];
  const hasMore = list?.hasMore ?? false;

  const readChoices = useCallback(async (signal: AbortSignal) => {
    const [catalog, units] = await Promise.all([
      getCatalogsApi({ loai: "LoaiHoatDong", activeOnly: true }, signal),
      getFlattenedUnits(signal),
    ]);
    return { catalog, units };
  }, []);
  const { data: choices, error: choicesError, reload: reloadChoices } = useResource(readChoices);
  const types = choices?.catalog ?? [];
  const units = choices?.units ?? [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      tenHoatDong: "",
      loaiHoatDong: types[0]?.ma || "PHONG_TRAO",
      tuNgay: new Date().toISOString().split("T")[0],
      denNgay: new Date().toISOString().split("T")[0],
      diaDiem: "",
      kinhPhi: 0,
      moTa: "",
      ketQua: "",
      fileMinhChungUrl: "",
      donViId: user?.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ActivityDto) => {
    setEditingId(item.id);
    setFormData({
      tenHoatDong: item.tenHoatDong,
      loaiHoatDong: item.loaiHoatDong,
      tuNgay: item.tuNgay ? item.tuNgay.split("T")[0] : "",
      denNgay: item.denNgay ? item.denNgay.split("T")[0] : "",
      diaDiem: item.diaDiem,
      kinhPhi: item.kinhPhi || 0,
      moTa: item.moTa || "",
      ketQua: item.ketQua || "",
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!await confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) return;
    try {
      await deleteActivityApi(id);
      showAlert("success", "Xóa hoạt động thành công");
      if (activities.length === 1 && page > 1) setPage(page - 1);
      else loadData();
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi xóa hoạt động"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.tenHoatDong || !formData.diaDiem) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        donViId: formData.donViId || user?.donViId || "00000000-0000-0000-0000-000000000000"
      };

      if (editingId) {
        await updateActivityApi(editingId, payload);
        showAlert("success", "Cập nhật hoạt động thành công");
      } else {
        await createActivityApi(payload);
        showAlert("success", "Thêm mới hoạt động thành công");
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

  return (
    <div className="space-y-6">
      {confirmationDialog}
      {/* Alert */}
      <Notice value={notice} dismiss={dismiss} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Quản lý Hoạt động Công đoàn</h1>
          <p className="text-xs text-muted mt-1">
            Ghi nhận và lập kế hoạch tổ chức các sự kiện, phong trào thi đua, văn nghệ, thể thao
          </p>
        </div>
        {user?.role !== "ADMIN" && (
        <button
          disabled={!choices} onClick={handleOpenCreate}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-strong/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Thêm Hoạt động
        </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-line p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          aria-label="Tìm kiếm" maxLength={100}
          placeholder="Tìm kiếm theo tên hoạt động, địa điểm..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:max-w-md bg-surface border border-line rounded-xl px-4 py-2 text-xs text-ink focus:outline-none focus:border-brand transition-all"
        />
        <div className="text-xs text-muted">
          Hoạt động trên trang: <span className="text-brand font-bold">{activities.length}</span>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <DataTable label="Bảng hoạt động" footer={<ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-muted font-semibold">
                <th scope="col" className="py-3 px-4">Tên hoạt động</th>
                <th scope="col" className="py-3 px-4">Loại hình</th>
                <th scope="col" className="py-3 px-4">Thời gian</th>
                <th scope="col" className="py-3 px-4">Địa điểm</th>
                <th scope="col" className="py-3 px-4 text-right">Kinh phí</th>
                <th scope="col" className="py-3 px-4">Đơn vị tổ chức</th>
                <th scope="col" className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listError ? (
                <tr><td colSpan={7}><LoadState retry={loadData} /></td></tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    <span className="inline-block w-4 h-4 border-2 border-edge border-t-brand rounded-full animate-spin mr-2" />
                    Đang tải danh sách hoạt động...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    Chưa có hoạt động nào được đăng ký.
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item.id} className="hover:bg-soft text-copy">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-ink"><TableText text={item.tenHoatDong} /></div>
                        {item.evidenceFileId && (
                          <a
                            href={`/api/v1/evidence-files/download/${item.evidenceFileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] text-brand hover:text-brand-hover font-bold bg-brand-soft border border-brand-line px-1 py-0.2 rounded transition-all"
                            aria-label="Tải file minh chứng"
                          >
                            📄 PDF
                          </a>
                        )}
                      </div>
                      {item.moTa && <div className="text-[10px] text-muted max-w-[200px]" title={item.moTa || undefined}><TableText text={item.moTa} /></div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-soft text-copy border border-line text-[10px]">
                        {getTypeName(item.loaiHoatDong)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {new Date(item.tuNgay).toLocaleDateString("vi-VN")} - {new Date(item.denNgay).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 font-medium"><TableText text={item.diaDiem} /></td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-brand">
                      {(item.kinhPhi || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-4 text-muted"><TableText text={item.tenDonVi} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {(user?.role !== "ADMIN") && (
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
        <FormDialog label="Thông tin hoạt động" onClose={() => { setIsModalOpen(false); dismiss(); }} busy={submitting}>
          {notice?.type === "error" && <Notice value={notice} dismiss={dismiss} />}
            <div>
              <h3 className="text-sm font-bold text-ink">{editingId ? "Cập nhật hoạt động" : "Thêm hoạt động mới"}</h3>
              <p className="text-[10px] text-muted mt-0.5">Nhập các chi tiết liên quan đến hoạt động Công đoàn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="activities-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Đơn vị tổ chức *
                </label>
                <select id="activities-field-1"
                  value={formData.donViId}
                  onChange={(e) => setFormData({ ...formData, donViId: e.target.value })}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  required
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.tenDonVi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="activities-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Tên hoạt động *
                </label>
                <input id="activities-field-2"
                  type="text"
                  value={formData.tenHoatDong}
                  onChange={(e) => setFormData({ ...formData, tenHoatDong: e.target.value })}
                  placeholder="e.g. Hội thao chào mừng 22/12"
                  required
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activities-field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Loại hình hoạt động</label>
                  <select id="activities-field-3"
                    value={formData.loaiHoatDong}
                    onChange={(e) => setFormData({ ...formData, loaiHoatDong: e.target.value })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="activities-field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Kinh phí dự kiến (đ)</label>
                  <input id="activities-field-4"
                    type="number"
                    value={formData.kinhPhi}
                    onChange={(e) => setFormData({ ...formData, kinhPhi: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activities-field-5" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Từ ngày *</label>
                  <input id="activities-field-5"
                    type="date"
                    value={formData.tuNgay}
                    onChange={(e) => setFormData({ ...formData, tuNgay: e.target.value })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="activities-field-6" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Đến ngày *</label>
                  <input id="activities-field-6"
                    type="date"
                    value={formData.denNgay}
                    onChange={(e) => setFormData({ ...formData, denNgay: e.target.value })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="activities-field-7" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Địa điểm tổ chức *</label>
                <input id="activities-field-7"
                  type="text"
                  value={formData.diaDiem}
                  onChange={(e) => setFormData({ ...formData, diaDiem: e.target.value })}
                  placeholder="e.g. Sân vận động Bệnh viện"
                  required
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label htmlFor="activities-field-8" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Mô tả chi tiết</label>
                <textarea id="activities-field-8"
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  rows={2}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="activities-field-9" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Kết quả ghi nhận</label>
                  <input id="activities-field-9"
                    type="text"
                    value={formData.ketQua}
                    onChange={(e) => setFormData({ ...formData, ketQua: e.target.value })}
                    placeholder="e.g. Thành công tốt đẹp, 20 giải thưởng"
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">File minh chứng PDF</label>
                  <EvidenceUpload
                    fileId={formData.fileMinhChungUrl}
                    initialFileName={editingId ? activities.find(a => a.id === editingId)?.evidenceFileName : undefined}
                    onChange={fileId => setFormData(current => ({ ...current, fileMinhChungUrl: fileId ?? "" }))}
                    moduleName="Activities"
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
