"use client";

import { useCallback, useState } from "react";
import FormDialog from "@/components/FormDialog";
import ListPager from "@/components/ListPager";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import { useResource } from "@/lib/use-resource";
import { apiMessage, getManagementBlocksPage, saveManagementBlock, type ManagementBlockDto } from "@/lib/api";

export default function ManagementBlocksPanel({ canManage }: { canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const read = useCallback((signal: AbortSignal) => getManagementBlocksPage({ page, search }, signal), [page, search]);
  const { data, loading, error, reload } = useResource(read, search ? 200 : 0);
  const [editing, setEditing] = useState<ManagementBlockDto | null | undefined>();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [active, setActive] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const { notice, dismiss, showAlert } = useNotice();
  function open(block: ManagementBlockDto | null) {
    setEditing(block); setName(block?.tenKhoi ?? ""); setNote(block?.ghiChu ?? "");
    setActive(block?.trangThai ?? true); setConfirmed(false); setSaveError("");
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !name.trim()) return;
    setBusy(true); setSaveError("");
    try {
      await saveManagementBlock({ id: editing?.id, tenKhoi: name, ghiChu: note || null, trangThai: active, confirmed });
      setEditing(undefined); reload();
      showAlert("success", "Đã lưu khối quản lý. Liên kết, trạng thái đơn vị và tài khoản được giữ nguyên.");
    } catch (err) { setSaveError(apiMessage(err, "Không thể lưu khối quản lý.")); }
    finally { setBusy(false); }
  }
  return <section className="lg:col-span-3 panel space-y-4 p-4 sm:p-6" aria-label="Khối quản lý">
    <Notice value={notice} dismiss={dismiss} />
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-bold text-ink">Khối quản lý</h2>
      {canManage && <button type="button" onClick={() => open(null)} className="min-h-11 rounded-lg bg-brand px-4 py-2 font-semibold text-white">Thêm khối quản lý</button>}
    </div>
    <p className="text-sm text-muted">Khối chỉ phân nhóm đơn vị, không tạo đơn vị/tài khoản hoặc thay đổi quyền. Ngừng sử dụng giữ mọi liên kết và chỉ chặn chọn khối cho phân loại mới.</p>
    <input aria-label="Tìm khối quản lý" maxLength={100} value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
      className="min-h-11 w-full rounded-lg border border-edge px-3 text-sm" placeholder="Tìm tên khối..." />
    {loading || error ? <LoadState loading={loading} retry={reload} /> : <ul className="divide-y divide-line">
      {data?.data.map(block => <li key={block.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
        <div className="min-w-0"><p className="break-words font-semibold text-ink">{block.tenKhoi}</p>
          <p className="break-words text-sm text-muted">{block.ghiChu}</p>
          <p className="text-sm text-muted">{block.trangThai && !block.legacyDeleted ? "Đang sử dụng" : "Ngừng sử dụng"}{block.unitCount !== null && ` · ${block.unitCount} đơn vị liên kết (gồm đơn vị ngừng/lưu trữ)`}</p>
        </div>
        {canManage ? <button type="button" onClick={() => open(block)} className="min-h-11 rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-brand">Sửa khối</button> : <span className="text-sm text-muted">Chỉ xem</span>}
      </li>)}
    </ul>}
    {!loading && !error && !data?.data.length && <p className="text-sm text-muted">Chưa có khối phù hợp.</p>}
    <ListPager page={page} hasMore={data?.hasMore ?? false} loading={loading} onChange={setPage} />
    {editing !== undefined && <FormDialog label={editing ? "Sửa khối quản lý" : "Thêm khối quản lý"} onClose={() => setEditing(undefined)} busy={busy}>
      <h2 className="text-lg font-bold text-ink">{editing ? "Sửa khối quản lý" : "Thêm khối quản lý"}</h2>
      <form onSubmit={save} className="space-y-4 text-sm"><fieldset disabled={busy} className="space-y-4">
        <label className="block space-y-1"><span>Tên khối *</span><input required maxLength={100} value={name} onChange={e => setName(e.target.value)} className="min-h-11 w-full rounded-lg border border-edge px-3" /></label>
        <label className="block space-y-1"><span>Thông tin / Ghi chú</span><textarea maxLength={500} value={note} onChange={e => setNote(e.target.value)} className="w-full rounded-lg border border-edge p-3" /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={active} onChange={e => { setActive(e.target.checked); setConfirmed(false); }} />Đang sử dụng</label>
        {editing?.trangThai && !active && <label className="flex items-start gap-2"><input type="checkbox" required checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>Tôi xác nhận ngừng sử dụng khối. Giữ nguyên {editing.unitCount} đơn vị liên kết, dữ liệu và trạng thái tài khoản.</span></label>}
        {saveError && <p role="alert" className="text-danger">{saveError}</p>}
        <div className="flex flex-wrap justify-end gap-3"><button type="button" onClick={() => setEditing(undefined)} className="min-h-11 rounded-lg border border-edge px-4 py-2">Hủy</button>
          <button type="submit" className="min-h-11 rounded-lg bg-brand px-4 py-2 font-semibold text-white">{busy ? "Đang lưu…" : "Lưu khối"}</button></div>
      </fieldset></form>
    </FormDialog>}
  </section>;
}
