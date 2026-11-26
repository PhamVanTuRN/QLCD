"use client";

import DataTable from "@/components/DataTable";

import useConfirmation from "@/components/useConfirmation";

import FormDialog from "@/components/FormDialog";

import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import MemberCreateDialog from "@/components/MemberCreateDialog";
import { useResource } from "@/lib/use-resource";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import { ArrowLeftRight, Pencil, Plus, Trash2 } from "lucide-react";
import { apiMessage, getMembers, transferMember, deleteMemberApi, getUnionTree, UnionMemberDto, UnionUnitDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import EvidenceUpload from "@/components/EvidenceUpload";

const vaiTroLabels: Record<string, string> = {
  DoanVien: "Đoàn viên", ToTruong: "Tổ trưởng", ChuTichCDBP: "CT CĐBP",
  PhoChuTichCDBP: "Phó CT CĐBP", ChuTichCDCS: "CT CĐCS", PhoChuTichCDCS: "Phó CT CĐCS", UyVienBCH: "UV BCH"
};
const trangThaiLabels: Record<string, string> = {
  DangSinhHoat: "Đang sinh hoạt", ChuyenDi: "Chuyển đi", NghiHuu: "Nghỉ hưu",
  RaKhoiCongDoan: "Ra khỏi CĐ", TamDung: "Tạm dừng", KhoiPhuc: "Khôi phục"
};

function collectGroups(node: UnionUnitDto, parent?: UnionUnitDto): {
  id: string; name: string; activeTeam: boolean; canReceiveMembers: boolean;
}[] {
  const isTeam = node.loaiToChuc === "TO_CD_TRUC_THUOC_CDCS" || node.loaiToChuc === "TO_CD_THUOC_CDBP";
  const activeTeam = isTeam && node.trangThai === 1;
  const label = isTeam ? "Tổ CĐ" : node.loaiToChuc === "CDCS" ? "CĐCS" : "CĐBP";
  const parentName = isTeam && parent ? ` — ${parent.tenDonVi}` : "";
  return [
    { id: node.id, name: `[${label}] ${node.tenDonVi}${parentName}`, activeTeam,
      canReceiveMembers: node.coTheTiepNhanDoanVien ?? activeTeam },
    ...node.children.flatMap(child => collectGroups(child, node)),
  ];
}

export default function MembersList() {
  const { confirm, confirmationDialog } = useConfirmation();
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [createdMemberId, setCreatedMemberId] = useState<string | null>(null);

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeMember, setActiveMember] = useState<UnionMemberDto | null>(null);
  const [targetGroup, setTargetGroup] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferFileMinhChungUrl, setTransferFileMinhChungUrl] = useState("");

  const { notice, dismiss, showAlert } = useNotice();
  const [transferring, setTransferring] = useState(false);
  const canTransfer = user?.role !== "TOCD";
  const canDelete = user?.role === "ADMIN" || user?.role === "CDCS";
  const readMembers = useCallback((signal: AbortSignal) => getMembers({
    page, pageSize, search: searchTerm.trim() || undefined,
    toCongDoanId: selectedGroup || undefined,
    vaiTro: selectedRole || undefined,
    trangThai: selectedStatus || undefined,
  }, signal), [page, pageSize, searchTerm, selectedGroup, selectedRole, selectedStatus]);
  const { data: result, error: memberLoadError, loading, reload: loadMembers } = useResource(readMembers, searchTerm ? 200 : 0);
  const members = result?.items ?? [];
  const totalCount = result?.totalCount ?? 0;
  const { data: tree, loading: treeLoading, error: treeError, reload: reloadTree } = useResource(getUnionTree);
  const groups = tree ? collectGroups(tree) : [];
  const teamGroups = groups.filter(group => group.activeTeam);

  function memberCreated(id: string) {
    setCreatedMemberId(id);
    setShowAddModal(false);
    loadMembers();
  }

  const handleTransfer = async () => {
    if (transferring || !activeMember || !targetGroup || !transferReason.trim()) return;
    setTransferring(true);
    dismiss();
    try {
      await transferMember(activeMember.id, {
        denToCongDoanId: targetGroup,
        lyDo: transferReason,
        ngayHieuLuc: new Date().toISOString(),
        fileMinhChungUrl: transferFileMinhChungUrl || undefined
      });
      showAlert("success", "Chuyển sinh hoạt thành công.");
      setShowTransferModal(false);
      setActiveMember(null);
      setTargetGroup("");
      setTransferReason("");
      setTransferFileMinhChungUrl("");
      await loadMembers();
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi khi chuyển sinh hoạt"));
    } finally {
      setTransferring(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!await confirm(`Bạn có chắc chắn muốn xóa đoàn viên "${name}" khỏi hệ thống?`)) return;
    try {
      await deleteMemberApi(id);
      showAlert("success", "Đã xóa đoàn viên.");
      if (members.length === 1 && page > 1) setPage(page - 1);
      else loadMembers();
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi khi xóa đoàn viên"));
    }
  };

  return (
    <div className="space-y-6">
      {confirmationDialog}
      <Notice value={notice} dismiss={dismiss} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Hồ sơ đoàn viên</h1>
          <p className="mt-1 text-sm text-muted">Tra cứu hồ sơ và theo dõi chuyển sinh hoạt công đoàn.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button" onClick={() => setShowAddModal(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-hover"
          >
            <Plus size={18} aria-hidden="true" /> Thêm Đoàn viên mới
          </button>
        </div>
      </div>

      {createdMemberId && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-success-line bg-success-soft px-4 py-3 text-sm">
          <p role="status" className="text-success">Đã thêm đoàn viên.</p>
          <Link href={`/members/${createdMemberId}`} className="font-semibold text-brand-strong underline">Xem hồ sơ vừa thêm</Link>
          <button type="button" onClick={() => setCreatedMemberId(null)} className="ml-auto rounded px-2 py-1 text-copy">Đóng</button>
        </div>
      )}

      {/* Filter panel */}
      <div className="panel grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <div>
          <label htmlFor="members-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Tìm kiếm nhanh</label>
          <input id="members-field-1"
            type="text" placeholder="Họ tên hoặc mã nhân viên" maxLength={100}
            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-all placeholder:text-muted"
          />
        </div>
        <div>
          <label htmlFor="members-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Đơn vị Công đoàn</label>
          <select id="members-field-2" value={selectedGroup} onChange={e => { setSelectedGroup(e.target.value); setPage(1); }}
            className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-all">
            <option value="">Tất cả Đơn vị</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="members-field-3" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Vai trò công đoàn</label>
          <select id="members-field-3" value={selectedRole} onChange={e => { setSelectedRole(e.target.value); setPage(1); }}
            className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-all">
            <option value="">Tất cả vai trò</option>
            {Object.entries(vaiTroLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="members-field-4" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Trạng thái</label>
          <select id="members-field-4" value={selectedStatus} onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
            className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-all">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(trangThaiLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Members table */}
      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line px-4 py-3.5 sm:px-6">
          <h2 className="text-sm font-bold text-ink">Danh sách đoàn viên</h2>
          <label className="ml-auto flex items-center gap-2 text-sm text-copy">
            Số dòng / trang
            <select aria-label="Số dòng mỗi trang" value={pageSize} className="min-h-11 rounded-lg border border-edge bg-surface px-2"
              onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>
              {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-semibold text-brand-strong">{totalCount} hồ sơ</span>
        </div>
        <DataTable label="Bảng đoàn viên" footer={<ListPager totalCount={result?.totalCount} pageSize={result?.pageSize} page={page} hasMore={page * (result?.pageSize ?? 50) < totalCount} loading={loading} onChange={setPage} />}>
          <table className="w-full min-w-[55rem] border-collapse text-left text-sm">
            <thead className="bg-soft">
              <tr className="border-b border-line font-semibold text-copy">
                <th scope="col" className="px-6 py-3.5">Họ và Tên</th>
                <th scope="col" className="px-6 py-3.5">Mã NV / CCCD</th>
                <th scope="col" className="px-6 py-3.5">Đơn vị sinh hoạt</th>
                <th scope="col" className="px-6 py-3.5">Chức vụ / Đơn vị</th>
                <th scope="col" className="px-6 py-3.5">Vai trò CĐ</th>
                <th scope="col" className="px-6 py-3.5">Trạng thái</th>
                <th scope="col" className="px-6 py-3.5 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-copy">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-soft transition-all">
                  <td className="px-6 py-4">
                    <Link href={`/members/${m.id}`} className="font-semibold text-brand hover:text-brand-hover hover:underline">
                      {m.hoTen}
                    </Link>
                    <div className="text-[10px] text-muted mt-0.5">
                      {m.dangVien && <span className="text-danger mr-2">★ Đảng viên</span>}
                      {m.gioiTinh === 0 ? "Nữ" : "Nam"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{m.maNhanVien}</div>
                    <div className="text-[10px] text-muted">{m.soCCCD}</div>
                  </td>
                  <td className="px-6 py-4 text-muted font-semibold">{m.tenToCongDoan}</td>
                  <td className="px-6 py-4">
                    <div>{m.chucVu || "—"}</div>
                    <div className="text-[10px] text-muted">{m.donViCongTac || ""}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-soft px-2 py-0.5 rounded border border-line text-copy">
                      {vaiTroLabels[m.vaiTro] || m.vaiTro}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      m.trangThai === "DangSinhHoat"
                        ? "bg-success-soft text-success border-success-line"
                        : "bg-gold-soft text-gold-ink border-gold-line"
                    }`}>
                      {trangThaiLabels[m.trangThai] || m.trangThai}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/members/${m.id}?edit=true`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-brand-line bg-brand-soft px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-brand hover:bg-soft-strong"
                      >
                        <Pencil size={14} aria-hidden="true" /> Sửa
                      </Link>
                      {canTransfer && (
                        <button
                          onClick={() => { setActiveMember(m); setTargetGroup(""); setTransferReason(""); setTransferFileMinhChungUrl(""); dismiss(); setShowTransferModal(true); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-soft px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-ink hover:bg-soft-strong"
                        >
                          <ArrowLeftRight size={14} aria-hidden="true" /> Điều động
                        </button>
                      )}
                      {canDelete && (
                      <button
                        onClick={() => handleDeleteMember(m.id, m.hoTen)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-danger-line bg-danger-soft px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-danger hover:bg-danger-line"
                      >
                        <Trash2 size={14} aria-hidden="true" /> Xóa
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {loading || memberLoadError ? <tr><td colSpan={7}><LoadState loading={loading} retry={loadMembers} /></td></tr> : members.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted">Không có dữ liệu đoàn viên</td></tr>
              )}
            </tbody>
          </table>
        </DataTable>
      </div>

      {Boolean(treeError) && <LoadState message="Không thể tải danh sách tổ công đoàn." retry={reloadTree} />}

      {showAddModal && <MemberCreateDialog
        units={groups.filter(group => group.canReceiveMembers)}
        defaultUnitId={user?.donViId}
        loadingUnits={treeLoading}
        unitLoadFailed={Boolean(treeError)}
        reloadUnits={reloadTree}
        canManageTeams={user?.role === "ADMIN" || user?.role === "CDCS"}
        onCreated={memberCreated}
        onClose={() => setShowAddModal(false)}
      />}

      {/* Transfer Modal */}
      {showTransferModal && activeMember && (
        <FormDialog label="Chuyển sinh hoạt" onClose={() => { setShowTransferModal(false); dismiss(); }} busy={transferring}>
          {notice?.type === "error" && <Notice value={notice} dismiss={dismiss} />}
            <div>
              <h3 className="text-base font-bold text-ink">Chuyển sinh hoạt công đoàn</h3>
              <p className="text-xs text-muted mt-1">Điều động đoàn viên <span className="text-brand font-semibold">{activeMember.hoTen}</span> sang tổ CĐ mới.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="members-field-19" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Tổ CĐ đích</label>
                <select id="members-field-19" value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-all">
                  <option value="">Chọn tổ CĐ đích...</option>
                  {teamGroups.filter(g => g.id !== activeMember.maToCongDoan).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="members-field-20" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Lý do điều động</label>
                <textarea id="members-field-20" rows={3} value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Nhập lý do điều động..."
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2 text-sm text-ink focus:outline-none focus:border-brand transition-all resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Quyết định/Minh chứng điều chuyển (PDF)</label>
                <EvidenceUpload
                  fileId={transferFileMinhChungUrl}
                  onChange={(fileId) => setTransferFileMinhChungUrl(fileId || "")}
                  moduleName="Members"
                  organizationId={activeMember.maToCongDoan || user?.donViId || ""}
                />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowTransferModal(false); setActiveMember(null); setTransferFileMinhChungUrl(""); }}
                className="bg-soft hover:bg-soft-strong text-copy text-xs font-semibold px-4 py-2 rounded-xl border border-line transition-all">Hủy bỏ</button>
              <button onClick={handleTransfer} disabled={transferring || !targetGroup || !transferReason.trim()}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  targetGroup && transferReason ? "bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand-strong/20" : "bg-soft text-muted cursor-not-allowed border border-line"
                }`}>Xác nhận chuyển</button>
            </div>
        </FormDialog>
      )}
    </div>
  );
}
