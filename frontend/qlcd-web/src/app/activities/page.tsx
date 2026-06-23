"use client";

import { useState, useEffect } from "react";
import { getActivitiesApi, createActivityApi, updateActivityApi, deleteActivityApi, getCatalogsApi, CatalogDto, getFlattenedUnits, getDownloadUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";
import { PageHeader } from "@/components/ui-components";
import { Plus, Search, Trash2, Edit3, Eye } from "lucide-react";

interface ActivityItem {
  id: string;
  tenHoatDong: string;
  loaiHoatDong: string;
  tuNgay: string;
  denNgay: string;
  diaDiem: string;
  kinhPhi: number;
  moTa?: string;
  ketQua?: string;
  fileMinhChungUrl?: string;
  evidenceFileId?: string;
  evidenceFileName?: string;
  donViId: string;
  tenDonVi?: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [types, setTypes] = useState<CatalogDto[]>([]);
  const [units, setUnits] = useState<{ id: string; tenDonVi: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);
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

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getActivitiesApi({ search: search || undefined }) as ActivityItem[];
      setActivities(list);
      
      const cats = await getCatalogsApi({ loai: "LoaiHoatDong", activeOnly: true });
      setTypes(cats);

      const unitList = await getFlattenedUnits();
      setUnits(unitList);
      if (unitList.length === 1) {
        setFormData(prev => ({ ...prev, donViId: unitList[0].id }));
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách hoạt động");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setIsDetailView(false);
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
      donViId: units.length === 1 ? units[0].id : (user?.donViId || "")
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: ActivityItem) => {
    setEditingId(item.id);
    setIsDetailView(false);
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

  const handleOpenDetail = (item: ActivityItem) => {
    setEditingId(item.id);
    setIsDetailView(true);
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
    if (!confirm("Bạn có chắc chắn muốn xóa hoạt động này?")) return;
    try {
      await deleteActivityApi(id);
      showAlert("success", "Xóa hoạt động thành công");
      loadData();
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Lỗi xóa hoạt động");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenHoatDong || !formData.diaDiem) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    try {
      const payload = {
        ...formData,
        id: editingId || undefined,
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
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin");
    }
  };

  const getTypeName = (ma: string) => {
    return types.find((t) => t.ma === ma)?.ten || ma;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Alert */}
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

      {/* Header */}
      <PageHeader 
        title="Quản lý Hoạt động Công đoàn" 
        description="Ghi nhận và lập kế hoạch tổ chức các sự kiện, phong trào thi đua, văn nghệ, thể thao"
      >
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-98"
        >
          <Plus className="w-4 h-4 shrink-0" /> Thêm Hoạt động
        </button>
      </PageHeader>

      {/* Filter panel */}
      <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên hoạt động, địa điểm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 shrink-0" />
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Tổng số hoạt động: <span className="text-blue-600">{activities.length}</span>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs table-modern">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-3.5">Tên hoạt động</th>
                <th className="px-6 py-3.5">Loại hình</th>
                <th className="px-6 py-3.5">Thời gian</th>
                <th className="px-6 py-3.5">Địa điểm</th>
                <th className="px-6 py-3.5 text-right">Kinh phí</th>
                <th className="px-6 py-3.5">Đơn vị tổ chức</th>
                <th className="px-6 py-3.5 text-center w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-400">Đang tải danh sách hoạt động...</span>
                    </div>
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-lg">📂</span>
                      <span>Chưa có hoạt động nào được đăng ký.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-800">{item.tenHoatDong}</div>
                        {item.evidenceFileId && (
                          <a
                            href={getDownloadUrl(item.evidenceFileId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] text-blue-600 hover:text-blue-700 font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded transition-all"
                            title="Tải file minh chứng"
                          >
                            📄 PDF
                          </a>
                        )}
                      </div>
                      {item.moTa && <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[240px] font-medium">{item.moTa}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100/80 text-slate-600 border border-slate-200/50 text-[10px] font-semibold">
                        {getTypeName(item.loaiHoatDong)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-500">
                      {new Date(item.tuNgay).toLocaleDateString("vi-VN")} - {new Date(item.denNgay).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-700">{item.diaDiem}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      {(item.kinhPhi || 0).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{item.tenDonVi || "—"}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" /> Xem
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="bg-blue-55 hover:bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5 shrink-0" /> Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5 shrink-0" /> Xóa
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-white border border-slate-150 rounded-2xl shadow-xl p-6 space-y-5 animate-in scale-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isDetailView ? "Chi tiết hoạt động" : editingId ? "Cập nhật hoạt động" : "Thêm hoạt động mới"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Nhập các chi tiết liên quan đến hoạt động Công đoàn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Đơn vị tổ chức *
                </label>
                <select
                  value={formData.donViId}
                  onChange={(e) => setFormData({ ...formData, donViId: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
                  required
                  disabled={isDetailView || units.length === 1}
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.tenDonVi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Tên hoạt động *
                </label>
                <input
                  type="text"
                  value={formData.tenHoatDong}
                  onChange={(e) => setFormData({ ...formData, tenHoatDong: e.target.value })}
                  placeholder="e.g. Hội thao chào mừng 22/12"
                  required
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-455 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Loại hình hoạt động</label>
                  <select
                    value={formData.loaiHoatDong}
                    onChange={(e) => setFormData({ ...formData, loaiHoatDong: e.target.value })}
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kinh phí dự kiến (đ)</label>
                  <input
                    type="number"
                    value={formData.kinhPhi}
                    onChange={(e) => setFormData({ ...formData, kinhPhi: parseInt(e.target.value) || 0 })}
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Từ ngày *</label>
                  <input
                    type="date"
                    value={formData.tuNgay}
                    onChange={(e) => setFormData({ ...formData, tuNgay: e.target.value })}
                    required
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Đến ngày *</label>
                  <input
                    type="date"
                    value={formData.denNgay}
                    onChange={(e) => setFormData({ ...formData, denNgay: e.target.value })}
                    required
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Địa điểm tổ chức *</label>
                <input
                  type="text"
                  value={formData.diaDiem}
                  onChange={(e) => setFormData({ ...formData, diaDiem: e.target.value })}
                  placeholder="e.g. Sân vận động Bệnh viện"
                  required
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-455 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả chi tiết</label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  rows={2}
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none disabled:bg-slate-50 disabled:text-slate-450 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kết quả ghi nhận</label>
                  <input
                    type="text"
                    value={formData.ketQua}
                    onChange={(e) => setFormData({ ...formData, ketQua: e.target.value })}
                    placeholder="e.g. Thành công tốt đẹp, 20 giải thưởng"
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">File minh chứng PDF</label>
                  {isDetailView ? (
                    formData.fileMinhChungUrl ? (
                      <div className="mt-1">
                        <a
                          href={getDownloadUrl(formData.fileMinhChungUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 border border-blue-100 px-3 py-2 rounded-xl transition-all"
                        >
                          📄 Tải PDF minh chứng
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic mt-1 font-semibold">Không có file minh chứng đính kèm</div>
                    )
                  ) : (
                    <EvidenceUpload
                      fileId={formData.fileMinhChungUrl}
                      initialFileName={(editingId ? activities.find(a => a.id === editingId)?.evidenceFileName : undefined) || undefined}
                      onChange={(fileId) => setFormData({ ...formData, fileMinhChungUrl: fileId || "" })}
                      moduleName="Activities"
                      organizationId={formData.donViId || user?.donViId || ""}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  {isDetailView ? "Đóng" : "Hủy"}
                </button>
                {!isDetailView && (
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-all active:scale-98"
                  >
                    Lưu
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
