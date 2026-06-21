"use client";

import { useState, useEffect } from "react";
import { getWelfareApi, createWelfareApi, updateWelfareApi, getCatalogsApi, CatalogDto, getMembers } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function WelfarePage() {
  const { user } = useAuth();
  const [welfares, setWelfares] = useState<any[]>([]);
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
    loaiPhucLoi: "",
    kinhPhiHoTro: 0,
    ngayHoTro: "",
    lyDo: "",
    trangThai: 1,
    fileMinhChungUrl: ""
  });

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getWelfareApi({ search: search || undefined });
      setWelfares(list);
      
      const cats = await getCatalogsApi({ loai: "HinhThucPhucLoi", activeOnly: true });
      setTypes(cats);

      const memList = await getMembers({ pageSize: 100 });
      if (memList && memList.items) {
        setMembers(memList.items);
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách phúc lợi");
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
      loaiPhucLoi: types[0]?.ma || "OM_DAU",
      kinhPhiHoTro: 500000,
      ngayHoTro: new Date().toISOString().split("T")[0],
      lyDo: "",
      trangThai: 1,
      fileMinhChungUrl: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      doanVienId: item.doanVienId,
      loaiPhucLoi: item.loaiPhucLoi,
      kinhPhiHoTro: item.kinhPhiHoTro || 0,
      ngayHoTro: item.ngayHoTro ? item.ngayHoTro.split("T")[0] : "",
      lyDo: item.lyDo || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || ""
    });
    setIsModalOpen(true);
  };

  const handleApprove = async (id: string, newStatus: number) => {
    try {
      const item = welfares.find((w) => w.id === id);
      if (!item) return;
      const payload = {
        doanVienId: item.doanVienId,
        loaiPhucLoi: item.loaiPhucLoi,
        kinhPhiHoTro: item.kinhPhiHoTro,
        ngayHoTro: item.ngayHoTro,
        lyDo: item.lyDo,
        trangThai: newStatus,
        fileMinhChungUrl: item.fileMinhChungUrl
      };
      await updateWelfareApi(id, payload);
      showAlert("success", newStatus === 2 ? "Duyệt cấp phúc lợi thành công" : "Từ chối cấp phúc lợi thành công");
      loadData();
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Lỗi thay đổi trạng thái phúc lợi");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doanVienId || !formData.lyDo || !formData.kinhPhiHoTro) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    try {
      const payload = {
        ...formData,
        donViId: user?.donViId || "00000000-0000-0000-0000-000000000000",
        trangThai: Number(formData.trangThai)
      };

      if (editingId) {
        await updateWelfareApi(editingId, payload);
        showAlert("success", "Cập nhật thông tin phúc lợi thành công");
      } else {
        await createWelfareApi(payload);
        showAlert("success", "Đăng ký cấp phúc lợi thành công");
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
      case 1: return "Chờ duyệt";
      case 2: return "Đã duyệt";
      case 3: return "Từ chối";
      default: return "Chờ duyệt";
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case 2: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case 3: return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  // Tính tổng số tiền đã cấp
  const totalPaid = welfares
    .filter((w) => w.trangThai === 2)
    .reduce((sum, w) => sum + (w.kinhPhiHoTro || 0), 0);

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
          <h2 className="text-2xl font-bold text-white tracking-tight">Quản lý Phúc lợi & Cứu trợ khó khăn</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ghi nhận hỗ trợ ốm đau, hiếu hỷ, thai sản và cứu trợ khẩn cấp cho đoàn viên
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Yêu cầu Trợ cấp
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Kinh phí Đã cấp</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">{totalPaid.toLocaleString()} đ</div>
          <p className="text-[10px] text-slate-400 mt-1">Chỉ tính hồ sơ có trạng thái Đã duyệt</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số lượt nhận cứu trợ</span>
          <div className="text-2xl font-extrabold text-white mt-2">
            {welfares.filter((w) => w.trangThai === 2).length} lượt
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Đoàn viên được thăm hỏi và chăm lo kịp thời</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm theo họ tên đoàn viên, lý do..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <div className="text-xs text-slate-400">
          Tổng số hồ sơ: <span className="text-emerald-400 font-bold">{welfares.length}</span>
        </div>
      </div>

      {/* Welfare table */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Đoàn viên hưởng</th>
                <th className="py-3 px-4">Hình thức phúc lợi</th>
                <th className="py-3 px-4">Ngày hỗ trợ</th>
                <th className="py-3 px-4">Lý do hỗ trợ</th>
                <th className="py-3 px-4 text-right">Kinh phí hỗ trợ</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-2" />
                    Đang tải danh sách phúc lợi...
                  </td>
                </tr>
              ) : welfares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Chưa có hồ sơ trợ cấp/phúc lợi nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                welfares.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{item.doanVienTen || "Chưa có liên kết"}</div>
                      <div className="text-[10px] text-slate-500">Mã NV: {item.maNhanVien || "—"}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {getTypeName(item.loaiPhucLoi)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {new Date(item.ngayHoTro).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">{item.lyDo}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {(item.kinhPhiHoTro || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.trangThai)}`}>
                        {getStatusName(item.trangThai)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.trangThai === 1 ? (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, 2)}
                              className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleApprove(item.id, 3)}
                              className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 px-2 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              Từ chối
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 px-2.5 py-1 rounded text-[10px] font-bold transition-all"
                          >
                            Chi tiết / Sửa
                          </button>
                        )}
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
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                {editingId ? "Sửa thông tin phúc lợi" : "Lập đề xuất cấp phúc lợi/trợ cấp"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhập các chi tiết liên quan đến đợt trợ cấp khó khăn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Đoàn viên nhận hỗ trợ *</label>
                <select
                  value={formData.doanVienId}
                  onChange={(e) => setFormData({ ...formData, doanVienId: e.target.value })}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Chọn đoàn viên nhận...</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.hoTen} ({m.maNhanVien})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hình thức phúc lợi *</label>
                  <select
                    value={formData.loaiPhucLoi}
                    onChange={(e) => setFormData({ ...formData, loaiPhucLoi: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số tiền hỗ trợ (đ) *</label>
                  <input
                    type="number"
                    value={formData.kinhPhiHoTro}
                    onChange={(e) => setFormData({ ...formData, kinhPhiHoTro: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày trao tặng/cấp *</label>
                  <input
                    type="date"
                    value={formData.ngayHoTro}
                    onChange={(e) => setFormData({ ...formData, ngayHoTro: e.target.value })}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái duyệt</label>
                  <select
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value={1}>Chờ duyệt</option>
                    <option value={2}>Đã duyệt cấp</option>
                    <option value={3}>Từ chối cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Lý do chi tiết *</label>
                <textarea
                  value={formData.lyDo}
                  onChange={(e) => setFormData({ ...formData, lyDo: e.target.value })}
                  placeholder="e.g. Bản thân đoàn viên ốm đau nằm viện dài ngày"
                  required
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Link file đính kèm/minh chứng</label>
                <input
                  type="text"
                  value={formData.fileMinhChungUrl}
                  onChange={(e) => setFormData({ ...formData, fileMinhChungUrl: e.target.value })}
                  placeholder="e.g. https://drive.google.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
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
