"use client";

import TableText from "@/components/TableText";
import DataTable from "@/components/DataTable";

import useConfirmation from "@/components/useConfirmation";

import ManagementBlocksPanel from "@/components/ManagementBlocksPanel";
import FormDialog from "@/components/FormDialog";

import { useResource } from "@/lib/use-resource";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import { apiMessage, getCatalogsPage, createCatalogApi, updateCatalogApi, deleteCatalogApi, CatalogDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const CATALOG_TYPES = [
  { value: "ManagementBlocks", label: "Khối quản lý" },
  { value: "LoaiToChuc", label: "Loại tổ chức công đoàn" },
  { value: "CapToChuc", label: "Cấp tổ chức" },
  { value: "NhiemKy", label: "Nhiệm kỳ" },
  { value: "ChucVuCongDoan", label: "Chức vụ công đoàn" },
  { value: "TrangThaiDoanVien", label: "Trạng thái đoàn viên" },
  { value: "ChatLuongDoanVien", label: "Chất lượng đoàn viên" },
  { value: "GioiTinh", label: "Giới tính" },
  { value: "DanToc", label: "Dân tộc" },
  { value: "TonGiao", label: "Tôn giáo" },
  { value: "TrinhDoChuyenMon", label: "Trình độ chuyên môn" },
  { value: "HocHamHocVi", label: "Học hàm học vị" },
  { value: "NgoaiNgu", label: "Ngoại ngữ" },
  { value: "TrinhDoNgoaiNgu", label: "Trình độ ngoại ngữ" },
  { value: "LoaiHoatDong", label: "Loại hoạt động công đoàn" },
  { value: "LoaiThuChi", label: "Loại thu/chi tài chính" },
  { value: "LoaiDoanPhi", label: "Loại đoàn phí" },
  { value: "HinhThucPhucLoi", label: "Hình thức phúc lợi, cứu trợ" },
  { value: "LoaiSangKien", label: "Loại sáng kiến, đề tài" },
  { value: "CapThiDua", label: "Cấp thi đua" },
  { value: "HinhThucKhenThuong", label: "Hình thức khen thưởng" },
  { value: "HinhThucKyLuat", label: "Hình thức kỷ luật" },
  { value: "LoaiVanBan", label: "Loại văn bản" }
];

export default function CatalogsPage() {
  const { confirm, confirmationDialog } = useConfirmation();
  const { user } = useAuth();
  const canManage = user?.role === "ADMIN";

  const [selectedType, setSelectedType] = useState(CATALOG_TYPES[0].value);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { notice, dismiss, showAlert } = useNotice();
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    ma: "",
    ten: "",
    thuTu: 0,
    trangThai: true,
    ghiChu: ""
  });

  const readPage = useCallback((signal: AbortSignal) => selectedType === "ManagementBlocks" ? Promise.resolve({ data: [], hasMore: false }) : getCatalogsPage({ loai: selectedType, search: search.trim() || undefined, page }, signal), [selectedType, search, page]);
  const { data: list, loading, error: listError, reload: loadCatalogs } = useResource(readPage, search ? 200 : 0);
  const catalogs = list?.data ?? [];
  const hasMore = list?.hasMore ?? false;

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      ma: "",
      ten: "",
      thuTu: catalogs.length + 1,
      trangThai: true,
      ghiChu: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogDto) => {
    setEditingId(item.id);
    setFormData({
      ma: item.ma,
      ten: item.ten,
      thuTu: item.thuTu,
      trangThai: item.trangThai,
      ghiChu: item.ghiChu || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!await confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      await deleteCatalogApi(id);
      showAlert("success", "Xóa danh mục thành công");
      if (catalogs.length === 1 && page > 1) setPage(page - 1);
      else loadCatalogs();
    } catch (err) {
      const msg = apiMessage(err, "Không thể xóa danh mục này do đang có liên kết dữ liệu.");
      showAlert("error", msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.ma || !formData.ten) {
      showAlert("error", "Vui lòng nhập Mã và Tên danh mục");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        loai: selectedType,
        ...formData
      };

      if (editingId) {
        await updateCatalogApi(editingId, payload);
        showAlert("success", "Cập nhật danh mục thành công");
      } else {
        await createCatalogApi(payload);
        showAlert("success", "Thêm mới danh mục thành công");
      }
      setIsModalOpen(false);
      loadCatalogs();
    } catch (err) {
      const msg = apiMessage(err, "Đã xảy ra lỗi khi lưu danh mục.");
      showAlert("error", msg);
    } finally { setSubmitting(false); }
  };


  return (
    <div className="space-y-6">
      {confirmationDialog}
      {/* Alert Header */}
      <Notice value={notice} dismiss={dismiss} />

      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Quản lý Danh mục Dùng chung</h1>
          <p className="text-xs text-muted mt-1">Cấu hình các danh mục và tùy chọn lựa chọn cho toàn hệ thống</p>
        </div>
        {canManage && selectedType !== "ManagementBlocks" && (
        <button
          onClick={handleOpenCreate}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-strong/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Thêm Danh mục
        </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left list of types */}
        <div className="bg-surface border border-line rounded-2xl p-4 space-y-1">
          <span className="px-3 text-[10px] font-bold text-muted uppercase tracking-wider block mb-3">Loại danh mục</span>
          <div className="max-h-[60vh] overflow-y-auto space-y-0.5 pr-1">
            {CATALOG_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => { setSelectedType(type.value); setPage(1); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedType === type.value
                    ? "bg-brand-soft text-brand border border-brand-line font-semibold"
                    : "text-muted hover:bg-surface hover:text-ink"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right table list */}
        {selectedType === "ManagementBlocks" ? <ManagementBlocksPanel canManage={canManage} /> : (
        <div className="lg:col-span-3 bg-surface border border-line rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
              <span>🗂️</span> {CATALOG_TYPES.find((t) => t.value === selectedType)?.label}
            </h3>
            <input
              type="text"
          aria-label="Tìm kiếm" maxLength={100}
              placeholder="Tìm kiếm mã hoặc tên..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="bg-surface border border-line rounded-xl px-4 py-2 text-xs text-ink focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-all min-w-[200px]"
            />
          </div>

          <DataTable label="Bảng danh mục" footer={<ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />}>
          <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line text-muted font-semibold">
                  <th scope="col" className="py-3 px-4">Mã</th>
                  <th scope="col" className="py-3 px-4">Tên hiển thị</th>
                  <th scope="col" className="py-3 px-4 text-center">Thứ tự</th>
                  <th scope="col" className="py-3 px-4 text-center">Trạng thái</th>
                  <th scope="col" className="py-3 px-4">Ghi chú</th>
                  <th scope="col" className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {listError ? (
                <tr><td colSpan={6}><LoadState retry={loadCatalogs} /></td></tr>
              ) : loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      <span className="inline-block w-4 h-4 border-2 border-edge border-t-brand rounded-full animate-spin mr-2" />
                      Đang tải danh mục...
                    </td>
                  </tr>
                ) : catalogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">
                      Không tìm thấy danh mục nào.
                    </td>
                  </tr>
                ) : (
                  catalogs.map((item) => (
                    <tr key={item.id} className="hover:bg-soft text-copy">
                      <td className="py-3 px-4 font-mono font-bold text-brand">{item.ma}</td>
                      <td className="py-3 px-4 font-medium text-ink"><TableText text={item.ten} /></td>
                      <td className="py-3 px-4 text-center font-mono">{item.thuTu}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.trangThai
                              ? "bg-brand-soft text-brand border-brand-line"
                              : "bg-soft text-muted border-line"
                          }`}
                        >
                          {item.trangThai ? "Hoạt động" : "Khóa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted truncate max-w-[200px]" title={item.ghiChu || ""}>
                        {item.ghiChu || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {canManage ? (
<div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="bg-brand-soft hover:bg-soft-strong border border-brand-line text-brand hover:text-brand-hover px-2 py-1 rounded text-[10px] font-bold transition-all"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-danger-soft hover:bg-danger-line border border-danger-line text-danger hover:text-danger-strong px-2 py-1 rounded text-[10px] font-bold transition-all"
                          >
                            Xóa
                          </button>
                        </div>
                        ) : <span className="text-muted">Chỉ xem</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
        </DataTable>
        </div>)}
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <FormDialog label="Thông tin danh mục" onClose={() => { setIsModalOpen(false); dismiss(); }} busy={submitting}>
          {notice?.type === "error" && <Notice value={notice} dismiss={dismiss} />}
            <div>
              <h3 className="text-base font-bold text-ink">{editingId ? "Sửa Danh mục" : "Thêm Danh mục mới"}</h3>
              <p className="text-[10px] text-muted mt-0.5">
                Thuộc loại: {CATALOG_TYPES.find((t) => t.value === selectedType)?.label}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="catalogs-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Mã danh mục <span className="text-danger">*</span>
                </label>
                <input id="catalogs-field-1"
                  type="text"
                  value={formData.ma}
                  onChange={(e) => setFormData({ ...formData, ma: e.target.value.toUpperCase() })}
                  disabled={!!editingId}
                  placeholder="e.g. ENG, IELTS_6.5"
                  required
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="catalogs-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Tên hiển thị <span className="text-danger">*</span>
                </label>
                <input id="catalogs-field-2"
                  type="text"
                  value={formData.ten}
                  onChange={(e) => setFormData({ ...formData, ten: e.target.value })}
                  placeholder="e.g. Tiếng Anh, IELTS 6.5"
                  required
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="catalogs-field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input id="catalogs-field-3"
                    type="number"
                    value={formData.thuTu}
                    onChange={(e) => setFormData({ ...formData, thuTu: parseInt(e.target.value) || 0 })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1.5">
                    Trạng thái hoạt động
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={formData.trangThai}
                      onChange={(e) => setFormData({ ...formData, trangThai: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-soft peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-edge after:border-line after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand peer-checked:after:bg-white" />
                    <span className="ml-2 text-xs font-semibold text-muted">Hoạt động</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="catalogs-field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Ghi chú</label>
                <textarea id="catalogs-field-4"
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  placeholder="Nhập ghi chú thêm..."
                  rows={3}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-brand"
                />
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
