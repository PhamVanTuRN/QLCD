"use client";

import { useState, useEffect } from "react";
import { getActivitiesApi, createActivityApi, updateActivityApi, deleteActivityApi, getCatalogsApi, CatalogDto, getFlattenedUnits, getDownloadUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<any[]>([]);
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
      const list = await getActivitiesApi({ search: search || undefined });
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
    loadData();
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

  const handleOpenEdit = (item: any) => {
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

  const handleOpenDetail = (item: any) => {
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
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Lỗi xóa hoạt động");
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
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin");
    }
  };

  const getTypeName = (ma: string) => {
    return types.find((t) => t.ma === ma)?.ten || ma;
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
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

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Quản lý Hoạt động Công đoàn</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận và lập kế hoạch tổ chức các sự kiện, phong trào thi đua, văn nghệ, thể thao
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Thêm Hoạt động
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoạt động, địa điểm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <div className="text-xs text-slate-400">
          Tổng số hoạt động: <span className="text-emerald-400 font-bold">{activities.length}</span>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Tên hoạt động</th>
                <th className="py-3 px-4">Loại hình</th>
                <th className="py-3 px-4">Thời gian</th>
                <th className="py-3 px-4">Địa điểm</th>
                <th className="py-3 px-4 text-right">Kinh phí</th>
                <th className="py-3 px-4">Đơn vị tổ chức</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-2" />
                    Đang tải danh sách hoạt động...
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Chưa có hoạt động nào được đăng ký.
                  </td>
                </tr>
              ) : (
                activities.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-white">{item.tenHoatDong}</div>
                        {item.evidenceFileId && (
                          <a
                            href={getDownloadUrl(item.evidenceFileId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1 py-0.2 rounded transition-all"
                            title="Tải file minh chứng"
                          >
                            📄 PDF
                          </a>
                        )}
                      </div>
                      {item.moTa && <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.moTa}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {getTypeName(item.loaiHoatDong)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {new Date(item.tuNgay).toLocaleDateString("vi-VN")} - {new Date(item.denNgay).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 font-medium">{item.diaDiem}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {(item.kinhPhi || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-4 text-slate-400">{item.tenDonVi || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="bg-sky-600/10 hover:bg-sky-600/20 border border-sky-500/20 text-sky-400 px-2 py-1 rounded text-[10px] font-bold transition-all"
                        >
                          Chi tiết
                        </button>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px] font-bold transition-all"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-bold transition-all"
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

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative z-10 w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                {isDetailView ? "Chi tiết hoạt động" : editingId ? "Cập nhật hoạt động" : "Thêm hoạt động mới"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhập các chi tiết liên quan đến hoạt động Công đoàn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Đơn vị tổ chức *
                </label>
                <select
                  value={formData.donViId}
                  onChange={(e) => setFormData({ ...formData, donViId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Loại hình hoạt động</label>
                  <select
                    value={formData.loaiHoatDong}
                    onChange={(e) => setFormData({ ...formData, loaiHoatDong: e.target.value })}
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả chi tiết</label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  rows={2}
                  disabled={isDetailView}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50"
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
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
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
                          className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl transition-all"
                        >
                          📄 Tải PDF minh chứng
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-500 italic mt-1">Không có file minh chứng đính kèm</div>
                    )
                  ) : (
                    <EvidenceUpload
                      fileId={formData.fileMinhChungUrl}
                      initialFileName={editingId ? activities.find(a => a.id === editingId)?.evidenceFileName : undefined}
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
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  {isDetailView ? "Đóng" : "Hủy"}
                </button>
                {!isDetailView && (
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
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
