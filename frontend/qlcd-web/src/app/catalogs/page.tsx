"use client";

import { useState, useEffect } from "react";
import { getCatalogsApi, createCatalogApi, updateCatalogApi, deleteCatalogApi, CatalogDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui-components";
import { Plus, Search, Trash2, Edit3, FolderOpen } from "lucide-react";

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

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function CatalogsPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  // Chỉ cho phép CDCS (admin/cdcs) có quyền Dictionaries.View vào xem danh mục
  useEffect(() => {
    if (user && (!hasPermission("Dictionaries.View") || user.phamVi !== "CDCS")) {
      router.push("/");
    }
  }, [user, router, hasPermission]);

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

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

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
    const timer = setTimeout(() => {
      loadCatalogs();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

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
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      const msg = apiError.response?.data?.message || "Không thể xóa danh mục này do đang có liên kết dữ liệu.";
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
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      const msg = apiError.response?.data?.message || "Đã xảy ra lỗi khi lưu danh mục.";
      showAlert("error", msg);
    }
  };

  const filteredCatalogs = catalogs.filter(
    (c) =>
      c.ma.toLowerCase().includes(search.toLowerCase()) ||
      c.ten.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Alert Header */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 transition-all animate-in slide-in-from-top duration-300 ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-250 text-emerald-800"
              : "bg-red-50 border-red-250 text-red-800"
          }`}
        >
          <span className="text-base">{alert.type === "success" ? "✅" : "⚠️"}</span>
          <span className="text-xs font-bold">{alert.message}</span>
        </div>
      )}

      {/* Title */}
      <PageHeader 
        title="Quản lý Danh mục Dùng chung" 
        description="Cấu hình các danh mục và tùy chọn lựa chọn cho toàn hệ thống"
      >
        {hasPermission("Dictionaries.Manage") && (
          <button
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-98"
          >
            <Plus className="w-4 h-4 shrink-0" /> Thêm Danh mục
          </button>
        )}
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left list of types */}
        <div className="bg-white border border-slate-150 rounded-2xl p-4 shadow-xs space-y-1">
          <span className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Loại danh mục</span>
          <div className="max-h-[60vh] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin">
            {CATALOG_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => setSelectedType(type.value)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  selectedType === type.value
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-100/50 font-bold"
                    : "text-slate-600 hover:bg-slate-55 hover:text-slate-800"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right table list */}
        <div className="lg:col-span-3 bg-white border border-slate-150 rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <FolderOpen className="w-4.5 h-4.5 text-emerald-600 shrink-0" /> 
              <span>{CATALOG_TYPES.find((t) => t.value === selectedType)?.label}</span>
            </h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm mã hoặc tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all min-w-[200px]"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs table-modern">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Mã</th>
                  <th className="px-6 py-3.5">Tên hiển thị</th>
                  <th className="px-6 py-3.5 text-center w-24">Thứ tự</th>
                  <th className="px-6 py-3.5 text-center w-28">Trạng thái</th>
                  <th className="px-6 py-3.5">Ghi chú</th>
                  {hasPermission("Dictionaries.Manage") && <th className="px-6 py-3.5 text-center w-36">Thao tác</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={hasPermission("Dictionaries.Manage") ? 6 : 5} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <span className="inline-block w-6 h-6 border-2 border-slate-200 border-t-emerald-600 rounded-full animate-spin" />
                        <span className="text-xs font-medium text-slate-400">Đang tải danh mục...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredCatalogs.length === 0 ? (
                  <tr>
                    <td colSpan={hasPermission("Dictionaries.Manage") ? 6 : 5} className="py-12 text-center text-slate-400 italic">
                      📂 Không tìm thấy danh mục nào.
                    </td>
                  </tr>
                ) : (
                  filteredCatalogs.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">{item.ma}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{item.ten}</td>
                      <td className="px-6 py-4 text-center font-mono font-medium text-slate-500">{item.thuTu}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                            item.trangThai
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                              : "bg-slate-100 text-slate-650 border-slate-200/60"
                          }`}
                        >
                          {item.trangThai ? "Hoạt động" : "Khóa"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium truncate max-w-[200px]" title={item.ghiChu || ""}>
                        {item.ghiChu || "—"}
                      </td>
                      {hasPermission("Dictionaries.Manage") && (
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5 shrink-0" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-755 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" /> Xóa
                            </button>
                          </div>
                        </td>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-md bg-white border border-slate-150 rounded-2xl shadow-xl p-6 space-y-5 animate-in scale-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">{editingId ? "Sửa Danh mục" : "Thêm Danh mục mới"}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Trạng thái hoạt động
                  </label>
                  <div className="flex items-center mt-2.5">
                    <input
                      type="checkbox"
                      id="catalog-status"
                      checked={formData.trangThai}
                      onChange={(e) => setFormData({ ...formData, trangThai: e.target.checked })}
                      className="w-4.5 h-4.5 text-blue-600 border-slate-350 rounded focus:ring-blue-500/20 focus:ring-2 cursor-pointer"
                    />
                    <label htmlFor="catalog-status" className="ml-2 text-xs font-bold text-slate-600 cursor-pointer">
                      Kích hoạt Hoạt động
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú</label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  placeholder="Nhập ghi chú thêm..."
                  rows={3}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-all active:scale-98"
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
