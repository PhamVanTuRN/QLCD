"use client";

import { useState, useEffect, useCallback } from "react";
import { getUnionTree, createUnionUnit, updateUnionUnit, deleteUnionUnit, UnionUnitDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Mock data nếu API trả rỗng
const mockTree: UnionUnitDto = {
  id: "cdcs-108", tenDonVi: "Công đoàn Cơ sở Bệnh viện TWQĐ 108", loaiToChuc: "CDCS", level: 1, maParent: null, maKhoi: null, soDoanVien: 2045, trangThai: 1,
  children: [
    { id: "cdbp-noi", tenDonVi: "Công đoàn bộ phận Khối Nội 1", loaiToChuc: "CDBP", level: 2, maParent: "cdcs-108", maKhoi: null, soDoanVien: 270, trangThai: 1, children: [
      { id: "tcd-tieuhoa", tenDonVi: "Tổ CĐ Khoa Tiêu hóa", loaiToChuc: "TO_CD_THUOC_CDBP", level: 3, maParent: "cdbp-noi", maKhoi: null, soDoanVien: 45, trangThai: 1, children: [] },
      { id: "tcd-tim", tenDonVi: "Tổ CĐ Khoa Tim mạch", loaiToChuc: "TO_CD_THUOC_CDBP", level: 3, maParent: "cdbp-noi", maKhoi: null, soDoanVien: 38, trangThai: 1, children: [] }
    ]},
    { id: "cdbp-ngoai", tenDonVi: "Công đoàn bộ phận Khối Ngoại Chấn thương", loaiToChuc: "CDBP", level: 2, maParent: "cdcs-108", maKhoi: null, soDoanVien: 320, trangThai: 1, children: [
      { id: "tcd-chinhhinh", tenDonVi: "Tổ CĐ Chấn thương chỉnh hình", loaiToChuc: "TO_CD_THUOC_CDBP", level: 3, maParent: "cdbp-ngoai", maKhoi: null, soDoanVien: 60, trangThai: 1, children: [] },
      { id: "tcd-khop", tenDonVi: "Tổ CĐ Khoa Khớp", loaiToChuc: "TO_CD_THUOC_CDBP", level: 3, maParent: "cdbp-ngoai", maKhoi: null, soDoanVien: 42, trangThai: 1, children: [] }
    ]},
    { id: "tcd-tructhuoc1", tenDonVi: "Tổ CĐ trực thuộc CĐCS số 1", loaiToChuc: "TO_CD_TRUC_THUOC_CDCS", level: 2, maParent: "cdcs-108", maKhoi: null, soDoanVien: 25, trangThai: 1, children: [] }
  ]
};

const loaiToChucMap: Record<string, string> = {
  CDCS: "Công đoàn Cơ sở",
  CDBP: "Công đoàn Bộ phận",
  TO_CD_TRUC_THUOC_CDCS: "Tổ CĐ trực thuộc CĐCS",
  TO_CD_THUOC_CDBP: "Tổ CĐ thuộc CĐBP"
};

export default function OrganizationTree() {
  const { user } = useAuth();
  const [tree, setTree] = useState<UnionUnitDto | null>(null);
  const [selectedNode, setSelectedNode] = useState<UnionUnitDto | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [addType, setAddType] = useState<"CDBP" | "TOCD_TRUC_THUOC" | "TOCD_CDBP">("CDBP");
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

  const loadTree = useCallback(async () => {
    const data = await getUnionTree();
    if (data) {
      setTree(data);
      setSelectedNode(data);
      setExpandedNodes({ [data.id]: true });
      // auto-expand level 2
      data.children?.forEach(c => setExpandedNodes(prev => ({ ...prev, [c.id]: true })));
    } else {
      setTree(mockTree);
      setSelectedNode(mockTree);
      setExpandedNodes({ "cdcs-108": true, "cdbp-noi": true, "cdbp-ngoai": true });
    }
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);

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
      // Reload and update selected node
      const updatedNode = { ...selectedNode, tenDonVi: editName.trim(), maKhoi: editKhoi || null, trangThai: Number(editStatus) };
      setSelectedNode(updatedNode);
      await loadTree();
    } catch (err: any) {
      setEditError(err.response?.data?.message || "Lỗi khi cập nhật tổ chức");
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleDeleteUnit = async () => {
    if (!selectedNode) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn vị "${selectedNode.tenDonVi}"?`)) return;
    try {
      await deleteUnionUnit(selectedNode.id);
      setSelectedNode(null);
      await loadTree();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa tổ chức");
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "CDCS": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "CDBP": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "TO_CD_TRUC_THUOC_CDCS": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    }
  };

  const isLeafNode = (type: string) => type === "TO_CD_THUOC_CDBP" || type === "TO_CD_TRUC_THUOC_CDCS";

  const handleAddChild = async () => {
    if (!selectedNode || !addName.trim()) return;
    setIsSubmitting(true);
    setAddError("");

    const loaiMap: Record<string, number> = {
      CDBP: 2,
      TOCD_TRUC_THUOC: 3,
      TOCD_CDBP: 4
    };

    try {
      await createUnionUnit({
        tenDonVi: addName.trim(),
        loaiToChuc: loaiMap[addType],
        maParent: selectedNode.id
      });
      setShowAddModal(false);
      setAddName("");
      await loadTree();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAddError(error?.response?.data?.message || "Lỗi khi tạo tổ chức con");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddModal = (type: "CDBP" | "TOCD_TRUC_THUOC" | "TOCD_CDBP") => {
    setAddType(type);
    setAddName("");
    setAddError("");
    setShowAddModal(true);
  };

  const renderNode = (node: UnionUnitDto) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="ml-6 border-l border-slate-800/80 pl-4 py-1.5 space-y-1.5">
        <div
          onClick={() => setSelectedNode(node)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
            isSelected
              ? "bg-slate-800/80 border-emerald-500 shadow-md shadow-emerald-950/20"
              : "bg-slate-950/20 border-slate-800/60 hover:bg-slate-900 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                className="w-5 h-5 rounded-md hover:bg-slate-800 text-slate-400 flex items-center justify-center text-xs"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            {!hasChildren && <span className="w-5" />}
            <span className="font-semibold text-sm text-slate-100">{node.tenDonVi}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeColor(node.loaiToChuc)}`}>
              Lv.{node.level} • {loaiToChucMap[node.loaiToChuc] || node.loaiToChuc}
            </span>
            <span className="text-xs text-slate-400 font-medium">({node.soDoanVien} ĐV)</span>
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

  if (!tree) return <div className="text-slate-400 text-sm p-8">Đang tải cây tổ chức...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Sơ đồ Cây Tổ chức Công đoàn</h2>
          <p className="text-xs text-slate-400">Quản lý và thiết lập phân cấp 3 cấp theo quy chế BV TWQĐ 108 — Đăng nhập: <span className="text-emerald-400">{user?.vaiTro}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Tree */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800/60">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Cấu trúc phân cấp</span>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 my-auto" />
              <span className="text-[10px] text-slate-400">Tổ CĐ luôn là cấp cuối cùng</span>
            </div>
          </div>
          <div className="-ml-6">{renderNode(tree)}</div>
        </div>

        {/* Right Detail Panel */}
        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md space-y-6">
          {selectedNode && (
            <>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chi tiết Đơn vị được chọn</span>
                <h3 className="text-lg font-bold text-white mt-1">{selectedNode.tenDonVi}</h3>
                <p className="text-xs text-slate-400 mt-1">Cấp: Level {selectedNode.level} — {loaiToChucMap[selectedNode.loaiToChuc]}</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Số lượng đoàn viên:</span>
                  <span className="font-semibold text-emerald-400">{selectedNode.soDoanVien} (Đếm tự động)</span>
                </div>
                
                {/* Thống kê chi tiết đoàn viên */}
                <div className="p-3.5 bg-slate-950/40 rounded-xl border border-slate-800 text-xs space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cơ cấu đoàn viên (Đệ quy)</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div className="flex justify-between border-r border-slate-800/80 pr-3">
                      <span className="text-slate-400">Nam:</span>
                      <span className="font-semibold text-blue-400">{selectedNode.soDoanVienNam ?? 0}</span>
                    </div>
                    <div className="flex justify-between pl-1">
                      <span className="text-slate-400">Nữ:</span>
                      <span className="font-semibold text-pink-400">{selectedNode.soDoanVienNu ?? 0}</span>
                    </div>
                    <div className="flex justify-between border-r border-slate-800/80 pr-3">
                      <span className="text-slate-400">Đảng viên:</span>
                      <span className="font-semibold text-red-400">★ {selectedNode.soDoanVienDangVien ?? 0}</span>
                    </div>
                    <div className="flex justify-between pl-1">
                      <span className="text-slate-400">Ngoại ngữ:</span>
                      <span className="font-semibold text-emerald-400">🌐 {selectedNode.soCoNgoaiNgu ?? 0}</span>
                    </div>
                    <div className="col-span-2 flex justify-between pt-1.5 border-t border-slate-800/80">
                      <span className="text-slate-400">Đại học trở lên:</span>
                      <span className="font-semibold text-purple-400">{selectedNode.soTrinhDoDaiHoc ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between text-xs">
                  <span className="text-slate-400">Đơn vị con:</span>
                  <span className="font-semibold text-slate-200">{selectedNode.children?.length || 0} đơn vị</span>
                </div>
              </div>

              {/* Add child actions */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Tác vụ Quản lý con</span>

                {isLeafNode(selectedNode.loaiToChuc) ? (
                  <div className="space-y-3">
                    <button disabled className="w-full bg-slate-800 text-slate-500 cursor-not-allowed py-2.5 rounded-xl text-xs font-semibold border border-slate-700/50">
                      🔒 Thêm Tổ chức con (Đã khóa)
                    </button>
                    <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-lg text-[10px] text-red-400 leading-relaxed">
                      ⚠️ Tổ CĐ là đơn vị cuối cùng. Không cho phép tạo cấp con dưới Tổ CĐ.
                    </div>
                  </div>
                ) : selectedNode.loaiToChuc === "CDCS" ? (
                  <div className="space-y-2">
                    <button onClick={() => openAddModal("CDBP")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all">
                      ➕ Thêm Công đoàn Bộ phận (Level 2)
                    </button>
                    <button onClick={() => openAddModal("TOCD_TRUC_THUOC")} className="w-full bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-semibold transition-all border border-slate-700">
                      ➕ Thêm Tổ CĐ trực thuộc (Level 2)
                    </button>
                  </div>
                ) : selectedNode.loaiToChuc === "CDBP" ? (
                  <button onClick={() => openAddModal("TOCD_CDBP")} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-xs font-semibold transition-all">
                    ➕ Thêm Tổ CĐ thuộc CĐBP (Level 3)
                  </button>
                ) : null}
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Trạng thái</span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                  Đang hoạt động
                </span>
              </div>

              {/* Unit Actions */}
              <div className="pt-4 border-t border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Tác vụ Đơn vị</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => openEditModal(selectedNode)}
                    className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 py-2.5 rounded-xl text-xs font-semibold transition-all text-center"
                  >
                    ✏️ Sửa Đơn vị
                  </button>
                  <button
                    onClick={handleDeleteUnit}
                    disabled={selectedNode.loaiToChuc === "CDCS"}
                    className={`py-2.5 rounded-xl text-xs font-semibold border transition-all text-center ${
                      selectedNode.loaiToChuc === "CDCS"
                        ? "bg-slate-800 text-slate-500 border-slate-700/50 cursor-not-allowed"
                        : "bg-red-600/10 hover:bg-red-600/20 border-red-500/20 text-red-400"
                    }`}
                  >
                    🗑️ Xóa Đơn vị
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Thêm tổ chức công đoàn mới</h3>
              <p className="text-xs text-slate-400 mt-1">
                Tạo {addType === "CDBP" ? "Công đoàn Bộ phận" : "Tổ Công đoàn"} trực thuộc <span className="text-emerald-400">{selectedNode?.tenDonVi}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Loại tổ chức</label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-emerald-400 font-medium">
                  {addType === "CDBP" ? "Công đoàn Bộ phận (CĐBP)" : addType === "TOCD_TRUC_THUOC" ? "Tổ CĐ trực thuộc CĐCS" : "Tổ CĐ thuộc CĐBP"}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Tên đơn vị *</label>
                <input
                  type="text"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="VD: Công đoàn bộ phận Khối Gây mê Hồi sức"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {addError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                ⚠️ {addError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all">
                Hủy bỏ
              </button>
              <button
                onClick={handleAddChild}
                disabled={!addName.trim() || isSubmitting}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  addName.trim() && !isSubmitting
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                }`}
              >
                {isSubmitting ? "Đang tạo..." : "Xác nhận tạo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedNode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Chỉnh sửa thông tin tổ chức</h3>
              <p className="text-xs text-slate-400 mt-1">
                Cập nhật thông tin cho đơn vị <span className="text-emerald-400 font-semibold">{selectedNode.tenDonVi}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Tên đơn vị *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Nhập tên đơn vị..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Trạng thái hoạt động</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all"
                >
                  <option value={1}>Đang hoạt động</option>
                  <option value={0}>Ngừng hoạt động</option>
                </select>
              </div>
            </div>

            {editError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
                ⚠️ {editError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditUnit}
                disabled={!editName.trim() || isEditSubmitting}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  editName.trim() && !isEditSubmitting
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                }`}
              >
                {isEditSubmitting ? "Đang lưu..." : "Xác nhận lưu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
