"use client";

import { useState, useEffect } from "react";
import { getFinanceApi, createFinanceApi, updateFinanceApi, deleteFinanceApi, getCatalogsApi, CatalogDto, getMembers, getFlattenedUnits, getDownloadUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function FinancePage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [types, setTypes] = useState<CatalogDto[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [units, setUnits] = useState<{ id: string; tenDonVi: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    loaiGiaoDich: "",
    soTien: 0,
    ngayGiaoDich: "",
    nguoiGiaoDich: "",
    doanVienId: "",
    thangNam: "",
    ghiChu: "",
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
      const list = await getFinanceApi({ search: search || undefined });
      setTransactions(list);
      
      const cats = await getCatalogsApi({ loai: "LoaiThuChi", activeOnly: true });
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
      showAlert("error", "Lỗi tải dữ liệu tài chính");
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
      loaiGiaoDich: types[0]?.ma || "THU_DOAN_PHI",
      soTien: 0,
      ngayGiaoDich: new Date().toISOString().split("T")[0],
      nguoiGiaoDich: user?.hoTen || "",
      doanVienId: "",
      thangNam: new Date().toLocaleDateString("vi-VN", { month: "2-digit", year: "numeric" }),
      ghiChu: "",
      fileMinhChungUrl: "",
      donViId: units.length === 1 ? units[0].id : (user?.donViId || "")
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setIsDetailView(false);
    setFormData({
      loaiGiaoDich: item.loaiGiaoDich,
      soTien: item.soTien || 0,
      ngayGiaoDich: item.ngayGiaoDich ? item.ngayGiaoDich.split("T")[0] : "",
      nguoiGiaoDich: item.nguoiGiaoDich || "",
      doanVienId: item.doanVienId || "",
      thangNam: item.thangNam || "",
      ghiChu: item.ghiChu || "",
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (item: any) => {
    setEditingId(item.id);
    setIsDetailView(true);
    setFormData({
      loaiGiaoDich: item.loaiGiaoDich,
      soTien: item.soTien || 0,
      ngayGiaoDich: item.ngayGiaoDich ? item.ngayGiaoDich.split("T")[0] : "",
      nguoiGiaoDich: item.nguoiGiaoDich || "",
      doanVienId: item.doanVienId || "",
      thangNam: item.thangNam || "",
      ghiChu: item.ghiChu || "",
      fileMinhChungUrl: item.fileMinhChungUrl || "",
      donViId: item.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
    try {
      await deleteFinanceApi(id);
      showAlert("success", "Xóa giao dịch thành công");
      loadData();
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Lỗi xóa giao dịch");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.loaiGiaoDich || !formData.soTien || !formData.nguoiGiaoDich) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    try {
      const payload = {
        ...formData,
        id: editingId || undefined,
        donViId: formData.donViId || user?.donViId || "00000000-0000-0000-0000-000000000000",
        doanVienId: formData.doanVienId === "" ? null : formData.doanVienId
      };

      if (editingId) {
        await updateFinanceApi(editingId, payload);
        showAlert("success", "Cập nhật giao dịch thành công");
      } else {
        await createFinanceApi(payload);
        showAlert("success", "Thêm mới giao dịch thành công");
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

  // Tính tổng thu, tổng chi
  const isReceipt = (ma: string) => {
    return ma.startsWith("THU_");
  };

  const totalReceipt = transactions
    .filter((t) => isReceipt(t.loaiGiaoDich))
    .reduce((sum, t) => sum + (t.soTien || 0), 0);

  const totalExpense = transactions
    .filter((t) => !isReceipt(t.loaiGiaoDich))
    .reduce((sum, t) => sum + (t.soTien || 0), 0);

  const balance = totalReceipt - totalExpense;

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
          <h2 className="text-2xl font-bold text-white tracking-tight">Tài chính & Thu nộp Đoàn phí</h2>
          <p className="text-xs text-slate-400 mt-1">
            Theo dõi dòng tiền thu chi, quản lý nộp đoàn phí định kỳ của đoàn viên công đoàn
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Ghi nhận Giao dịch
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Thu quỹ</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">{totalReceipt.toLocaleString()} đ</div>
          <p className="text-[10px] text-slate-400 mt-1">Đoàn phí & Kinh phí cấp</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Chi quỹ</span>
          <div className="text-2xl font-extrabold text-red-400 mt-2">{totalExpense.toLocaleString()} đ</div>
          <p className="text-[10px] text-slate-400 mt-1">Chi hoạt động phong trào & phúc lợi</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tồn quỹ hiện tại</span>
          <div className="text-2xl font-extrabold text-white mt-2">{balance.toLocaleString()} đ</div>
          <p className="text-[10px] text-slate-400 mt-1">Số dư hoạt động khả dụng</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm giao dịch, người nộp..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <div className="text-xs text-slate-400">
          Tổng số giao dịch: <span className="text-emerald-400 font-bold">{transactions.length}</span>
        </div>
      </div>

      {/* Transaction table */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Loại giao dịch</th>
                <th className="py-3 px-4">Ngày giao dịch</th>
                <th className="py-3 px-4">Người giao dịch / Đoàn viên</th>
                <th className="py-3 px-4 text-center">Tháng/Năm</th>
                <th className="py-3 px-4 text-right">Số tiền</th>
                <th className="py-3 px-4">Ghi chú</th>
                <th className="py-3 px-4">Đơn vị quản lý</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-2" />
                    Đang tải danh sách tài chính...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    Chưa có phát sinh tài chính nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isReceipt(item.loaiGiaoDich)
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {getTypeName(item.loaiGiaoDich)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {new Date(item.ngayGiaoDich).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-white">{item.nguoiGiaoDich}</div>
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
                      {item.hoTenDoanVien && <div className="text-[10px] text-slate-500">ĐV liên kết: {item.hoTenDoanVien}</div>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{item.thangNam || "—"}</td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        isReceipt(item.loaiGiaoDich) ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {isReceipt(item.loaiGiaoDich) ? "+" : "-"}{(item.soTien || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-4 text-slate-400 truncate max-w-[150px]">{item.ghiChu || "—"}</td>
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
          <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">
                {isDetailView ? "Chi tiết giao dịch" : editingId ? "Sửa thông tin giao dịch" : "Ghi nhận giao dịch tài chính"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhập các chi tiết liên quan đến nguồn thu hoặc chi tiêu</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Đơn vị *
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Loại giao dịch *</label>
                  <select
                    value={formData.loaiGiaoDich}
                    onChange={(e) => setFormData({ ...formData, loaiGiaoDich: e.target.value })}
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số tiền (đ) *</label>
                  <input
                    type="number"
                    value={formData.soTien}
                    onChange={(e) => setFormData({ ...formData, soTien: parseInt(e.target.value) || 0 })}
                    required
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày giao dịch *</label>
                  <input
                    type="date"
                    value={formData.ngayGiaoDich}
                    onChange={(e) => setFormData({ ...formData, ngayGiaoDich: e.target.value })}
                    required
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tháng/Năm (MM/yyyy)</label>
                  <input
                    type="text"
                    value={formData.thangNam}
                    onChange={(e) => setFormData({ ...formData, thangNam: e.target.value })}
                    placeholder="e.g. 06/2026"
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Người giao dịch (Người đóng/nhận) *</label>
                <input
                  type="text"
                  value={formData.nguoiGiaoDich}
                  onChange={(e) => setFormData({ ...formData, nguoiGiaoDich: e.target.value })}
                  required
                  disabled={isDetailView}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              {formData.loaiGiaoDich === "THU_DOAN_PHI" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Liên kết tới Đoàn viên</label>
                  <select
                    value={formData.doanVienId}
                    onChange={(e) => setFormData({ ...formData, doanVienId: e.target.value })}
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">Chọn đoàn viên (Không bắt buộc)...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.hoTen} ({m.maNhanVien})</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú</label>
                <textarea
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  rows={2}
                  disabled={isDetailView}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 resize-none disabled:opacity-50"
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
                    initialFileName={editingId ? transactions.find(t => t.id === editingId)?.evidenceFileName : undefined}
                    onChange={(fileId) => setFormData({ ...formData, fileMinhChungUrl: fileId || "" })}
                    moduleName="Finance"
                    organizationId={formData.donViId || user?.donViId || ""}
                  />
                )}
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
