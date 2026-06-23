"use client";

import { useState, useEffect } from "react";
import { getWelfareApi, createWelfareApi, updateWelfareApi, deleteWelfareApi, getCatalogsApi, CatalogDto, getMembers, getFlattenedUnits, getDownloadUrl, UnionMemberDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";
import { PageHeader, StatCard } from "@/components/ui-components";
import { Plus, Search, Heart, Users, Trash2, Edit3, Eye, Check, X } from "lucide-react";

interface WelfareItem {
  id: string;
  doanVienId: string;
  hoTenDoanVien?: string | null;
  maNhanVien?: string | null;
  loaiPhucLoi: string;
  kinhPhiHoTro: number;
  ngayHoTro: string;
  lyDo: string;
  trangThai: number;
  fileMinhChungUrl?: string | null;
  evidenceFileId?: string | null;
  evidenceFileName?: string | null;
  donViId: string;
  tenDonVi?: string | null;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function WelfarePage() {
  const { user } = useAuth();
  const [welfares, setWelfares] = useState<WelfareItem[]>([]);
  const [types, setTypes] = useState<CatalogDto[]>([]);
  const [members, setMembers] = useState<UnionMemberDto[]>([]);
  const [units, setUnits] = useState<{ id: string; tenDonVi: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    doanVienId: "",
    loaiPhucLoi: "",
    kinhPhiHoTro: 0,
    ngayHoTro: "",
    lyDo: "",
    trangThai: 1,
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
      const list = await getWelfareApi({ search: search || undefined }) as WelfareItem[];
      setWelfares(list);
      
      const cats = await getCatalogsApi({ loai: "HinhThucPhucLoi", activeOnly: true });
      setTypes(cats);

      const memList = await getMembers({ pageSize: 100 });
      if (memList && memList.items) {
        setMembers(memList.items);
      }

      const unitList = await getFlattenedUnits();
      setUnits(unitList);
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách phúc lợi");
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
      doanVienId: members[0]?.id || "",
      loaiPhucLoi: types[0]?.ma || "OM_DAU",
      kinhPhiHoTro: 500000,
      ngayHoTro: new Date().toISOString().split("T")[0],
      lyDo: "",
      trangThai: 1,
      fileMinhChungUrl: "",
      donViId: units.length === 1 ? units[0].id : (user?.donViId || "")
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WelfareItem) => {
    setEditingId(item.id);
    setIsDetailView(false);
    setFormData({
      doanVienId: item.doanVienId,
      loaiPhucLoi: item.loaiPhucLoi,
      kinhPhiHoTro: item.kinhPhiHoTro || 0,
      ngayHoTro: item.ngayHoTro ? item.ngayHoTro.split("T")[0] : "",
      lyDo: item.lyDo || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (item: WelfareItem) => {
    setEditingId(item.id);
    setIsDetailView(true);
    setFormData({
      doanVienId: item.doanVienId,
      loaiPhucLoi: item.loaiPhucLoi,
      kinhPhiHoTro: item.kinhPhiHoTro || 0,
      ngayHoTro: item.ngayHoTro ? item.ngayHoTro.split("T")[0] : "",
      lyDo: item.lyDo || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa hồ sơ phúc lợi này?")) return;
    try {
      await deleteWelfareApi(id);
      showAlert("success", "Xóa hồ sơ phúc lợi thành công");
      loadData();
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Lỗi xóa hồ sơ phúc lợi");
    }
  };

  const handleApprove = async (id: string, newStatus: number) => {
    try {
      const item = welfares.find((w) => w.id === id);
      if (!item) return;
      const payload = {
        id: item.id,
        doanVienId: item.doanVienId,
        loaiPhucLoi: item.loaiPhucLoi,
        kinhPhiHoTro: item.kinhPhiHoTro,
        ngayHoTro: item.ngayHoTro,
        lyDo: item.lyDo,
        trangThai: newStatus,
        fileMinhChungUrl: item.fileMinhChungUrl,
        donViId: item.donViId
      };
      await updateWelfareApi(id, payload);
      showAlert("success", newStatus === 2 ? "Duyệt cấp phúc lợi thành công" : "Từ chối cấp phúc lợi thành công");
      loadData();
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Lỗi thay đổi trạng thái phúc lợi");
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
        id: editingId || undefined,
        donViId: formData.donViId || user?.donViId || "00000000-0000-0000-0000-000000000000",
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
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin");
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

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case 1: return "bg-amber-50 text-amber-700 border-amber-200/60";
      case 2: return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case 3: return "bg-red-50 text-red-700 border-red-200/60";
      default: return "bg-slate-55 text-slate-700 border-slate-200/60";
    }
  };

  // Tính tổng số tiền đã cấp
  const totalPaid = welfares
    .filter((w) => w.trangThai === 2)
    .reduce((sum, w) => sum + (w.kinhPhiHoTro || 0), 0);

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
        title="Quản lý Phúc lợi & Cứu trợ khó khăn" 
        description="Ghi nhận hỗ trợ ốm đau, hiếu hỷ, thai sản và cứu trợ khẩn cấp cho đoàn viên"
      >
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-98"
        >
          <Plus className="w-4 h-4 shrink-0" /> Yêu cầu Trợ cấp
        </button>
      </PageHeader>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Tổng Kinh phí Đã cấp"
          value={`${totalPaid.toLocaleString()} đ`}
          subtitle="Chỉ tính hồ sơ có trạng thái Đã duyệt"
          icon={Heart}
          color="emerald"
        />
        <StatCard
          title="Số lượt nhận cứu trợ"
          value={`${welfares.filter((w) => w.trangThai === 2).length} lượt`}
          subtitle="Đoàn viên được thăm hỏi và chăm lo kịp thời"
          icon={Users}
          color="blue"
        />
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo họ tên đoàn viên, lý do..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 shrink-0" />
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Tổng số hồ sơ: <span className="text-blue-600">{welfares.length}</span>
        </div>
      </div>

      {/* Welfare table */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs table-modern">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-3.5">Đoàn viên hưởng</th>
                <th className="px-6 py-3.5">Hình thức phúc lợi</th>
                <th className="px-6 py-3.5">Ngày hỗ trợ</th>
                <th className="px-6 py-3.5">Lý do hỗ trợ</th>
                <th className="px-6 py-3.5 text-right">Kinh phí hỗ trợ</th>
                <th className="px-6 py-3.5 text-center">Trạng thái</th>
                <th className="px-6 py-3.5 text-center w-52">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-400">Đang tải danh sách phúc lợi...</span>
                    </div>
                  </td>
                </tr>
              ) : welfares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-lg">📂</span>
                      <span>Chưa có hồ sơ trợ cấp/phúc lợi nào được ghi nhận.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                welfares.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-800">{item.hoTenDoanVien || "Chưa có liên kết"}</div>
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
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Mã NV: {item.maNhanVien || "—"} {item.tenDonVi && `• ${item.tenDonVi}`}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100/80 text-slate-600 border border-slate-200/50 text-[10px] font-semibold">
                        {getTypeName(item.loaiPhucLoi)}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-500">
                      {new Date(item.ngayHoTro).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-600 max-w-[200px] truncate">{item.lyDo}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-800">
                      {(item.kinhPhiHoTro || 0).toLocaleString()} đ
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(item.trangThai)}`}>
                        {getStatusName(item.trangThai)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenDetail(item)}
                          className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" /> Xem
                        </button>
                        {item.trangThai === 1 ? (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, 2)}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5 shrink-0" /> Duyệt
                            </button>
                            <button
                              onClick={() => handleApprove(item.id, 3)}
                              className="bg-red-50 hover:bg-red-100 text-red-705 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5 shrink-0" /> Từ chối
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="bg-blue-55 hover:bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                          >
                            <Edit3 className="w-3.5 h-3.5 shrink-0" /> Sửa
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-750 border border-red-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
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
          <div className="relative z-10 w-full max-w-md bg-white border border-slate-150 rounded-2xl shadow-xl p-6 space-y-5 animate-in scale-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {isDetailView ? "Chi tiết thông tin phúc lợi" : editingId ? "Sửa thông tin phúc lợi" : "Lập đề xuất cấp phúc lợi/trợ cấp"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Nhập các chi tiết liên quan đến đợt trợ cấp khó khăn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Đơn vị *
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Đoàn viên nhận hỗ trợ *</label>
                <select
                  value={formData.doanVienId}
                  onChange={(e) => setFormData({ ...formData, doanVienId: e.target.value })}
                  required
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
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
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
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
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
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
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-455 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái duyệt</label>
                  <select
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
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
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none disabled:bg-slate-50 disabled:text-slate-450 transition-all"
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
                        📄 Tải tập tin minh chứng PDF
                      </a>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic mt-1 font-semibold">Không có file minh chứng đính kèm</div>
                  )
                ) : (
                  <EvidenceUpload
                    fileId={formData.fileMinhChungUrl}
                    initialFileName={(editingId ? welfares.find(w => w.id === editingId)?.evidenceFileName : undefined) || undefined}
                    onChange={(fileId) => setFormData({ ...formData, fileMinhChungUrl: fileId || "" })}
                    moduleName="Welfare"
                    organizationId={formData.donViId || user?.donViId || ""}
                  />
                )}
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
