"use client";

import TableText from "@/components/TableText";
import DataTable from "@/components/DataTable";

import useConfirmation from "@/components/useConfirmation";

import FormDialog from "@/components/FormDialog";

import { useResource } from "@/lib/use-resource";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import MemberSelect from "@/components/MemberSelect";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import type { FinanceDto } from "@/lib/business-types";
import { apiMessage, getFinanceApi, createFinanceApi, updateFinanceApi, deleteFinanceApi, getCatalogsApi, getFlattenedUnits } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import EvidenceUpload from "@/components/EvidenceUpload";

export default function FinancePage() {
  const { confirm, confirmationDialog } = useConfirmation();
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

  const readPage = useCallback((signal: AbortSignal) => getFinanceApi({ search: search.trim() || undefined, page }, signal), [search, page]);
  const { data: list, loading, error: listError, reload: loadData } = useResource(readPage, search ? 200 : 0);
  const transactions = list?.data ?? [];
  const hasMore = list?.hasMore ?? false;

  const readChoices = useCallback(async (signal: AbortSignal) => {
    const [catalog, units] = await Promise.all([
      getCatalogsApi({ loai: "LoaiThuChi", activeOnly: true }, signal),
      getFlattenedUnits(signal),
    ]);
    return { catalog, units };
  }, []);
  const { data: choices, error: choicesError, reload: reloadChoices } = useResource(readChoices);
  const types = user?.role === "TOCD"
    ? (choices?.catalog ?? []).filter(type => type.ma === "THU_DOAN_PHI") : choices?.catalog ?? [];
  const units = choices?.units ?? [];

  const handleOpenCreate = () => {
    setEditingId(null);
    setSelectedMember(null);
    setFormData({
      loaiGiaoDich: types[0]?.ma || "THU_DOAN_PHI",
      soTien: 0,
      ngayGiaoDich: new Date().toISOString().split("T")[0],
      nguoiGiaoDich: user?.hoTen || "",
      doanVienId: "",
      thangNam: new Date().toISOString().slice(0, 7).split("-").reverse().join("/"),
      ghiChu: "",
      fileMinhChungUrl: "",
      donViId: user?.donViId || ""
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FinanceDto) => {
    setEditingId(item.id);
    setSelectedMember(item.hoTenDoanVien);
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
    if (!await confirm("Bạn có chắc chắn muốn xóa giao dịch này?")) return;
    try {
      await deleteFinanceApi(id);
      showAlert("success", "Xóa giao dịch thành công");
      if (transactions.length === 1 && page > 1) setPage(page - 1);
      else loadData();
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi xóa giao dịch"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!formData.loaiGiaoDich || !formData.soTien || !formData.nguoiGiaoDich) {
      showAlert("error", "Vui lòng điền đủ các trường bắt buộc");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
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
    } catch (err) {
      showAlert("error", apiMessage(err, "Đã xảy ra lỗi khi lưu thông tin"));
    } finally { setSubmitting(false); }
  };

  const getTypeName = (ma: string) => {
    return types.find((t) => t.ma === ma)?.ten || ma;
  };

  // Tính tổng thu, tổng chi
  const isReceipt = (ma: string) => {
    return ma.startsWith("THU_");
  };

  const totalReceipt = list?.totals?.receipt;
  const totalExpense = list?.totals?.expense;
  const balance = totalReceipt === undefined || totalExpense === undefined ? undefined : totalReceipt - totalExpense;
  const money = (amount: number | undefined) => amount === undefined ? "—" : new Intl.NumberFormat("vi-VN", {
    style: "currency", currency: "VND",
  }).format(amount);

  return (
    <div className="space-y-6">
      {confirmationDialog}
      {/* Alert */}
      <Notice value={notice} dismiss={dismiss} />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Tài chính & Thu nộp Đoàn phí</h1>
          <p className="text-xs text-muted mt-1">
            Theo dõi dòng tiền thu chi, quản lý nộp đoàn phí định kỳ của đoàn viên công đoàn
          </p>
        </div>
        <button
          disabled={!choices} onClick={handleOpenCreate}
          className="bg-brand hover:bg-brand-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-brand-strong/30 transition-all flex items-center gap-2 active:scale-95"
        >
          ➕ Ghi nhận Giao dịch
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-xs font-bold text-muted">Tổng thu theo bộ lọc</span>
          <div className="text-2xl font-extrabold text-brand mt-2">{money(totalReceipt)}</div>
          <p className="text-[10px] text-muted mt-1">Đoàn phí & Kinh phí cấp</p>
        </div>
        {user?.role !== "TOCD" && <>
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-xs font-bold text-muted">Tổng chi theo bộ lọc</span>
          <div className="text-2xl font-extrabold text-danger mt-2">{money(totalExpense)}</div>
          <p className="text-[10px] text-muted mt-1">Chi hoạt động phong trào & phúc lợi</p>
        </div>
        <div className="bg-surface border border-line p-5 rounded-2xl">
          <span className="text-xs font-bold text-muted">Chênh lệch thu chi theo bộ lọc</span>
          <div className="text-2xl font-extrabold text-ink mt-2">{money(balance)}</div>
        </div>
        </>}
      </div>

      {/* Filter bar */}
      <div className="bg-surface border border-line p-4 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between">
        <input
          type="text"
          aria-label="Tìm kiếm" maxLength={100}
          placeholder="Tìm kiếm giao dịch, người nộp..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:max-w-md bg-surface border border-line rounded-xl px-4 py-2 text-xs text-ink focus:outline-none focus:border-brand transition-all"
        />
        <div className="text-xs text-muted">
          Giao dịch trên trang này: <span className="text-brand font-bold">{transactions.length}</span>
        </div>
      </div>

      {/* Transaction table */}
      <div className="bg-surface border border-line rounded-2xl p-6">
        <DataTable label="Bảng giao dịch" footer={<ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />}>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line text-muted font-semibold">
                <th scope="col" className="py-3 px-4">Loại giao dịch</th>
                <th scope="col" className="py-3 px-4">Ngày giao dịch</th>
                <th scope="col" className="py-3 px-4">Người giao dịch / Đoàn viên</th>
                <th scope="col" className="py-3 px-4 text-center">Tháng/Năm</th>
                <th scope="col" className="py-3 px-4 text-right">Số tiền</th>
                <th scope="col" className="py-3 px-4">Ghi chú</th>
                <th scope="col" className="py-3 px-4">Đơn vị quản lý</th>
                <th scope="col" className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listError ? (
                <tr><td colSpan={8}><LoadState retry={loadData} /></td></tr>
              ) : loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    <span className="inline-block w-4 h-4 border-2 border-edge border-t-brand rounded-full animate-spin mr-2" />
                    Đang tải danh sách tài chính...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted">
                    Chưa có phát sinh tài chính nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                transactions.map((item) => (
                  <tr key={item.id} className="hover:bg-soft text-copy">
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          isReceipt(item.loaiGiaoDich)
                            ? "bg-brand-soft text-brand border-brand-line"
                            : "bg-danger-soft text-danger border-danger-line"
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
                        <div className="font-semibold text-ink"><TableText text={item.nguoiGiaoDich} /></div>
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
                      {item.hoTenDoanVien && <div className="text-[10px] text-muted">ĐV liên kết: {item.hoTenDoanVien}</div>}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{item.thangNam || "—"}</td>
                    <td
                      className={`py-3 px-4 text-right font-mono font-bold ${
                        isReceipt(item.loaiGiaoDich) ? "text-brand" : "text-danger"
                      }`}
                    >
                      {isReceipt(item.loaiGiaoDich) ? "+" : "-"}{(item.soTien || 0).toLocaleString()} đ
                    </td>
                    <td className="py-3 px-4 text-muted max-w-[150px]" title={item.ghiChu || undefined}><TableText text={item.ghiChu} /></td>
                    <td className="py-3 px-4 text-muted"><TableText text={item.tenDonVi} /></td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="bg-brand-soft hover:bg-soft-strong border border-brand-line text-brand px-2 py-1 rounded text-[10px] font-bold transition-all"
                        >
                          Sửa
                        </button>
                        {(user?.role === "CDCS" || user?.role === "CDBP") && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-danger-soft hover:bg-danger-line border border-danger-line text-danger px-2 py-1 rounded text-[10px] font-bold transition-all"
                        >
                          Xóa
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DataTable>
      </div>

      {Boolean(choicesError) && <LoadState message="Không thể tải lựa chọn cho biểu mẫu." retry={reloadChoices} />}

      {/* Modal Dialog */}
      {isModalOpen && (
        <FormDialog label="Thông tin giao dịch" onClose={() => { setIsModalOpen(false); dismiss(); }} busy={submitting}>
          {notice?.type === "error" && <Notice value={notice} dismiss={dismiss} />}
            <div>
              <h3 className="text-sm font-bold text-ink">{editingId ? "Sửa thông tin giao dịch" : "Ghi nhận giao dịch tài chính"}</h3>
              <p className="text-[10px] text-muted mt-0.5">Nhập các chi tiết liên quan đến nguồn thu hoặc chi tiêu</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="finance-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">
                  Đơn vị *
                </label>
                <select id="finance-field-1"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="finance-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Loại giao dịch *</label>
                  <select id="finance-field-2"
                    value={formData.loaiGiaoDich}
                    onChange={(e) => setFormData({ ...formData, loaiGiaoDich: e.target.value })}
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  >
                    {types.map((t) => (
                      <option key={t.ma} value={t.ma}>{t.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="finance-field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Số tiền (đ) *</label>
                  <input id="finance-field-3"
                    type="number"
                    value={formData.soTien}
                    onChange={(e) => setFormData({ ...formData, soTien: parseInt(e.target.value) || 0 })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="finance-field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Ngày giao dịch *</label>
                  <input id="finance-field-4"
                    type="date"
                    value={formData.ngayGiaoDich}
                    onChange={(e) => setFormData({ ...formData, ngayGiaoDich: e.target.value })}
                    required
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label htmlFor="finance-field-5" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Tháng/Năm (MM/yyyy)</label>
                  <input id="finance-field-5"
                    type="text"
                    value={formData.thangNam}
                    onChange={(e) => setFormData({ ...formData, thangNam: e.target.value })}
                    placeholder="e.g. 06/2026"
                    className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink placeholder-muted focus:outline-none focus:border-brand"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="finance-field-6" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Người giao dịch (Người đóng/nhận) *</label>
                <input id="finance-field-6"
                  type="text"
                  value={formData.nguoiGiaoDich}
                  onChange={(e) => setFormData({ ...formData, nguoiGiaoDich: e.target.value })}
                  required
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-ink focus:outline-none focus:border-brand"
                />
              </div>

              {formData.loaiGiaoDich === "THU_DOAN_PHI" && (
                <MemberSelect label="Đoàn viên đóng đoàn phí" value={formData.doanVienId} selectedName={selectedMember} organizationId={formData.donViId}
                  onChange={value => setFormData(current => ({ ...current, doanVienId: value }))} />
              )}

              <div>
                <label htmlFor="finance-field-7" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Ghi chú</label>
                <textarea id="finance-field-7"
                  value={formData.ghiChu}
                  onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
                  rows={2}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-ink placeholder-muted focus:outline-none focus:border-brand resize-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">File minh chứng PDF</label>
                <EvidenceUpload
                  fileId={formData.fileMinhChungUrl}
                  initialFileName={editingId ? transactions.find(t => t.id === editingId)?.evidenceFileName : undefined}
                  onChange={fileId => setFormData(current => ({ ...current, fileMinhChungUrl: fileId ?? "" }))}
                  moduleName="Finance"
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
