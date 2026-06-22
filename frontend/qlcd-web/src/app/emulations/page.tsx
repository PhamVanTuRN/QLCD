"use client";

import { useState, useEffect } from "react";
import { getEmulationsApi, createEmulationApi, updateEmulationApi, deleteEmulationApi, getCatalogsApi, CatalogDto, getMembers, getUnionTree, UnionUnitDto, getDownloadUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function EmulationsPage() {
  const { user } = useAuth();
  const [emulations, setEmulations] = useState<any[]>([]);
  const [ratings, setRatings] = useState<CatalogDto[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [units, setUnits] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tenPhongTrao: "",
    doanVienId: "",
    donViId: "",
    nam: new Date().getFullYear(),
    diemTuDanhGia: 90,
    diemBchDuyet: 90,
    xepLoai: "",
    khenThuong: "",
    trangThai: 1,
    fileMinhChungUrl: ""
  });

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  function collectUnits(node: UnionUnitDto): { id: string; name: string }[] {
    let result = [{ id: node.id, name: node.tenDonVi }];
    node.children?.forEach((c) => {
      result = result.concat(collectUnits(c));
    });
    return result;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await getEmulationsApi({ search: search || undefined });
      setEmulations(list);
      
      const cats = await getCatalogsApi({ loai: "ChatLuongDoanVien", activeOnly: true });
      setRatings(cats);

      const memList = await getMembers({ pageSize: 100 });
      if (memList && memList.items) {
        setMembers(memList.items);
      }

      const tree = await getUnionTree();
      if (tree) {
        const collected = collectUnits(tree);
        setUnits(collected);
        if (collected.length === 1) {
          setFormData(prev => ({ ...prev, donViId: collected[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách thi đua");
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
      tenPhongTrao: "",
      doanVienId: "",
      donViId: units.length === 1 ? units[0].id : (user?.donViId || ""),
      nam: new Date().getFullYear(),
      diemTuDanhGia: 90,
      diemBchDuyet: 90,
      xepLoai: ratings[0]?.ma || "HOAN_THANH_TOT",
      khenThuong: "",
      trangThai: 1,
      fileMinhChungUrl: ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setIsDetailView(false);
    setFormData({
      tenPhongTrao: item.tenPhongTrao,
      doanVienId: item.doanVienId || "",
      donViId: item.donViId || "",
      nam: item.nam || new Date().getFullYear(),
      diemTuDanhGia: item.diemTuDanhGia || 0,
      diemBchDuyet: item.diemBchDuyet || 0,
      xepLoai: item.xepLoai,
      khenThuong: item.khenThuong || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenDetail = (item: any) => {
    setEditingId(item.id);
    setIsDetailView(true);
    setFormData({
      tenPhongTrao: item.tenPhongTrao,
      doanVienId: item.doanVienId || "",
      donViId: item.donViId || "",
      nam: item.nam || new Date().getFullYear(),
      diemTuDanhGia: item.diemTuDanhGia || 0,
      diemBchDuyet: item.diemBchDuyet || 0,
      xepLoai: item.xepLoai,
      khenThuong: item.khenThuong || "",
      trangThai: item.trangThai || 1,
      fileMinhChungUrl: item.fileMinhChungUrl || ""
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa kết quả thi đua này?")) return;
    try {
      await deleteEmulationApi(id);
      showAlert("success", "Xóa kết quả thi đua thành công");
      loadData();
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Lỗi xóa thi đua");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tenPhongTrao) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    try {
      const payload = {
        ...formData,
        id: editingId || undefined,
        doanVienId: formData.doanVienId === "" ? null : formData.doanVienId,
        donViId: formData.donViId === "" ? null : formData.donViId,
        nam: Number(formData.nam),
        diemTuDanhGia: Number(formData.diemTuDanhGia),
        diemBchDuyet: Number(formData.diemBchDuyet),
        trangThai: Number(formData.trangThai)
      };

      if (editingId) {
        await updateEmulationApi(editingId, payload);
        showAlert("success", "Cập nhật thi đua thành công");
      } else {
        await createEmulationApi(payload);
        showAlert("success", "Đăng ký thi đua thành công");
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin");
    }
  };

  const getRatingName = (ma: string) => {
    return ratings.find((r) => r.ma === ma)?.ten || ma;
  };

  const getStatusName = (status: number) => {
    switch (status) {
      case 1: return "Đã đăng ký";
      case 2: return "Đã đánh giá";
      case 3: return "Đạt danh hiệu";
      default: return "Đăng ký";
    }
  };

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 1: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case 2: return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case 3: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
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
          <h2 className="text-2xl font-bold text-white tracking-tight">Phong trào Thi đua & Đánh giá phân loại</h2>
          <p className="text-xs text-slate-400 mt-1">
            Đăng ký tham gia phong trào, tự đánh giá chấm điểm và bình xét khen thưởng trực tuyến
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Khai báo Thi đua
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng số lượt đăng ký thi đua</span>
          <div className="text-2xl font-extrabold text-white mt-2">{emulations.length} hồ sơ</div>
          <p className="text-[10px] text-slate-400 mt-1">Gồm thi đua cá nhân và tập thể đơn vị</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lượt được Khen thưởng</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2">
            {emulations.filter((e) => e.trangThai === 3).length} chiến sĩ thi đua
          </div>
          <p className="text-[10px] text-slate-400 mt-1">Đã được BCH duyệt và cấp bằng khen/giấy khen</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên phong trào, khen thưởng..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:max-w-md bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
        />
        <div className="text-xs text-slate-400">
          Tổng số: <span className="text-emerald-400 font-bold">{emulations.length}</span>
        </div>
      </div>

      {/* Table list */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Tên phong trào thi đua</th>
                <th className="py-3 px-4">Đối tượng</th>
                <th className="py-3 px-4 text-center">Năm</th>
                <th className="py-3 px-4 text-center">Điểm tự chấm</th>
                <th className="py-3 px-4 text-center">Điểm duyệt</th>
                <th className="py-3 px-4">Xếp loại</th>
                <th className="py-3 px-4">Hình thức khen thưởng</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-2" />
                    Đang tải danh sách thi đua...
                  </td>
                </tr>
              ) : emulations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Chưa có đăng ký thi đua nào được khai báo.
                  </td>
                </tr>
              ) : (
                emulations.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{item.tenPhongTrao}</span>
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
                    </td>
                    <td className="py-3 px-4">
                      {item.hoTenDoanVien ? (
                        <div>
                          <div className="font-semibold text-slate-200">{item.hoTenDoanVien}</div>
                          <div className="text-[10px] text-slate-500">Đoàn viên</div>
                        </div>
                      ) : item.tenDonVi ? (
                        <div>
                          <div className="font-semibold text-emerald-400">{item.tenDonVi}</div>
                          <div className="text-[10px] text-slate-500">Tập thể</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{item.nam}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{item.diemTuDanhGia}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{item.diemBchDuyet}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px]">
                        {getRatingName(item.xepLoai)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-emerald-400 font-semibold">{item.khenThuong || "Chưa bình xét"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.trangThai)}`}>
                        {getStatusName(item.trangThai)}
                      </span>
                    </td>
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
                {isDetailView ? "Chi tiết kết quả thi đua" : editingId ? "Sửa kết quả thi đua" : "Khai báo kết quả thi đua"}
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Nhập các chi tiết liên quan đến phong trào bình xét thi đua</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên phong trào thi đua *</label>
                <input
                  type="text"
                  value={formData.tenPhongTrao}
                  onChange={(e) => setFormData({ ...formData, tenPhongTrao: e.target.value })}
                  placeholder="e.g. Phong trào thi đua Lao động giỏi - Lao động sáng tạo"
                  required
                  disabled={isDetailView}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Thi đua Cá nhân (Chọn ĐV)</label>
                  <select
                    value={formData.doanVienId}
                    onChange={(e) => setFormData({ ...formData, doanVienId: e.target.value, donViId: e.target.value !== "" ? "" : formData.donViId })}
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value="">Chọn cá nhân thi đua...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>{m.hoTen} ({m.maNhanVien})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Thi đua Tập thể (Chọn Đơn vị)</label>
                  <select
                    value={formData.donViId}
                    onChange={(e) => setFormData({ ...formData, donViId: e.target.value, doanVienId: e.target.value !== "" ? "" : formData.doanVienId })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    disabled={isDetailView || (formData.doanVienId === "" && units.length === 1)}
                  >
                    <option value="">Chọn tập thể thi đua...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Năm thi đua *</label>
                  <input
                    type="number"
                    value={formData.nam}
                    onChange={(e) => setFormData({ ...formData, nam: parseInt(e.target.value) || new Date().getFullYear() })}
                    required
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Điểm tự đánh giá *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.diemTuDanhGia}
                    onChange={(e) => setFormData({ ...formData, diemTuDanhGia: parseFloat(e.target.value) || 0 })}
                    required
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Điểm BCH duyệt *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.diemBchDuyet}
                    onChange={(e) => setFormData({ ...formData, diemBchDuyet: parseFloat(e.target.value) || 0 })}
                    required
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Xếp loại thi đua *</label>
                  <select
                    value={formData.xepLoai}
                    onChange={(e) => setFormData({ ...formData, xepLoai: e.target.value })}
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    {ratings.map((r) => (
                      <option key={r.ma} value={r.ma}>{r.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hình thức khen thưởng</label>
                  <input
                    type="text"
                    value={formData.khenThuong}
                    onChange={(e) => setFormData({ ...formData, khenThuong: e.target.value })}
                    placeholder="e.g. Bằng khen Bộ Quốc phòng, Giấy khen"
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái thi đua</label>
                  <select
                    value={formData.trangThai}
                    onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                    disabled={isDetailView}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                  >
                    <option value={1}>Mới đăng ký</option>
                    <option value={2}>Đã đánh giá điểm</option>
                    <option value={3}>Đã trao khen thưởng</option>
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
                      initialFileName={editingId ? emulations.find(e => e.id === editingId)?.evidenceFileName : undefined}
                      onChange={(fileId) => setFormData({ ...formData, fileMinhChungUrl: fileId || "" })}
                      moduleName="Emulations"
                      organizationId={formData.donViId || members.find(m => m.id === formData.doanVienId)?.maToCongDoan || user?.donViId || ""}
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
