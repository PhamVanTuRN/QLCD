"use client";

import { useState, useEffect } from "react";
import { getCatalogsApi, createCatalogApi, updateCatalogApi, deleteCatalogApi, CatalogDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

const CATALOG_TYPES = [
  { value: "KhoiChuyenMon", label: "Khối chuyên môn" },
  { value: "LoaiToChuc", label: "Loại tổ chức công đoàn" },
  { value: "CapToChuc", label: "Cấp tổ chức" },
  { value: "NhiemKy", label: "Nhiệm kỳ" },
  { value: "ChucVuCongDoan", label: "Chức vụ công đoàn" },
  { value: "ChucVu", label: "Chức vụ" },
  { value: "DonViCongTac", label: "Đơn vị công tác" },
  { value: "ChuyenMon", label: "Chuyên môn" },
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
  const { user } = useAuth();
  const router = useRouter();

  // Chỉ cho phép CDCS (admin/cdcs) vào quản lý danh mục
  useEffect(() => {
    if (user && user.phamVi !== "CDCS") {
      router.push("/");
    }
  }, [user, router]);

  const [selectedType, setSelectedType] = useState(CATALOG_TYPES[0].value);
  const [catalogs, setCatalogs] = useState<CatalogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

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

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const data = await getCatalogsApi({ loai: selectedType });
      setCatalogs(data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, [selectedType]);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

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
    if (!confirm("Bạn có chắc chắn muốn xóa danh mục này?")) return;
    try {
      await deleteCatalogApi(id);
      showAlert("success", "Xóa danh mục thành công");
      loadCatalogs();
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Không thể xóa danh mục này do đang có liên kết dữ liệu.";
      showAlert("error", msg);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ma || !formData.ten) {
      showAlert("error", "Vui lòng nhập Mã và Tên danh mục");
      return;
    }

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
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Đã xảy ra lỗi khi lưu danh mục.";
      showAlert("error", msg);
    }
  };

  const filteredCatalogs = catalogs.filter(
    (c) =>
      c.ma.toLowerCase().includes(search.toLowerCase()) ||
      c.ten.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Alert Header */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 transition-all animate-bounce ${
            alert.type === "success"
              ? "bg-emerald-950 border-emerald-800 text-emerald-400"
              : "bg-red-950 border-red-900 text-red-400"
          }`}
        >
          <span>{alert.type === "success" ? "✅" : "⚠️"}</span>
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Quản lý Danh mục Dùng chung</h2>
          <p className="text-xs text-slate-400 mt-1">Cấu hình các danh mục và tùy chọn lựa chọn cho toàn hệ thống</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Thêm Danh mục
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left list of types */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Loại danh mục</span>
          <div className="max-h-[60vh] overflow-y-auto space-y-0.5 pr-1">
            {CATALOG_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedType === type.value
                    ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 font-semibold"
                    : "text-slate-400 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right table list */}
        <div className="lg:col-span-3 bg-slate-950/20 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>🗂️</span> {CATALOG_TYPES.find((t) => t.value === selectedType)?.label}
            </h3>
            <input
              type="text"
              placeholder="Tìm kiếm mã hoặc tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all min-w-[200px]"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Mã</th>
                  <th className="py-3 px-4">Tên hiển thị</th>
                  <th className="py-3 px-4 text-center">Thứ tự</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                  <th className="py-3 px-4">Ghi chú</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-2" />
                      Đang tải danh mục...
                    </td>
                  </tr>
                ) : filteredCatalogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      Không tìm thấy danh mục nào.
                    </td>
                  </tr>
                ) : (
                  filteredCatalogs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-500">{item.ma}</td>
                      <td className="py-3 px-4 font-medium text-white">{item.ten}</td>
                      <td className="py-3 px-4 text-center font-mono">{item.thuTu}</td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            item.trangThai
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          {item.trangThai ? "Hoạt động" : "Khóa"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-[200px]" title={item.ghiChu || ""}>
                        {item.ghiChu || "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-[10px] font-bold transition-all"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 hover:text-red-300 px-2 py-1 rounded text-[10px] font-bold transition-all"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-white">{editingId ? "Sửa Danh mục" : "Thêm Danh mục mới"}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Thuộc loại: {CATALOG_TYPES.find((t) => t.value === selectedType)?.label}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Mã danh mục <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ma}
                  onChange={(e) => setFormData({ ...formData, ma: e.target.value.toUpperCase() })}
                  disabled={!!editingId}
                  placeholder="e.g. ENG, IELTS_6.5"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.ten}
                  onChange={(e) => setFormData({ ...formData, ten: e.target.value })}
                  placeholder="e.g. Tiếng Anh, IELTS 6.5"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Thứ tự hiển thị
                  </label>
                  <input
                    type="number"
                    value={formData.thuTu}
                    onChange={(e) => setFormData({ ...formData, thuTu: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Trạng thái hoạt động
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={formData.trangThai}
                      onChange={(e) => setFormData({ ...formData, trangThai: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 peer-checked:after:bg-white" />
                    <span className="ml-2 text-xs font-semibold text-slate-400">Hoạt động</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú</label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  placeholder="Nhập ghi chú thêm..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
