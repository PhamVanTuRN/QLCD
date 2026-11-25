"use client";

import FormDialog from "@/components/FormDialog";

import { useResource } from "@/lib/use-resource";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import MemberSelect from "@/components/MemberSelect";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import type { WelfareDto } from "@/lib/business-types";
import { apiMessage, getWelfareApi, createWelfareApi, updateWelfareApi, getCatalogsApi, getFlattenedUnits } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function WelfarePage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { notice, dismiss, showAlert } = useNotice();
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
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

  const readPage = useCallback((signal: AbortSignal) => getWelfareApi({ search: search.trim() || undefined, page }, signal), [search, page]);
  const { data: list, loading, error: listError, reload: loadData } = useResource(readPage, search ? 200 : 0);
  const welfares = list?.data ?? [];
  const hasMore = list?.hasMore ?? false;

  const readChoices = useCallback(async (signal: AbortSignal) => {
    const [catalog, units] = await Promise.all([
      getCatalogsApi({ loai: "HinhThucPhucLoi", activeOnly: true }, signal),
      getFlattenedUnits(signal),
    ]);
    return { catalog, units };
  }, []);
  const { data: choices, error: choicesError, reload: reloadChoices } = useResource(readChoices);
  const types = choices?.catalog ?? [];
  const units = choices?.units ?? [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedMember(null);
    setFormData({
      doanVienId: "",
      loaiPhucLoi: types[0]?.ma || "OM_DAU",
      kinhPhiHoTro: 500000,
      ngayHoTro: new Date().toISOString().split("T")[0],
      lyDo: "",
      trangThai: 1,
      fileMinhChungUrl: "",
      donViId: user?.role === "TOCD" ? user.donViId || "" : ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: WelfareDto) => {
    setEditingId(item.id);
    setSelectedMember(item.hoTenDoanVien);
    setFormData({
      doanVienId: item.doanVienId ?? "",
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

  const handleApprove = async (id: string, newStatus: number) => {
    try {
      const item = welfares.find((w) => w.id === id);
      if (!item?.doanVienId) return;
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
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi thay đổi trạng thái phúc lợi"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.doanVienId || !formData.lyDo || !formData.kinhPhiHoTro) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
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
      showAlert("error", apiMessage(err, "Đã xảy ra lỗi khi lưu thông tin"));
    } finally { setSubmitting(false); }
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
      case 1: return "bg-gold-soft text-gold-ink border-gold-line";
      case 2: return "bg-brand-soft text-brand border-brand-line";
      case 3: return "bg-danger-soft text-danger border-danger-line";
      default: return "bg-soft text-muted border-line";
    }
  };

  // Tính tổng số tiền đã cấp
  const totalPaid = welfares
    .filter((w) => w.trangThai === 2)
    .reduce((sum, w) => sum + (w.kinhPhiHoTro || 0), 0);

  return (
    <div className="space-y-6">
      {/* Alert */}
      <Notice value={notice} dismiss={dismiss} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Quản lý Phúc lợi & Cứu trợ khó khăn</h1>
          <p className="text-xs text-muted mt-1">
            Ghi nhận hỗ trợ ốm đau, hiếu hỷ, thai sản và cứu trợ khẩn cấp cho đoàn viên
          </p>
        </div>
        <button
          disabled={!choices} onClick={handleOpenCreate}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-strong/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Yêu cầu Trợ cấp
        </button>
      </div>

      {/* Statistics */}
      <h2 className="text-sm font-semibold text-copy">Thống kê trên trang này</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Kinh phí đã cấp trên trang này</span>
          <div className="text-2xl font-extrabold text-brand mt-2">{totalPaid.toLocaleString()} đ</div>
          <p className="text-[10px] text-muted mt-1">Chỉ tính hồ sơ có trạng thái Đã duyệt</p>
        </div>
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Số lượt nhận cứu trợ trên trang này</span>
          <div className="text-2xl font-extrabold text-ink mt-2">
            {welfares.filter((w) => w.trangThai === 2).length} lượt
          </div>
          <p className="text-[10px] text-muted mt-1">Đoàn viên được thăm hỏi và chăm lo kịp thời</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-surface border border-line p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          aria-label="Tìm kiếm" maxLength={100}
          placeholder="Tìm kiếm theo họ tên đoàn viên, lý do..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:max-w-md bg-surface border border-line rounded-xl px-4 py-2 text-xs text-ink focus:outline-none focus:border-brand transition-all"
        />
        <div className="text-xs text-muted">
          Hồ sơ trang này: <span className="text-brand font-bold">{welfares.length}</span>
        </div>
      </div>

      {/* Welfare table */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <div className="overflow-x-auto" role="region" aria-label="Bảng hồ sơ phúc lợi" tabIndex={0}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-muted font-semibold">
                <th scope="col" className="py-3 px-4">Đoàn viên hưởng</th>
                <th scope="col" className="py-3 px-4">Hình thức phúc lợi</th>
                <th scope="col" className="py-3 px-4">Ngày hỗ trợ</th>
                <th scope="col" className="py-3 px-4">Lý do hỗ trợ</th>
                <th scope="col" className="py-3 px-4 text-right">Kinh phí hỗ trợ</th>
                <th scope="col" className="py-3 px-4 text-center">Trạng thái</th>
                <th scope="col" className="py-3 px-4 text-right">Thao tác duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listError ? (
                <tr><td colSpan={7}><LoadState retry={loadData} /></td></tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    <span className="inline-block w-4 h-4 border-2 border-edge border-t-brand rounded-full animate-spin mr-2" />
                    Đang tải danh sách phúc lợi...
                  </td>
                </tr>
              ) : welfares.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    Chưa có hồ sơ trợ cấp/phúc lợi nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                welfares.map((item) => (
                  <tr key={item.id} className="hover:bg-soft text-copy">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="font-semibold text-ink">{item.hoTenDoanVien || "Chưa có liên kết"}</div>
                        {item.evidenceFileId && (
                          <a
                            href={`/api/v1/evidence-files/download/${item.evidenceFileId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[9px] text-brand hover:text-brand-hover font-bold bg-brand-soft border border-brand-line px-1 py-0.2 rounded transition-all"
                            title="Tải file minh chứng"
                          >
                            📄 PDF
                          </a>
                        )}
                      </div>
                      <div className="text-[10px] text-muted">Mã NV: {item.maNhanVien || "—"} {item.tenDonVi && `• ${item.tenDonVi}`}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-soft text-copy border border-line text-[10px]">
                        {getTypeName(item.loaiPhucLoi)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {new Date(item.ngayHoTro).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">{item.lyDo}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-brand">
                      {(item.kinhPhiHoTro || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(item.trangThai)}`}>
                        {getStatusName(item.trangThai)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user?.role === "CDCS" && item.trangThai === 1 && item.doanVienId && (
                          <>
                            <button
                              onClick={() => handleApprove(item.id, 2)}
                              className="bg-soft-strong hover:bg-soft-strong border border-brand-line text-brand px-2 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              Duyệt
                            </button>
                            <button
                              onClick={() => handleApprove(item.id, 3)}
                              className="bg-danger-line hover:bg-danger-line border border-danger-line text-danger px-2 py-1 rounded text-[10px] font-bold transition-all"
                            >
                              Từ chối
                            </button>
                          </>
                        )}
                        {item.doanVienId && (user?.role === "CDCS" || item.trangThai === 1) && (
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="bg-soft hover:bg-soft-strong border border-line text-copy px-2.5 py-1 rounded text-[10px] font-bold transition-all"
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
          <ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />
        </div>
      </div>

      {Boolean(choicesError) && <LoadState message="Không thể tải lựa chọn cho biểu mẫu." retry={reloadChoices} />}

      {/* Modal Dialog */}
      {isModalOpen && (
        <FormDialog label="Đề xuất phúc lợi" onClose={() => { setIsModalOpen(false); dismiss(); }} busy={submitting}>
          {notice?.type === "error" && <Notice value={notice} dismiss={dismiss} />}
            <div>
              <h3 className="text-sm font-bold text-ink">
                {editingId ? "Sửa thông tin phúc lợi" : "Lập đề xuất cấp phúc lợi/trợ cấp"}
              </h3>
              <p className="text-[10px] text-muted mt-0.5">Nhập các chi tiết liên quan đến đợt trợ cấp khó khăn</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="welfare-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Đơn vị *
                </label>
                <select id="welfare-field-1"
                  value={formData.donViId}
                  onChange={(e) => setFormData({ ...formData, donViId: e.target.value, doanVienId: "" })}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  required
                >
                  <option value="">-- Chọn đơn vị --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>{u.tenDonVi}</option>
                  ))}
                </select>
              </div>

              <MemberSelect label="Đoàn viên nhận hỗ trợ" value={formData.doanVienId} selectedName={selectedMember} organizationId={formData.donViId} required
                  onChange={(value, organizationId) => setFormData(current => ({ ...current, doanVienId: value, donViId: organizationId ?? current.donViId }))} />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="welfare-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Hình thức phúc lợi *</label>
                  <select id="welfare-field-2"
                    value={formData.loaiPhucLoi}
                    onChange={(e) => setFormData({ ...formData, loaiPhucLoi: e.target.value })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="welfare-field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Số tiền hỗ trợ (đ) *</label>
                  <input id="welfare-field-3"
                    type="number"
                    value={formData.kinhPhiHoTro}
                    onChange={(e) => setFormData({ ...formData, kinhPhiHoTro: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="welfare-field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Ngày trao tặng/cấp *</label>
                  <input id="welfare-field-4"
                    type="date"
                    value={formData.ngayHoTro}
                    onChange={(e) => setFormData({ ...formData, ngayHoTro: e.target.value })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="welfare-field-5" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Trạng thái duyệt</label>
                  <select id="welfare-field-5"
                    value={formData.trangThai}
                    disabled={user?.role !== "CDCS"}
                    onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    <option value={1}>Chờ duyệt</option>
                    <option value={2}>Đã duyệt cấp</option>
                    <option value={3}>Từ chối cấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="welfare-field-6" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Lý do chi tiết *</label>
                <textarea id="welfare-field-6"
                  value={formData.lyDo}
                  onChange={(e) => setFormData({ ...formData, lyDo: e.target.value })}
                  placeholder="e.g. Bản thân đoàn viên ốm đau nằm viện dài ngày"
                  required
                  rows={3}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">File minh chứng PDF</label>
                <EvidenceUpload
                  fileId={formData.fileMinhChungUrl}
                  initialFileName={editingId ? welfares.find(w => w.id === editingId)?.evidenceFileName : undefined}
                  onChange={fileId => setFormData(current => ({ ...current, fileMinhChungUrl: fileId ?? "" }))}
                  moduleName="Welfare"
                  organizationId={formData.donViId || user?.donViId || ""}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); dismiss(); }} disabled={submitting}
                  className="bg-soft hover:bg-soft-strong text-copy px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit" disabled={submitting}
                  className="bg-brand hover:bg-brand-hover text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-brand-strong/30 transition-all active:scale-95"
                >
                  Lưu
                </button>
              </div>
            </form>
        </FormDialog>
      )}
    </div>
  );
}
