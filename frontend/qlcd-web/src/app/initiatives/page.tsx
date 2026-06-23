"use client";

import { useState, useEffect } from "react";
import { getInitiativesApi, createInitiativeApi, updateInitiativeApi, deleteInitiativeApi, getCatalogsApi, CatalogDto, getMembers, getFlattenedUnits, getDownloadUrl, UnionMemberDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";
import { PageHeader, StatCard } from "@/components/ui-components";
import { Plus, Search, Lightbulb, Award, Trash2, Edit3, Eye } from "lucide-react";

interface InitiativeItem {
  id: string;
  doanVienId: string;
  hoTenDoanVien?: string | null;
  maNhanVien?: string | null;
  tenDeTai: string;
  linhVuc: string;
  capDeTai: string;
  hieuQuaKinhTe?: string | null;
  ngayNghiemThu?: string | null;
  namThucHien: number;
  ketQuaNghiemThu?: string | null;
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

export default function InitiativesPage() {
  const { user } = useAuth();
  const [initiatives, setInitiatives] = useState<InitiativeItem[]>([]);
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
    tenDeTai: "",
    linhVuc: "",
    capDeTai: "",
    hieuQuaKinhTe: "",
    ngayNghiemThu: "",
    namThucHien: new Date().getFullYear(),
    ketQuaNghiemThu: "",
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
      const list = await getInitiativesApi({ search: search || undefined }) as InitiativeItem[];
      setInitiatives(list);
      
      const cats = await getCatalogsApi({ loai: "LoaiSangKien", activeOnly: true });
      setTypes(cats);

      const memList = await getMembers({ pageSize: 100 });
      if (memList && memList.items) {
        setMembers(memList.items);
      }

      const unitList = await getFlattenedUnits();
      setUnits(unitList);
      if (unitList.length === 1) {
        setFormData(prev => ({ ...prev, donViId: unitList[0].id }));
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách sáng kiến");
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
      tenDeTai: "",
      linhVuc: "Y khoa",
      capDeTai: types[0]?.ma || "CAP_CO_SO",
      hieuQuaKinhTe: "",
      ngayNghiemThu: new Date().toISOString().split("T")[0],
      namThucHien: new Date().getFullYear(),
      ketQuaNghiemThu: "",
      trangThai: 1,
      fileMinhChungUrl: "",
      donViId: units.length === 1 ? units[0].id : (user?.donViId || "")
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: InitiativeItem) => {
    setEditingId(item.id);
    setIsDetailView(false);
    setFormData({
      doanVienId: item.doanVienId,
      tenDeTai: item.tenDeTai,
      linhVuc: item.linhVuc || "",
      capDeTai: item.capDeTai,
      hieuQuaKinhTe: item.hieuQuaKinhTe || "",
      ngayNghiemThu: item.ngayNghiemThu ? item.ngayNghiemThu.split("T")[0] : "",
      namThucHien: item.namThucHien || new Date().getFullYear(),
      ketQuaNghiemThu: item.ketQuaNghiemThu || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (item: InitiativeItem) => {
    setEditingId(item.id);
    setIsDetailView(true);
    setFormData({
      doanVienId: item.doanVienId,
      tenDeTai: item.tenDeTai,
      linhVuc: item.linhVuc || "",
      capDeTai: item.capDeTai,
      hieuQuaKinhTe: item.hieuQuaKinhTe || "",
      ngayNghiemThu: item.ngayNghiemThu ? item.ngayNghiemThu.split("T")[0] : "",
      namThucHien: item.namThucHien || new Date().getFullYear(),
      ketQuaNghiemThu: item.ketQuaNghiemThu || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa sáng kiến này?")) return;
    try {
      await deleteInitiativeApi(id);
      showAlert("success", "Xóa sáng kiến thành công");
      loadData();
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Lỗi xóa sáng kiến");
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
        id: editingId || undefined,
        donViId: formData.donViId || user?.donViId || "00000000-0000-0000-0000-000000000000",
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
      case 1: return "Đăng ký mới";
      case 2: return "Nghiệm thu Đạt";
      case 3: return "Từ chối/Hủy";
      default: return "Đăng ký";
    }
  };

  const getStatusBadgeClass = (status: number) => {
    switch (status) {
      case 1: return "bg-blue-50 text-blue-700 border-blue-200/60";
      case 2: return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
      case 3: return "bg-red-50 text-red-700 border-red-200/60";
      default: return "bg-slate-55 text-slate-700 border-slate-200/60";
    }
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
        title="Phong trào Sáng kiến & Đề tài Khoa học" 
        description="Quản lý danh sách sáng kiến cải tiến kỹ thuật và đề tài nghiên cứu khoa học của cán bộ, đoàn viên"
      >
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 active:scale-98"
        >
          <Plus className="w-4 h-4 shrink-0" /> Đăng ký Sáng kiến
        </button>
      </PageHeader>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard
          title="Tổng Đề tài & Sáng kiến"
          value={`${initiatives.length} đăng ký`}
          subtitle="Ghi nhận từ các tổ công đoàn trực thuộc"
          icon={Lightbulb}
          color="blue"
        />
        <StatCard
          title="Đã nghiệm thu thông qua"
          value={`${initiatives.filter((i) => i.trangThai === 2).length} sáng kiến`}
          subtitle="Có tính thực tiễn và hiệu quả kinh tế cao"
          icon={Award}
          color="emerald"
        />
      </div>

      {/* Filter panel */}
      <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên đề tài, lĩnh vực, tác giả..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 shrink-0" />
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          Tổng số: <span className="text-blue-600">{initiatives.length}</span>
        </div>
      </div>

      {/* Initiatives table */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs table-modern">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-3.5">Tên đề tài / Sáng kiến</th>
                <th className="px-6 py-3.5">Cấp đề tài</th>
                <th className="px-6 py-3.5">Tác giả (Đoàn viên)</th>
                <th className="px-6 py-3.5">Lĩnh vực</th>
                <th className="px-6 py-3.5 text-center">Năm thực hiện</th>
                <th className="px-6 py-3.5 text-center">Nghiệm thu</th>
                <th className="px-6 py-3.5 text-center">Trạng thái</th>
                <th className="px-6 py-3.5 text-center w-40">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-400">Đang tải danh sách sáng kiến...</span>
                    </div>
                  </td>
                </tr>
              ) : initiatives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="text-lg">📂</span>
                      <span>Chưa có sáng kiến nào được ghi nhận.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                initiatives.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-all">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-805">{item.tenDeTai}</div>
                      {item.hieuQuaKinhTe && <div className="text-[10px] text-slate-400 font-semibold mt-0.5 truncate max-w-[220px]">{item.hieuQuaKinhTe}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100/80 text-slate-600 border border-slate-200/50 text-[10px] font-semibold">
                        {getTypeName(item.capDeTai)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="font-bold text-slate-800">{item.hoTenDoanVien || "—"}</div>
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
                    <td className="px-6 py-4 font-semibold text-slate-750">{item.linhVuc}</td>
                    <td className="px-6 py-4 text-center font-mono font-medium text-slate-500">{item.namThucHien}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-bold text-slate-800">{item.ketQuaNghiemThu || "—"}</div>
                      {item.ngayNghiemThu && <div className="text-[9px] text-slate-400 font-medium mt-0.5">{new Date(item.ngayNghiemThu).toLocaleDateString("vi-VN")}</div>}
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
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="bg-blue-55 hover:bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
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
                {isDetailView ? "Chi tiết sáng kiến" : editingId ? "Sửa thông tin đề tài" : "Đăng ký đề tài / sáng kiến mới"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">Nhập các chi tiết liên quan đến đề tài sáng kiến khoa học</p>
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tác giả (Đoàn viên) *</label>
                <select
                  value={formData.doanVienId}
                  onChange={(e) => setFormData({ ...formData, doanVienId: e.target.value })}
                  required
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
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
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
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
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cấp đề tài *</label>
                  <select
                    value={formData.capDeTai}
                    onChange={(e) => setFormData({ ...formData, capDeTai: e.target.value })}
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
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
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-455 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày nghiệm thu</label>
                  <input
                    type="date"
                    value={formData.ngayNghiemThu}
                    onChange={(e) => setFormData({ ...formData, ngayNghiemThu: e.target.value })}
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-455 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kết quả nghiệm thu</label>
                  <input
                    type="text"
                    value={formData.ketQuaNghiemThu}
                    onChange={(e) => setFormData({ ...formData, ketQuaNghiemThu: e.target.value })}
                    placeholder="e.g. Đạt, Xuất sắc"
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-450 transition-all"
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
                  disabled={isDetailView}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 resize-none disabled:bg-slate-50 disabled:text-slate-450 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái đề tài</label>
                  <select
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                    disabled={isDetailView}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400 transition-all cursor-pointer"
                  >
                    <option value={1}>Mới đăng ký</option>
                    <option value={2}>Nghiệm thu Đạt</option>
                    <option value={3}>Từ chối/Hủy đề tài</option>
                  </select>
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
                      initialFileName={(editingId ? initiatives.find(i => i.id === editingId)?.evidenceFileName : undefined) || undefined}
                      onChange={(fileId) => setFormData({ ...formData, fileMinhChungUrl: fileId || "" })}
                      moduleName="Initiatives"
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
