"use client";

import { useState, useEffect } from "react";
import { getInitiativesApi, createInitiativeApi, updateInitiativeApi, deleteInitiativeApi, getCatalogsApi, CatalogDto, getMembers } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function InitiativesPage() {
  const { user } = useAuth();
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [types, setTypes] = useState<CatalogDto[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    doanVienId: "",
    tenDeTai: "",
    linhVuc: "",
    capDeTai: "",
    hieuQuaKinhTe: "",
    ngayNghiemThu: "",
    namThucHien: new Date().getFullYear(),
    ketQuaNghiemThu: "",
    trangThai: 1
  });

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getInitiativesApi({ search: search || undefined });
      setInitiatives(list);
      
      const cats = await getCatalogsApi({ loai: "LoaiSangKien", activeOnly: true });
      setTypes(cats);

      const memList = await getMembers({ pageSize: 100 });
      if (memList && memList.items) {
        setMembers(memList.items);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách sáng kiến");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      doanVienId: members[0]?.id || "",
      tenDeTai: "",
      linhVuc: "Y khoa",
      capDeTai: types[0]?.ma || "CAP_CO_SO",
      hieuQuaKinhTe: "",
      ngayNghiemThu: new Date().toISOString().split("T")[0],
      namThucHien: new Date().getFullYear(),
      ketQuaNghiemThu: "",
      trangThai: 1
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      doanVienId: item.doanVienId,
      tenDeTai: item.tenDeTai,
      linhVuc: item.linhVuc || "",
      capDeTai: item.capDeTai,
      hieuQuaKinhTe: item.hieuQuaKinhTe || "",
      ngayNghiemThu: item.ngayNghiemThu ? item.ngayNghiemThu.split("T")[0] : "",
      namThucHien: item.namThucHien || new Date().getFullYear(),
      ketQuaNghiemThu: item.ketQuaNghiemThu || "",
      trangThai: item.trangThai || 1
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sáng kiến này?")) return;
    try {
      await deleteInitiativeApi(id);
      showAlert("success", "Xóa sáng kiến thành công");
      loadData();
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Lỗi xóa sáng kiến");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doanVienId || !formData.tenDeTai || !formData.linhVuc) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    try {
      const payload = {
        ...formData,
        donViId: user?.donViId || "00000000-0000-0000-0000-000000000000",
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
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin");
    }
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
      case 1: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case 2: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case 3: return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Phong trào Sáng kiến & Đề tài Khoa học</h2>
          <p className="text-xs text-slate-400 mt-1">
            Quản lý danh sách sáng kiến cải tiến kỹ thuật và đề tài nghiên cứu khoa học của cán bộ, đoàn viên
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Đăng ký Sáng kiến
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đề tài & Sáng kiến</span>
          <div className="text-2xl font-extrabold text-white mt-2">{initiatives.length} đăng ký</div>
          <p className="text-[10px] text-slate-400 mt-1">Ghi nhận từ các tổ công đoàn trực thuộc</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đã nghiệm thu thông qua</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {initiatives.filter((i) => i.trangThai === 2).length} sáng kiến
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Có tính thực tiễn và hiệu quả kinh tế cao</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên đề tài, lĩnh vực, tác giả..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <div className="text-xs text-slate-400">
          Tổng số: <span className="text-emerald-400 font-bold">{initiatives.length}</span>
        </div>
      </div>

      {/* Initiatives table */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Tên đề tài / Sáng kiến</th>
                <th className="py-3 px-4">Cấp đề tài</th>
                <th className="py-3 px-4">Tác giả (Đoàn viên)</th>
                <th className="py-3 px-4">Lĩnh vực</th>
                <th className="py-3 px-4 text-center">Năm thực hiện</th>
                <th className="py-3 px-4 text-center">Nghiệm thu</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-2" />
                    Đang tải danh sách sáng kiến...
                  </td>
                </tr>
              ) : initiatives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Chưa có sáng kiến nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                initiatives.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.tenDeTai}</div>
                      {item.hieuQuaKinhTe && <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{item.hieuQuaKinhTe}</div>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {getTypeName(item.capDeTai)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-200">{item.doanVienTen || "—"}</div>
                      <div className="text-[10px] text-slate-500">Mã NV: {item.maNhanVien || "—"}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{item.linhVuc}</td>
                    <td className="py-3 px-4 text-center font-mono">{item.namThucHien}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="font-semibold text-slate-300">{item.ketQuaNghiemThu || "—"}</div>
                      {item.ngayNghiemThu && <div className="text-[9px] text-slate-500">{new Date(item.ngayNghiemThu).toLocaleDateString("vi-VN")}</div>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.trangThai)}`}>
                        {getStatusName(item.trangThai)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
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
                {editingId ? "Sửa thông tin đề tài" : "Đăng ký đề tài / sáng kiến mới"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhập các chi tiết liên quan đến đề tài sáng kiến khoa học</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tác giả (Đoàn viên) *</label>
                <select
                  value={formData.doanVienId}
                  onChange={(e) => setFormData({ ...formData, doanVienId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Chọn tác giả đăng ký...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.hoTen} ({m.maNhanVien})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên đề tài / Sáng kiến *</label>
                <input
                  type="text"
                  value={formData.tenDeTai}
                  onChange={(e) => setFormData({ ...formData, tenDeTai: e.target.value })}
                  placeholder="e.g. Cải tiến quy trình tiếp đón người bệnh bằng thẻ quét mã QR"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lĩnh vực nghiên cứu *</label>
                  <input
                    type="text"
                    value={formData.linhVuc}
                    onChange={(e) => setFormData({ ...formData, linhVuc: e.target.value })}
                    placeholder="e.g. Quản lý Y tế"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cấp đề tài *</label>
                  <select
                    value={formData.capDeTai}
                    onChange={(e) => setFormData({ ...formData, capDeTai: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Năm thực hiện *</label>
                  <input
                    type="number"
                    value={formData.namThucHien}
                    onChange={(e) => setFormData({ ...formData, namThucHien: parseInt(e.target.value) || new Date().getFullYear() })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày nghiệm thu</label>
                  <input
                    type="date"
                    value={formData.ngayNghiemThu}
                    onChange={(e) => setFormData({ ...formData, ngayNghiemThu: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kết quả nghiệm thu</label>
                  <input
                    type="text"
                    value={formData.ketQuaNghiemThu}
                    onChange={(e) => setFormData({ ...formData, ketQuaNghiemThu: e.target.value })}
                    placeholder="e.g. Đạt, Xuất sắc"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hiệu quả kinh tế / thực tiễn</label>
                <textarea
                  value={formData.hieuQuaKinhTe}
                  onChange={(e) => setFormData({ ...formData, hieuQuaKinhTe: e.target.value })}
                  placeholder="Mô tả hiệu quả xã hội hoặc số tiền tiết kiệm được cho bệnh viện..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái đề tài</label>
                <select
                  value={formData.trangThai}
                  onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>Mới đăng ký</option>
                  <option value={2}>Nghiệm thu Đạt</option>
                  <option value={3}>Từ chối/Hủy đề tài</option>
                </select>
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
