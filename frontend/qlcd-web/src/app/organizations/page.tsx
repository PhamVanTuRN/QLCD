"use client";

import { useState, useEffect, useCallback } from "react";
import { getUnionTree, createUnionUnit, updateUnionUnit, deleteUnionUnit, UnionUnitDto, getKhoiChuyenMonApi, KhoiChuyenMonDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { PageHeader } from "@/components/ui-components";

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
  const { user, hasPermission } = useAuth();
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

  const [khoiList, setKhoiList] = useState<KhoiChuyenMonDto[]>([]);
  const [addKhoi, setAddKhoi] = useState("");

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

  useEffect(() => {
    Promise.resolve().then(() => {
      loadTree();
    });
  }, [loadTree]);

  useEffect(() => {
    const loadKhoiList = async () => {
      const data = await getKhoiChuyenMonApi();
      setKhoiList(data);
    };
    loadKhoiList();
  }, []);

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
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi cập nhật tổ chức";
      setEditError(errorMsg);
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
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi xóa tổ chức";
      alert(errorMsg);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "CDCS": return "bg-red-50 text-red-600 border-red-100/60";
      case "CDBP": return "bg-blue-50 text-blue-600 border-blue-100/60";
      case "TO_CD_TRUC_THUOC_CDCS": return "bg-amber-50 text-amber-600 border-amber-100/60";
      default: return "bg-emerald-50 text-emerald-600 border-emerald-100/60";
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
        maParent: selectedNode.id,
        maKhoi: addKhoi || undefined
      });
      setShowAddModal(false);
      setAddName("");
      setAddKhoi("");
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
    setAddKhoi("");
    setAddError("");
    setShowAddModal(true);
  };

  const renderNode = (node: UnionUnitDto) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes[node.id];
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id} className="ml-6 border-l border-slate-200 pl-4 py-1.5 space-y-1.5">
        <div
          onClick={() => setSelectedNode(node)}
          className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
            isSelected
              ? "bg-blue-50 border-blue-300 shadow-xs"
              : node.trangThai === 0
                ? "bg-slate-50/70 border-slate-200 hover:bg-slate-100"
                : "bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-350"
          }`}
        >
          <div className="flex items-center gap-3">
            {hasChildren && (
              <button
                onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                className="w-5 h-5 rounded-md hover:bg-slate-100 text-slate-550 flex items-center justify-center text-xs transition-all cursor-pointer"
              >
                {isExpanded ? "▼" : "▶"}
              </button>
            )}
            {!hasChildren && <span className="w-5" />}
            <span className={`font-semibold text-sm ${
              isSelected ? "text-blue-600" : "text-slate-800"
            } ${node.trangThai === 0 ? "text-slate-400 line-through decoration-slate-300 font-normal" : ""}`}>
              {node.tenDonVi}
              {node.trangThai === 0 && (
                <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50 font-bold ml-1.5 inline-block align-middle">
                  Ngừng HĐ
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getBadgeColor(node.loaiToChuc)}`}>
              Lv.{node.level} • {loaiToChucMap[node.loaiToChuc] || node.loaiToChuc}
            </span>
            <span className="text-xs text-slate-500 font-semibold">({node.soDoanVien} ĐV)</span>
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

  if (!tree) return <div className="text-slate-500 text-xs p-8 font-medium">Đang tải cây tổ chức...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Sơ đồ Cây Tổ chức Công đoàn"
        description={`Quản lý và thiết lập phân cấp 3 cấp theo quy chế BV TWQĐ 108 — vai trò: ${user?.vaiTro}`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Tree */}
        <div className="lg:col-span-2 bg-white border border-slate-150 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cấu trúc phân cấp</span>
            <div className="flex gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 my-auto" />
              <span className="text-[10px] text-slate-500 font-semibold">Tổ CĐ luôn là cấp cuối cùng</span>
            </div>
          </div>
          <div className="-ml-6 max-h-[650px] overflow-auto pr-2 pb-2">
            {renderNode(tree)}
          </div>
        </div>

        {/* Right Detail Panel */}
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs space-y-6">
          {selectedNode ? (
            <>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Chi tiết Đơn vị được chọn</span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{selectedNode.tenDonVi}</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Cấp: Level {selectedNode.level} — {loaiToChucMap[selectedNode.loaiToChuc]}</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-150 flex justify-between text-xs items-center">
                  <span className="text-slate-500 font-medium">Số lượng đoàn viên:</span>
                  <span className="font-semibold text-blue-600">{selectedNode.soDoanVien} (Đếm tự động)</span>
                </div>
                
                {/* Thống kê chi tiết đoàn viên */}
                <div className="p-3.5 bg-slate-50/20 rounded-xl border border-slate-150 text-xs space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cơ cấu đoàn viên (Đệ quy)</span>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
                    <div className="flex justify-between border-r border-slate-150 pr-3">
                      <span className="text-slate-500">Nam:</span>
                      <span className="font-semibold text-blue-600">{selectedNode.soDoanVienNam ?? 0}</span>
                    </div>
                    <div className="flex justify-between pl-1">
                      <span className="text-slate-500">Nữ:</span>
                      <span className="font-semibold text-pink-600">{selectedNode.soDoanVienNu ?? 0}</span>
                    </div>
                    <div className="flex justify-between border-r border-slate-150 pr-3">
                      <span className="text-slate-500">Đảng viên CT:</span>
                      <span className="font-semibold text-red-600">★ {selectedNode.soDoanVienDangVien ?? 0}</span>
                    </div>
                    <div className="flex justify-between pl-1">
                      <span className="text-slate-500">Đảng viên DB:</span>
                      <span className="font-semibold text-rose-500">★ {selectedNode.soDoanVienDangVienDuBi ?? 0}</span>
                    </div>
                    <div className="flex justify-between border-r border-slate-150 pr-3">
                      <span className="text-slate-500">Ngoại ngữ:</span>
                      <span className="font-semibold text-teal-600">🌐 {selectedNode.soCoNgoaiNgu ?? 0}</span>
                    </div>
                    <div className="flex justify-between pl-1">
                      <span className="text-slate-500">Đại học trở lên:</span>
                      <span className="font-semibold text-purple-650">🎓 {selectedNode.soTrinhDoDaiHoc ?? 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-150 flex justify-between text-xs items-center">
                  <span className="text-slate-500 font-medium">Khối chuyên môn:</span>
                  <span className="font-semibold text-blue-650">
                    {khoiList.find(k => k.id === selectedNode.maKhoi)?.tenKhoi || "—"}
                  </span>
                </div>

                <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-150 flex justify-between text-xs items-center">
                  <span className="text-slate-500 font-medium">Đơn vị con:</span>
                  <span className="font-semibold text-slate-700">{selectedNode.children?.length || 0} đơn vị</span>
                </div>
              </div>

              {/* Add child actions & Unit Actions */}
              {hasPermission("Data.ViewAll") ? (
                <>
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Tác vụ Quản lý con</span>

                    {selectedNode.trangThai === 0 ? (
                      <div className="space-y-3">
                        <button disabled className="w-full bg-slate-50 text-slate-400 cursor-not-allowed py-2.5 rounded-xl text-xs font-bold border border-slate-150">
                          🔒 Thêm Tổ chức con (Đã khóa)
                        </button>
                        <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-[10px] text-amber-650 leading-relaxed font-semibold">
                          ⚠️ Đơn vị này đã ngừng hoạt động. Không thể tạo thêm tổ chức con.
                        </div>
                      </div>
                    ) : isLeafNode(selectedNode.loaiToChuc) ? (
                      <div className="space-y-3">
                        <button disabled className="w-full bg-slate-50 text-slate-400 cursor-not-allowed py-2.5 rounded-xl text-xs font-bold border border-slate-150">
                          🔒 Thêm Tổ chức con (Đã khóa)
                        </button>
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-[10px] text-red-650 leading-relaxed font-semibold">
                          ⚠️ Tổ CĐ là đơn vị cuối cùng. Không cho phép tạo cấp con dưới Tổ CĐ.
                        </div>
                      </div>
                    ) : selectedNode.loaiToChuc === "CDCS" ? (
                      <div className="space-y-2">
                        <button onClick={() => openAddModal("CDBP")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
                          ➕ Thêm Công đoàn Bộ phận (Level 2)
                        </button>
                        <button onClick={() => openAddModal("TOCD_TRUC_THUOC")} className="w-full bg-white hover:bg-slate-50 text-slate-700 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 shadow-xs cursor-pointer">
                          ➕ Thêm Tổ CĐ trực thuộc (Level 2)
                        </button>
                      </div>
                    ) : selectedNode.loaiToChuc === "CDBP" ? (
                      <button onClick={() => openAddModal("TOCD_CDBP")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer">
                        ➕ Thêm Tổ CĐ thuộc CĐBP (Level 3)
                      </button>
                    ) : null}
                  </div>

                  {/* Status */}
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Trạng thái</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      selectedNode.trangThai !== 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    }`}>
                      {selectedNode.trangThai !== 0 ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </div>

                  {/* Unit Actions */}
                  <div className="pt-4 border-t border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-3">Tác vụ Đơn vị</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => openEditModal(selectedNode)}
                        className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-800 py-2.5 rounded-xl text-xs font-bold transition-all text-center cursor-pointer"
                      >
                        ✏️ Sửa Đơn vị
                      </button>
                      <button
                        onClick={handleDeleteUnit}
                        disabled={selectedNode.loaiToChuc === "CDCS"}
                        className={`py-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                          selectedNode.loaiToChuc === "CDCS"
                            ? "bg-slate-50 text-slate-400 border-slate-150 cursor-not-allowed"
                            : "bg-red-50 hover:bg-red-100 border-red-100 text-red-600"
                        }`}
                      >
                        🗑️ Xóa Đơn vị
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="pt-4 border-t border-slate-100 text-center py-4 text-slate-450 italic font-semibold text-[11px] bg-slate-50 rounded-xl border border-slate-150/60">
                  🔒 Chỉ Admin hoặc CĐCS mới được chỉnh sửa cơ cấu tổ chức.
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-slate-450 italic font-medium">Bấm chọn một đơn vị để xem chi tiết</div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-150 p-6 rounded-2xl w-full max-w-md space-y-6 shadow-2xl animate-in scale-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-800">Thêm tổ chức công đoàn mới</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tạo {addType === "CDBP" ? "Công đoàn Bộ phận" : "Tổ Công đoàn"} trực thuộc <span className="text-blue-600 font-semibold">{selectedNode?.tenDonVi}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Loại tổ chức</label>
                <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2.5 text-xs text-blue-600 font-bold">
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
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Khối chuyên môn (Hành chính)</label>
                <select
                  value={addKhoi}
                  onChange={(e) => setAddKhoi(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">Chọn Khối chuyên môn...</option>
                  {khoiList.map((k) => (
                    <option key={k.id} value={k.id}>{k.tenKhoi}</option>
                  ))}
                </select>
              </div>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                ⚠️ {addError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer">
                Hủy bỏ
              </button>
              <button
                onClick={handleAddChild}
                disabled={!addName.trim() || isSubmitting}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  addName.trim() && !isSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-150 p-6 rounded-2xl w-full max-w-md space-y-6 shadow-2xl animate-in scale-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-850">Chỉnh sửa thông tin tổ chức</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cập nhật thông tin cho đơn vị <span className="text-blue-600 font-semibold">{selectedNode.tenDonVi}</span>
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
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Khối chuyên môn (Hành chính)</label>
                <select
                  value={editKhoi}
                  onChange={(e) => setEditKhoi(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="">Chọn Khối chuyên môn...</option>
                  {khoiList.map((k) => (
                    <option key={k.id} value={k.id}>{k.tenKhoi}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Trạng thái hoạt động</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(Number(e.target.value))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                >
                  <option value={1}>Đang hoạt động</option>
                  <option value={0}>Ngừng hoạt động</option>
                </select>
              </div>
            </div>

            {editError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                ⚠️ {editError}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleEditUnit}
                disabled={!editName.trim() || isEditSubmitting}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  editName.trim() && !isEditSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
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
