"use client";

import { useState, useEffect, useCallback } from "react";
import { getMembers, createMember, transferMember, deleteMemberApi, getUnionTree, getCatalogsApi, CatalogDto, UnionMemberDto, UnionUnitDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

// Mock data khi API trả rỗng
const mockMembers: UnionMemberDto[] = [
  { id: "m1", hoTen: "Trần Quốc Toản", maNhanVien: "NV-0042", soCCCD: "001095001234", ngaySinh: "1990-03-15", gioiTinh: 1, chucVu: "Phó khoa", donViCongTac: "Khoa Tiêu hóa", chucDanhChuyenMon: "Bác sĩ", maToCongDoan: "tcd-tieuhoa", tenToCongDoan: "Tổ CĐ Khoa Tiêu hóa", vaiTro: "DoanVien", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2015-06-01", dangVien: true, dienThoai: "0912345678", email: "toan.tq@bv108.vn", trinhDoHocVan: "Thạc sĩ" },
  { id: "m2", hoTen: "Nguyễn Thị Định", maNhanVien: "NV-0281", soCCCD: "001097004321", ngaySinh: "1992-08-20", gioiTinh: 0, chucVu: "Điều dưỡng trưởng", donViCongTac: "Khoa Tiêu hóa", chucDanhChuyenMon: "Điều dưỡng", maToCongDoan: "tcd-tieuhoa", tenToCongDoan: "Tổ CĐ Khoa Tiêu hóa", vaiTro: "ToTruong", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2016-01-15", dangVien: false, dienThoai: "0923456789", email: "dinh.nt@bv108.vn", trinhDoHocVan: "Đại học" },
  { id: "m3", hoTen: "Phạm Hùng", maNhanVien: "NV-0985", soCCCD: "002094002345", ngaySinh: "1985-12-10", gioiTinh: 1, chucVu: "Trưởng khoa", donViCongTac: "Khoa Tim mạch", chucDanhChuyenMon: "Bác sĩ", maToCongDoan: "tcd-tim", tenToCongDoan: "Tổ CĐ Khoa Tim mạch", vaiTro: "UyVienBCH", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2010-09-01", dangVien: true, dienThoai: "0934567890", email: "hung.p@bv108.vn", trinhDoHocVan: "Tiến sĩ" },
  { id: "m4", hoTen: "Hoàng Văn Thái", maNhanVien: "NV-0120", soCCCD: "003096009876", ngaySinh: "1988-05-25", gioiTinh: 1, chucVu: "Dược sĩ trưởng", donViCongTac: "Khoa Dược", chucDanhChuyenMon: "Dược sĩ", maToCongDoan: "tcd-tructhuoc1", tenToCongDoan: "Tổ CĐ trực thuộc CĐCS số 1", vaiTro: "ToTruong", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2014-03-01", dangVien: true, dienThoai: "0945678901", email: "thai.hv@bv108.vn", trinhDoHocVan: "Thạc sĩ" },
  { id: "m5", hoTen: "Bùi Thị Xuân", maNhanVien: "NV-1209", soCCCD: "004098006543", ngaySinh: "1995-11-30", gioiTinh: 0, chucVu: "Điều dưỡng", donViCongTac: "Khoa Khớp", chucDanhChuyenMon: "Điều dưỡng", maToCongDoan: "tcd-khop", tenToCongDoan: "Tổ CĐ Khoa Khớp", vaiTro: "DoanVien", trangThai: "TamDung", ngayVaoCongDoan: "2019-07-15", dangVien: false, dienThoai: "0956789012", email: "xuan.bt@bv108.vn", trinhDoHocVan: "Đại học" },
];

const vaiTroLabels: Record<string, string> = {
  DoanVien: "Đoàn viên", ToTruong: "Tổ trưởng", ChuTichCDBP: "CT CĐBP",
  PhoChuTichCDBP: "Phó CT CĐBP", ChuTichCDCS: "CT CĐCS", PhoChuTichCDCS: "Phó CT CĐCS", UyVienBCH: "UV BCH"
};
const trangThaiLabels: Record<string, string> = {
  DangSinhHoat: "Đang sinh hoạt", ChuyenDi: "Chuyển đi", NghiHuu: "Nghỉ hưu",
  RaKhoiCongDoan: "Ra khỏi CĐ", TamDung: "Tạm dừng", KhoiPhuc: "Khôi phục"
};

const mapVaiTroEnumToString = (val: number): string => {
  switch (val) {
    case 1: return "DoanVien";
    case 2: return "ToTruong";
    case 3: return "ChuTichCDBP";
    case 4: return "PhoChuTichCDBP";
    case 5: return "ChuTichCDCS";
    case 6: return "PhoChuTichCDCS";
    case 7: return "UyVienBCH";
    default: return "DoanVien";
  }
};

const mapLoaiCanBoEnumToString = (val: number): string => {
  switch (val) {
    case 1: return "SiQuan";
    case 2: return "QuanNhanChuyenNghiep";
    case 3: return "CongNhanVienChucQuocPhong";
    case 4: return "LaoDongHopDong";
    case 5: return "Khac";
    default: return "SiQuan";
  }
};

// Thu thập tất cả các đơn vị công đoàn (CĐCS, CĐBP, Tổ CĐ) từ cây tổ chức
function collectGroups(node: UnionUnitDto): { id: string; name: string }[] {
  let result: { id: string; name: string }[] = [];
  
  let prefix = "";
  if (node.loaiToChuc === "CDCS") prefix = "[CĐCS] ";
  else if (node.loaiToChuc === "CDBP") prefix = "[CĐBP] ";
  else prefix = "[Tổ CĐ] ";
  
  result.push({ id: node.id, name: `${prefix}${node.tenDonVi}` });
  node.children?.forEach(c => { result = result.concat(collectGroups(c)); });
  return result;
}

export default function MembersList() {
  const { user } = useAuth();
  const [members, setMembers] = useState<UnionMemberDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  // Catalogs
  const [languagesList, setLanguagesList] = useState<CatalogDto[]>([]);
  const [levelsList, setLevelsList] = useState<CatalogDto[]>([]);

  // Add member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<any>({
    hoTen: "", ngaySinh: "", gioiTinh: 1, soCCCD: "", maNhanVien: "", maToCongDoan: "",
    ngayVaoCongDoan: "", vaiTro: 1, loaiCanBo: 1, chucVu: "", donViCongTac: "",
    chucDanhChuyenMon: "", trinhDoHocVan: "", dangVien: false, dienThoai: "", email: "",
    danToc: "Kinh", tonGiao: "Không", queQuan: "",
    ngoaiNgus: []
  });
  const [addError, setAddError] = useState("");
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeMember, setActiveMember] = useState<UnionMemberDto | null>(null);
  const [targetGroup, setTargetGroup] = useState("");
  const [transferReason, setTransferReason] = useState("");

  const loadMembers = useCallback(async () => {
    const data = await getMembers({
      search: searchTerm || undefined,
      toCongDoanId: selectedGroup || undefined,
      vaiTro: selectedRole || undefined,
      trangThai: selectedStatus || undefined
    });
    if (data && data.items.length > 0) {
      setMembers(data.items);
      setTotalCount(data.totalCount);
    } else {
      // Fallback mock data with client-side filtering
      let filtered = [...mockMembers];
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        filtered = filtered.filter(m => m.hoTen.toLowerCase().includes(s) || m.maNhanVien.toLowerCase().includes(s) || m.soCCCD.includes(s));
      }
      if (selectedGroup) filtered = filtered.filter(m => m.maToCongDoan === selectedGroup);
      if (selectedRole) filtered = filtered.filter(m => m.vaiTro === selectedRole);
      if (selectedStatus) filtered = filtered.filter(m => m.trangThai === selectedStatus);
      setMembers(filtered);
      setTotalCount(filtered.length);
    }
  }, [searchTerm, selectedGroup, selectedRole, selectedStatus]);

  const loadGroups = useCallback(async () => {
    const tree = await getUnionTree();
    if (tree) {
      setGroups(collectGroups(tree));
    } else {
      setGroups([
        { id: "tcd-tieuhoa", name: "Tổ CĐ Khoa Tiêu hóa" },
        { id: "tcd-tim", name: "Tổ CĐ Khoa Tim mạch" },
        { id: "tcd-chinhhinh", name: "Tổ CĐ Chấn thương chỉnh hình" },
        { id: "tcd-khop", name: "Tổ CĐ Khoa Khớp" },
        { id: "tcd-tructhuoc1", name: "Tổ CĐ trực thuộc CĐCS số 1" }
      ]);
    }
  }, []);

  const loadCatalogs = useCallback(async () => {
    try {
      const langs = await getCatalogsApi({ loai: "NgoaiNgu", activeOnly: true });
      setLanguagesList(langs);
      const lvls = await getCatalogsApi({ loai: "TrinhDoNgoaiNgu", activeOnly: true });
      setLevelsList(lvls);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);
  useEffect(() => { loadGroups(); loadCatalogs(); }, [loadGroups, loadCatalogs]);

  const handleAddLanguageRow = () => {
    setAddForm((prev: any) => ({
      ...prev,
      ngoaiNgus: [
        ...prev.ngoaiNgus,
        {
          ngoaiNgu: languagesList[0]?.ma || "TIENG_ANH",
          trinhDo: levelsList[0]?.ma || "CO_BAN",
          diemSo: 0,
          ngayCap: new Date().toISOString().split("T")[0],
          donViCap: "",
          fileChungChiUrl: ""
        }
      ]
    }));
  };

  const handleRemoveLanguageRow = (index: number) => {
    setAddForm((prev: any) => ({
      ...prev,
      ngoaiNgus: prev.ngoaiNgus.filter((_: any, idx: number) => idx !== index)
    }));
  };

  const handleLanguageFieldChange = (index: number, field: string, val: any) => {
    setAddForm((prev: any) => {
      const updated = [...prev.ngoaiNgus];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, ngoaiNgus: updated };
    });
  };

  const handleAddMember = async () => {
    setIsAddSubmitting(true);
    setAddError("");
    try {
      const payload = {
        ...addForm,
        gioiTinh: Number(addForm.gioiTinh),
        loaiCanBo: mapLoaiCanBoEnumToString(Number(addForm.loaiCanBo)),
        vaiTro: mapVaiTroEnumToString(Number(addForm.vaiTro))
      };
      await createMember(payload);
      setShowAddModal(false);
      setAddForm({
        hoTen: "", ngaySinh: "", gioiTinh: 1, soCCCD: "", maNhanVien: "", maToCongDoan: "",
        ngayVaoCongDoan: "", vaiTro: 1, loaiCanBo: 1, chucVu: "", donViCongTac: "",
        chucDanhChuyenMon: "", trinhDoHocVan: "", dangVien: false, dienThoai: "", email: "",
        danToc: "Kinh", tonGiao: "Không", queQuan: "",
        ngoaiNgus: []
      });
      await loadMembers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setAddError(error?.response?.data?.message || "Lỗi khi thêm đoàn viên");
    } finally {
      setIsAddSubmitting(false);
    }
  };

  const handleTransfer = async () => {
    if (!activeMember || !targetGroup || !transferReason) return;
    try {
      await transferMember(activeMember.id, {
        denToCongDoanId: targetGroup,
        lyDo: transferReason,
        ngayHieuLuc: new Date().toISOString()
      });
      alert("Chuyển sinh hoạt thành công!");
      setShowTransferModal(false);
      setActiveMember(null);
      setTargetGroup("");
      setTransferReason("");
      await loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi chuyển sinh hoạt");
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đoàn viên "${name}" khỏi hệ thống?`)) return;
    try {
      await deleteMemberApi(id);
      alert("Xóa đoàn viên thành công!");
      await loadMembers();
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi khi xóa đoàn viên");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Hồ sơ & Biến động Đoàn viên</h2>
          <p className="text-xs text-slate-400 font-medium">
            Quản lý, tra cứu và xử lý điều động sinh hoạt — <span className="text-emerald-400 font-semibold">{user?.vaiTro}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-950/20 active:scale-95"
          >
            ➕ Thêm Đoàn viên mới
          </button>
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Tìm kiếm nhanh</label>
          <input
            type="text" placeholder="Họ tên, mã NV, số CCCD..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all placeholder:text-slate-600"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Đơn vị Công đoàn</label>
          <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
            <option value="">Tất cả Đơn vị</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Vai trò công đoàn</label>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
            <option value="">Tất cả vai trò</option>
            {Object.entries(vaiTroLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Trạng thái</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(trangThaiLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Danh sách kết quả ({totalCount})</span>
          <span className="text-[10px] text-slate-500">Mẹo: Bấm vào tên để xem chi tiết / sửa chứng chỉ ngoại ngữ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="px-6 py-3.5">Họ và Tên</th>
                <th className="px-6 py-3.5">Mã NV / CCCD</th>
                <th className="px-6 py-3.5">Tổ Công đoàn</th>
                <th className="px-6 py-3.5">Chức vụ / Đơn vị</th>
                <th className="px-6 py-3.5">Vai trò CĐ</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-slate-900/40 transition-all">
                  <td className="px-6 py-4">
                    <Link href={`/members/${m.id}`} className="font-semibold text-emerald-400 hover:text-emerald-300 hover:underline">
                      {m.hoTen}
                    </Link>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {m.dangVien && <span className="text-red-400 mr-2">★ Đảng viên</span>}
                      {m.gioiTinh === 0 ? "Nữ" : "Nam"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{m.maNhanVien}</div>
                    <div className="text-[10px] text-slate-500">{m.soCCCD}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-semibold">{m.tenToCongDoan}</td>
                  <td className="px-6 py-4">
                    <div>{m.chucVu || "—"}</div>
                    <div className="text-[10px] text-slate-500">{m.donViCongTac || ""}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">
                      {vaiTroLabels[m.vaiTro] || m.vaiTro}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      m.trangThai === "DangSinhHoat"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {trangThaiLabels[m.trangThai] || m.trangThai}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/members/${m.id}?edit=true`}
                        className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all flex items-center"
                      >
                        ✏️ Sửa
                      </Link>
                      <button
                        onClick={() => { setActiveMember(m); setShowTransferModal(true); }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700 transition-all"
                      >
                        🔄 Điều động
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id, m.hoTen)}
                        className="bg-red-600/10 hover:bg-red-600/20 text-red-400 text-[10px] font-semibold px-3 py-1.5 rounded-lg border border-red-500/20 transition-all"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Không có dữ liệu đoàn viên</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Thêm Đoàn viên công đoàn mới</h3>
              <p className="text-xs text-slate-400 mt-1">Điền đầy đủ thông tin cá nhân và tổ chức công đoàn</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Họ và tên *</label>
                <input type="text" value={addForm.hoTen} onChange={e => setAddForm({ ...addForm, hoTen: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ngày sinh *</label>
                <input type="date" value={addForm.ngaySinh} onChange={e => setAddForm({ ...addForm, ngaySinh: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Giới tính</label>
                <select value={addForm.gioiTinh} onChange={e => setAddForm({ ...addForm, gioiTinh: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
                  <option value={1}>Nam</option><option value={0}>Nữ</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Số CCCD *</label>
                <input type="text" value={addForm.soCCCD} onChange={e => setAddForm({ ...addForm, soCCCD: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="001095001234" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mã nhân viên *</label>
                <input type="text" value={addForm.maNhanVien} onChange={e => setAddForm({ ...addForm, maNhanVien: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="NV-0001" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Đơn vị Công đoàn *</label>
                <select value={addForm.maToCongDoan} onChange={e => setAddForm({ ...addForm, maToCongDoan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
                  <option value="">Chọn Đơn vị...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  * Cho phép chọn Tổ công đoàn hoặc Công đoàn bộ phận (CĐBP) / Công đoàn cơ sở (CĐCS) trực tiếp.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ngày vào CĐ *</label>
                <input type="date" value={addForm.ngayVaoCongDoan} onChange={e => setAddForm({ ...addForm, ngayVaoCongDoan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Vai trò CĐ</label>
                <select value={addForm.vaiTro} onChange={e => setAddForm({ ...addForm, vaiTro: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
                  <option value={1}>Đoàn viên</option><option value={2}>Tổ trưởng</option>
                  <option value={3}>CT CĐBP</option><option value={7}>UV BCH</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Chức vụ</label>
                <input type="text" value={addForm.chucVu} onChange={e => setAddForm({ ...addForm, chucVu: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="Phó khoa" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Đơn vị công tác</label>
                <input type="text" value={addForm.donViCongTac} onChange={e => setAddForm({ ...addForm, donViCongTac: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="Khoa Tiêu hóa" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Chuyên môn</label>
                <input type="text" value={addForm.chucDanhChuyenMon} onChange={e => setAddForm({ ...addForm, chucDanhChuyenMon: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="Bác sĩ" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trình độ học vấn</label>
                <select value={addForm.trinhDoHocVan} onChange={e => setAddForm({ ...addForm, trinhDoHocVan: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
                  <option value="">Chọn...</option>
                  <option value="Trung cấp">Trung cấp</option><option value="Cao đẳng">Cao đẳng</option>
                  <option value="Đại học">Đại học</option><option value="Thạc sĩ">Thạc sĩ</option><option value="Tiến sĩ">Tiến sĩ</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Điện thoại</label>
                <input type="text" value={addForm.dienThoai} onChange={e => setAddForm({ ...addForm, dienThoai: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="0912345678" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all" placeholder="email@bv108.vn" />
              </div>
              <div className="flex items-end gap-4 col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={addForm.dangVien} onChange={e => setAddForm({ ...addForm, dangVien: e.target.checked })}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500" />
                  <span className="text-xs text-slate-300">Là Đảng viên</span>
                </label>
              </div>
            </div>

            {/* LANGUAGES SECTION */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chứng chỉ ngoại ngữ</label>
                <button
                  type="button"
                  onClick={handleAddLanguageRow}
                  className="bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-bold transition-all"
                >
                  ➕ Thêm ngoại ngữ
                </button>
              </div>

              <div className="space-y-3">
                {addForm.ngoaiNgus.map((lang: any, index: number) => (
                  <div key={index} className="grid grid-cols-3 gap-2 bg-slate-950/40 p-3 rounded-lg relative border border-slate-800">
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5">Ngoại ngữ</span>
                      <select
                        value={lang.ngoaiNgu}
                        onChange={(e) => handleLanguageFieldChange(index, "ngoaiNgu", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                      >
                        {languagesList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {languagesList.length === 0 && <option value="TIENG_ANH">Tiếng Anh</option>}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5">Trình độ</span>
                      <select
                        value={lang.trinhDo}
                        onChange={(e) => handleLanguageFieldChange(index, "trinhDo", e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                      >
                        {levelsList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {levelsList.length === 0 && <option value="CO_BAN">Cơ bản</option>}
                      </select>
                    </div>
                    <div className="flex gap-1 items-end">
                      <div className="flex-1">
                        <span className="text-[9px] text-slate-500 block mb-0.5">Điểm số</span>
                        <input
                          type="number"
                          step="0.1"
                          value={lang.diemSo}
                          onChange={(e) => handleLanguageFieldChange(index, "diemSo", parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguageRow(index)}
                        className="bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 p-1 rounded text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {addError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">⚠️ {addError}</div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-800">
              <button onClick={() => setShowAddModal(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all">Hủy bỏ</button>
              <button onClick={handleAddMember} disabled={isAddSubmitting || !addForm.hoTen || !addForm.soCCCD || !addForm.maNhanVien}
                className={`text-xs font-semibold px-5 py-2 rounded-xl transition-all ${
                  addForm.hoTen && addForm.soCCCD && addForm.maNhanVien && !isAddSubmitting
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                }`}>
                {isAddSubmitting ? "Đang lưu..." : "Xác nhận thêm đoàn viên"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && activeMember && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Chuyển sinh hoạt công đoàn</h3>
              <p className="text-xs text-slate-400 mt-1">Điều động đoàn viên <span className="text-emerald-400 font-semibold">{activeMember.hoTen}</span> sang tổ CĐ mới.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Tổ CĐ đích</label>
                <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
                  <option value="">Chọn tổ CĐ đích...</option>
                  {groups.filter(g => g.id !== activeMember.maToCongDoan).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Lý do điều động</label>
                <textarea rows={3} value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Nhập lý do điều động..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-all resize-none" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => { setShowTransferModal(false); setActiveMember(null); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-700 transition-all">Hủy bỏ</button>
              <button onClick={handleTransfer} disabled={!targetGroup || !transferReason}
                className={`text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                  targetGroup && transferReason ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/20" : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                }`}>Xác nhận chuyển</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
