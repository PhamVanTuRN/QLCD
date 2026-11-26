"use client";

import useConfirmation from "@/components/useConfirmation";

import FormDialog from "@/components/FormDialog";

import { useCallback, useState } from "react";
import { apiMessage, getUnionTree, createUnionUnit, updateUnionUnit, deleteUnionUnit, getInactiveUnits, restoreUnionUnit, UnionUnitDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

import ListPager from "@/components/ListPager";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import { useResource } from "@/lib/use-resource";
const loaiToChucMap: Record<string, string> = {
  CDCS: "Công đoàn Cơ sở",
  CDBP: "Công đoàn Bộ phận",
  TO_CD_TRUC_THUOC_CDCS: "Tổ CĐ trực thuộc CĐCS",
  TO_CD_THUOC_CDBP: "Tổ CĐ thuộc CĐBP"
};

function findUnit(node: UnionUnitDto | null | undefined, id: string | null): UnionUnitDto | undefined {
  if (!node || !id) return undefined;
  if (node.id === id) return node;
  for (const child of node.children) {
    const match = findUnit(child, id);
    if (match) return match;
  }
}

export default function OrganizationTree() {
  const { confirm, confirmationDialog } = useConfirmation();
  const { user } = useAuth();
  const canManageUnits = user?.role === "ADMIN" || user?.role === "CDCS";
  const { notice, dismiss, showAlert } = useNotice();
  const { data: tree, loading: treeLoading, error: treeError, reload: loadTree } = useResource(getUnionTree);
  const [inactivePage, setInactivePage] = useState(1);
  const readInactive = useCallback((signal: AbortSignal) => canManageUnits
    ? getInactiveUnits(inactivePage, signal) : Promise.resolve({ data: [], hasMore: false }), [canManageUnits, inactivePage]);
  const { data: inactive, loading: inactiveLoading, error: inactiveError, reload: reloadInactive } = useResource(readInactive);
  const [changingUnit, setChangingUnit] = useState(false);

  const restoreUnit = async (id: string, name: string) => {
    if (changingUnit || !await confirm(`Khôi phục đơn vị "${name}" trên cây? Thao tác này không mở khóa tài khoản.`)) return;
    setChangingUnit(true);
    try {
      await restoreUnionUnit(id);
      loadTree(); reloadInactive();
      showAlert("success", "Đã khôi phục đơn vị theo ID cũ. Trạng thái khóa của tài khoản không thay đổi.");
    } catch (err) { showAlert("error", apiMessage(err, "Không thể khôi phục đơn vị.")); }
    finally { setChangingUnit(false); }
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedNode = findUnit(tree, selectedId) ?? tree;
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"CDCS" | "CDBP" | "TOCD_TRUC_THUOC" | "TOCD_CDBP">("CDBP");
  const [addName, setAddName] = useState("");
  const [addError, setAddError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Unit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editKhoi, setEditKhoi] = useState("");
  const [editStatus, setEditStatus] = useState(1);
  const [editError, setEditError] = useState("");
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const openEditModal = (node: UnionUnitDto) => {
    setEditName(node.tenDonVi);
    setEditKhoi(node.maKhoi || "");
    setEditStatus(node.trangThai ?? 1);
    setEditError("");
    setShowEditModal(true);
  };

  const handleEditUnit = async () => {
    if (!selectedNode || !editName.trim()) return;
    setIsEditSubmitting(true);
    setEditError("");
    try {
      await updateUnionUnit(selectedNode.id, {
        id: selectedNode.id,
        tenDonVi: editName.trim(),
        maKhoi: editKhoi || null,
        trangThai: Number(editStatus)
      });
      setShowEditModal(false);
      loadTree();
      showAlert("success", "Đã cập nhật đơn vị.");
    } catch (err) {
      setEditError(apiMessage(err, "Lỗi khi cập nhật tổ chức"));
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedNode || changingUnit) return;
    if (!await confirm(`Ngừng hoạt động và ẩn đơn vị "${selectedNode.tenDonVi}" khỏi cây? Giữ toàn bộ dữ liệu, quan hệ và tài khoản. Các tài khoản liên quan sẽ bị chặn truy cập do đơn vị ngừng hoạt động, không đổi cờ khóa riêng. Đơn vị còn đơn vị con sẽ bị từ chối.`)) return;
    setChangingUnit(true);
    try {
      await deleteUnionUnit(selectedNode.id);
      setSelectedId(null);
      loadTree(); reloadInactive();
      showAlert("success", "Đã ngừng hoạt động đơn vị. Tài khoản vẫn còn trong danh sách, bị chặn truy cập do đơn vị; mọi dữ liệu và quan hệ được giữ nguyên.");
    } catch (err) {
      showAlert("error", apiMessage(err, "Không thể ngừng hoạt động đơn vị"));
    } finally { setChangingUnit(false); }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "CDCS": return "bg-danger-soft text-danger border-danger-line";
      case "CDBP": return "bg-brand-soft text-brand border-brand-line";
      case "TO_CD_TRUC_THUOC_CDCS": return "bg-gold-soft text-gold-ink border-gold-line";
      default: return "bg-brand-soft text-brand border-brand-line";
    }
  };

  const isLeafNode = (type: string) => type === "TO_CD_THUOC_CDBP" || type === "TO_CD_TRUC_THUOC_CDCS";

  const handleAddChild = async () => {
    if ((addType !== "CDCS" && !selectedNode) || !addName.trim()) return;
    setIsSubmitting(true);
    setAddError("");

    const loaiMap = {
      CDCS: "CDCS",
      CDBP: "CDBP",
      TOCD_TRUC_THUOC: "TO_CD_TRUC_THUOC_CDCS",
      TOCD_CDBP: "TO_CD_THUOC_CDBP"
    } as const;

    try {
      await createUnionUnit({
        tenDonVi: addName,
        loaiToChuc: loaiMap[addType],
        maParent: selectedNode?.id
      });
      setShowAddModal(false);
      showAlert("success", "Đã tạo đơn vị và tài khoản quản lý ở trạng thái khóa. Vào Tài khoản để xem tên đăng nhập, mật khẩu khởi tạo và cấp mã kích hoạt sau khi xác minh danh tính.");
      setAddName("");
      loadTree();
    } catch (err: unknown) {
      setAddError(apiMessage(err, "Lỗi khi tạo tổ chức con"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = (type: "CDCS" | "CDBP" | "TOCD_TRUC_THUOC" | "TOCD_CDBP") => {
    setAddType(type);
    setAddName("");
    setAddError("");
    setShowAddModal(true);
  };

  const renderNode = (node: UnionUnitDto) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id] ?? node.level <= 2;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="ml-2 space-y-1.5 border-l border-line py-1.5 pl-2 sm:ml-4 sm:pl-3">
        <div
          className={`flex min-w-0 flex-col items-start gap-2 rounded-xl border p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3 ${
            isSelected
              ? "border-brand bg-brand-soft"
              : "border-line bg-surface hover:border-brand-line hover:bg-soft"
          }`}
        >
          <div className="flex min-w-0 items-center gap-2">
            {hasChildren && (
              <button
                type="button" aria-expanded={isExpanded} aria-label={`${isExpanded ? "Thu gọn" : "Mở rộng"} ${node.tenDonVi}`}
                onClick={() => setExpandedNodes(current => ({ ...current, [node.id]: !isExpanded }))}
                className="size-7 shrink-0 rounded-md hover:bg-soft text-muted flex items-center justify-center text-xs"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            {!hasChildren && <span className="w-5" />}
            <button type="button" onClick={() => setSelectedId(node.id)} aria-pressed={isSelected}
              className="min-w-0 break-words text-left text-sm font-semibold text-ink hover:underline">{node.tenDonVi}</button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeColor(node.loaiToChuc)}`}>
              Lv.{node.level} • {loaiToChucMap[node.loaiToChuc] || node.loaiToChuc}
            </span>
            <span className="text-xs text-muted font-medium">({node.soDoanVien} ĐV)</span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  if (treeLoading) return <LoadState loading />;
  if (treeError) return <LoadState message="Không thể tải cây tổ chức." retry={loadTree} />;

  return (
    <div className="space-y-6">
      {confirmationDialog}
      <Notice value={notice} dismiss={dismiss} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Cây tổ chức công đoàn</h1>
          <p className="mt-1 text-sm text-muted">CĐBP có thể có hoặc không có tổ. Tổ có thể trực thuộc CĐCS hoặc CĐBP.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-3">
        {/* Left Tree */}
        <div className="panel p-4 sm:p-6 xl:col-span-2">
          <div className="mb-4 border-b border-line pb-3">
            <h2 className="text-base font-bold text-ink">Cấu trúc phân cấp</h2>
          </div>
          <div className="-ml-2 sm:-ml-4">{tree ? renderNode(tree) : (
            <div className="ml-6 space-y-3 text-sm text-muted">
              <p>Chưa có đơn vị trong phạm vi này.</p>
              {user?.role === "ADMIN" &&
                <button type="button" onClick={() => openAddModal("CDCS")} className="rounded bg-brand-hover px-3 py-2 text-white">Tạo Công đoàn cơ sở</button>}
            </div>
          )}</div>
        </div>

        {/* Right Detail Panel */}
        <div className="panel space-y-6 p-4 sm:p-6">
          {selectedNode && (
            <>
              <div>
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Chi tiết Đơn vị được chọn</span>
                <h3 className="text-lg font-bold text-ink mt-1">{selectedNode.tenDonVi}</h3>
                <p className="text-xs text-muted mt-1">Cấp: Level {selectedNode.level} — {loaiToChucMap[selectedNode.loaiToChuc]}</p>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap justify-between gap-2 rounded-xl border border-line bg-soft p-3 text-xs">
                  <span className="text-muted">Số lượng đoàn viên:</span>
                  <span className="font-semibold text-brand">{selectedNode.soDoanVien} (Đếm tự động)</span>
                </div>
                
                {/* Thống kê chi tiết đoàn viên */}
                <div className="p-3.5 bg-surface rounded-xl border border-line text-xs space-y-2.5">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Cơ cấu đoàn viên (Đệ quy)</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div className="flex justify-between border-r border-line pr-3">
                      <span className="text-muted">Nam:</span>
                      <span className="font-semibold text-brand">{selectedNode.soDoanVienNam ?? 0}</span>
                    </div>
                    <div className="flex justify-between pl-1">
                      <span className="text-muted">Nữ:</span>
                      <span className="font-semibold text-danger">{selectedNode.soDoanVienNu ?? 0}</span>
                    </div>
                    <div className="flex justify-between border-r border-line pr-3">
                      <span className="text-muted">Đảng viên:</span>
                      <span className="font-semibold text-danger">★ {selectedNode.soDoanVienDangVien ?? 0}</span>
                    </div>
                    <div className="flex justify-between pl-1">
                      <span className="text-muted">Ngoại ngữ:</span>
                      <span className="font-semibold text-brand">🌐 {selectedNode.soCoNgoaiNgu ?? 0}</span>
                    </div>
                    <div className="col-span-2 flex justify-between pt-1.5 border-t border-line">
                      <span className="text-muted">Đại học trở lên:</span>
                      <span className="font-semibold text-violet-ink">{selectedNode.soTrinhDoDaiHoc ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-soft rounded-xl border border-line flex justify-between text-xs">
                  <span className="text-muted">{selectedNode.loaiToChuc === "CDBP" ? "Tổ trực thuộc" : "Đơn vị trực thuộc"}</span>
                  <span className="font-semibold text-ink">
                    {selectedNode.loaiToChuc === "CDBP"
                      ? selectedNode.children.length === 0 ? "Chưa có tổ công đoàn" : `${selectedNode.children.length} tổ`
                      : `${selectedNode.children.length} đơn vị`}
                  </span>
                </div>
              </div>

              {/* Add child actions */}
              {canManageUnits && !isLeafNode(selectedNode.loaiToChuc) && <div className="pt-4 border-t border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-3">Thêm đơn vị trực thuộc</span>

                {selectedNode.loaiToChuc === "CDCS" ? (
                  <div className="space-y-2">
                    <button onClick={() => openAddModal("CDBP")} className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-xs font-semibold transition-all">
                      Thêm Công đoàn Bộ phận
                    </button>
                    <button onClick={() => openAddModal("TOCD_TRUC_THUOC")} className="w-full bg-soft hover:bg-soft-strong text-ink py-2.5 rounded-xl text-xs font-semibold transition-all border border-line">
                      Thêm tổ trực thuộc CĐCS
                    </button>
                  </div>
                ) : selectedNode.loaiToChuc === "CDBP" ? (
                  <button onClick={() => openAddModal("TOCD_CDBP")} className="w-full bg-brand hover:bg-brand-hover text-white py-2.5 rounded-xl text-xs font-semibold transition-all">
                    Thêm tổ thuộc CĐBP
                  </button>
                ) : null}
              </div>}

              {/* Status */}
              <div className="pt-4 border-t border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Trạng thái</span>
                <span className={`rounded px-2.5 py-1 text-xs font-semibold ${selectedNode.trangThai === 1
                  ? "bg-brand-soft text-brand-hover" : "bg-soft-strong text-ink"}`}>
                  {selectedNode.trangThai === 1 ? "Đang hoạt động" : "Ngừng hoạt động"}
                </span>
              </div>

              {/* Unit Actions */}
              <div className="pt-4 border-t border-line">
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-3">Tác vụ Đơn vị</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditModal(selectedNode)}
                    className="bg-brand-soft hover:bg-soft-strong border border-brand-line text-brand py-2.5 rounded-xl text-xs font-semibold transition-all text-center"
                  >
                    ✏️ Sửa Đơn vị
                  </button>
                  <button
                    onClick={handleDeleteUnit}
                    disabled={selectedNode.loaiToChuc === "CDCS" || selectedNode.children.length > 0 || changingUnit}
                    title={selectedNode.children.length ? "Đơn vị còn đơn vị con. Không tự động ngừng các đơn vị con." : "Ngừng hoạt động, giữ nguyên dữ liệu và tài khoản"}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all text-center disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedNode.loaiToChuc === "CDCS"
                        ? "bg-soft text-muted border-line cursor-not-allowed"
                        : "bg-danger-soft hover:bg-danger-line border-danger-line text-danger"
                    }`}
                  >
                    Ngừng hoạt động / Ẩn khỏi cây
                  </button>
                  <p className="col-span-2 text-xs text-muted">Không áp dụng cho Công đoàn cơ sở hoặc đơn vị còn đơn vị con, kể cả con đã ngừng/lưu trữ. Dữ liệu và tài khoản không bị xóa.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {canManageUnits && <section className="panel space-y-4 p-4 sm:p-6" aria-label="Đơn vị ngừng hoạt động">
        <h2 className="text-lg font-bold text-ink">Đơn vị ngừng hoạt động / Lưu trữ cũ</h2>
        <p className="text-sm text-muted">Khôi phục đơn vị riêng tại đây. Mở khóa tài khoản không làm đơn vị xuất hiện lại; khôi phục đơn vị không mở khóa tài khoản. Đơn vị con phải khôi phục sau đơn vị cha.</p>
        {inactiveLoading || inactiveError ? <LoadState loading={inactiveLoading} retry={reloadInactive} /> :
          <ul className="divide-y divide-line">{inactive?.data.map(unit => <li key={unit.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0"><p className="break-words font-semibold text-ink">{unit.tenDonVi}</p>
              <p className="text-sm text-muted">{unit.parentName ? `Đơn vị cha: ${unit.parentName}` : unit.maParent ? "Đơn vị cha không khả dụng" : "Đơn vị gốc"} · {unit.legacyDeleted ? "Đã ẩn theo luồng cũ" : "Ngừng hoạt động hoặc bị chặn do đơn vị cha"}</p>
            </div>
            <button type="button" disabled={changingUnit || !unit.canRestore} onClick={() => restoreUnit(unit.id, unit.tenDonVi)}
              className="min-h-11 rounded-lg border border-brand-line bg-brand-soft px-4 py-2 font-semibold text-brand disabled:opacity-50">Khôi phục đơn vị</button>
          </li>)}</ul>}
        {!inactiveLoading && !inactiveError && !inactive?.data.length && <p className="text-sm text-muted">Không có đơn vị ngừng hoạt động.</p>}
        <ListPager page={inactivePage} hasMore={inactive?.hasMore ?? false} loading={inactiveLoading} onChange={setInactivePage} />
      </section>}

      {/* Add Modal */}
      {showAddModal && (
        <FormDialog label="Thêm đơn vị" onClose={() => { setShowAddModal(false); dismiss(); }} busy={isSubmitting}>
            <div>
              <h3 className="text-base font-bold text-ink">Thêm tổ chức công đoàn mới</h3>
              <p className="text-xs text-muted mt-1">
                {addType === "CDCS" ? "Tạo Công đoàn cơ sở" : `Tạo đơn vị trực thuộc ${selectedNode?.tenDonVi ?? ""}`}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Loại tổ chức</label>
                <div className="bg-surface border border-line rounded-xl px-4 py-2.5 text-sm text-brand font-medium">
                  {addType === "CDCS" ? "Công đoàn cơ sở" : addType === "CDBP" ? "Công đoàn Bộ phận (CĐBP)" : addType === "TOCD_TRUC_THUOC" ? "Tổ CĐ trực thuộc CĐCS" : "Tổ CĐ thuộc CĐBP"}
                </div>
              </div>
              <div>
                <label htmlFor="organizations-field-1" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Tên đơn vị *</label>
                <input id="organizations-field-1"
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="VD: Công đoàn bộ phận Khối Gây mê Hồi sức"
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-brand transition-all"
                />
              </div>
            </div>

            {addError && (
              <div className="p-3 bg-danger-soft border border-danger-line rounded-xl text-xs text-danger">
                ⚠️ {addError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowAddModal(false); dismiss(); }} disabled={isSubmitting} className="bg-soft hover:bg-soft-strong text-copy text-xs font-semibold px-4 py-2 rounded-xl border border-line transition-all">
                Hủy bỏ
              </button>
              <button
                onClick={handleAddChild}
                disabled={!addName.trim() || isSubmitting}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  addName.trim() && !isSubmitting
                    ? "bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand-strong/20"
                    : "bg-soft text-muted cursor-not-allowed border border-line"
                }`}
              >
                {isSubmitting ? "Đang tạo..." : "Xác nhận tạo"}
              </button>
            </div>
        </FormDialog>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedNode && (
        <FormDialog label="Sửa đơn vị" onClose={() => { setShowEditModal(false); dismiss(); }} busy={isEditSubmitting}>
            <div>
              <h3 className="text-base font-bold text-ink">Chỉnh sửa thông tin tổ chức</h3>
              <p className="text-xs text-muted mt-1">
                Cập nhật thông tin cho đơn vị <span className="text-brand font-semibold">{selectedNode.tenDonVi}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="organizations-field-2" className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-2">Tên đơn vị *</label>
                <input id="organizations-field-2"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nhập tên đơn vị..."
                  className="w-full bg-surface border border-line rounded-xl px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-brand transition-all"
                />
              </div>

              <p className="text-sm text-muted">Sửa thông tin không thay đổi trạng thái. Dùng Ngừng hoạt động hoặc Khôi phục đơn vị ở các khu vực riêng.</p>
            </div>

            {editError && (
              <div className="p-3 bg-danger-soft border border-danger-line rounded-xl text-xs text-danger">
                ⚠️ {editError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowEditModal(false); dismiss(); }} disabled={isEditSubmitting}
                className="bg-soft hover:bg-soft-strong text-copy text-xs font-semibold px-4 py-2 rounded-xl border border-line transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditUnit}
                disabled={!editName.trim() || isEditSubmitting}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  editName.trim() && !isEditSubmitting
                    ? "bg-brand hover:bg-brand-hover text-white shadow-md shadow-brand-strong/20"
                    : "bg-soft text-muted cursor-not-allowed border border-line"
                }`}
              >
                {isEditSubmitting ? "Đang lưu..." : "Xác nhận lưu"}
              </button>
            </div>
        </FormDialog>
      )}
    </div>
  );
}
