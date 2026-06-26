"use client";

import { useState, useEffect, useCallback } from "react";
import { getMembers, createMember, transferMember, deleteMemberApi, getUnionTree, getCatalogsApi, CatalogDto, UnionMemberDto, UnionUnitDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import EvidenceUpload from "@/components/EvidenceUpload";
import { PageHeader, ActionButton } from "@/components/ui-components";

// Mock data khi API trả rỗng
const mockMembers: UnionMemberDto[] = [
  { id: "m1", hoTen: "Trần Quốc Toản", maNhanVien: "NV-0042", soCCCD: "001095001234", ngaySinh: "1990-03-15", gioiTinh: 1, chucVu: "Phó khoa", donViCongTac: "Khoa Tiêu hóa", chucDanhChuyenMon: "Bác sĩ", maToCongDoan: "tcd-tieuhoa", tenToCongDoan: "Tổ CĐ Khoa Tiêu hóa", vaiTro: "DoanVien", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2015-06-01", dangVien: "Đảng viên chính thức", dienThoai: "0912345678", email: "toan.tq@bv108.vn", trinhDoHocVan: "Thạc sĩ" },
  { id: "m2", hoTen: "Nguyễn Thị Định", maNhanVien: "NV-0281", soCCCD: "001097004321", ngaySinh: "1992-08-20", gioiTinh: 0, chucVu: "Điều dưỡng trưởng", donViCongTac: "Khoa Tiêu hóa", chucDanhChuyenMon: "Điều dưỡng", maToCongDoan: "tcd-tieuhoa", tenToCongDoan: "Tổ CĐ Khoa Tiêu hóa", vaiTro: "ToTruong", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2016-01-15", dangVien: "khác", dienThoai: "0923456789", email: "dinh.nt@bv108.vn", trinhDoHocVan: "Đại học" },
  { id: "m3", hoTen: "Phạm Hùng", maNhanVien: "NV-0985", soCCCD: "002094002345", ngaySinh: "1985-12-10", gioiTinh: 1, chucVu: "Trưởng khoa", donViCongTac: "Khoa Tim mạch", chucDanhChuyenMon: "Bác sĩ", maToCongDoan: "tcd-tim", tenToCongDoan: "Tổ CĐ Khoa Tim mạch", vaiTro: "UyVienBCH", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2010-09-01", dangVien: "Đảng viên chính thức", dienThoai: "0934567890", email: "hung.p@bv108.vn", trinhDoHocVan: "Tiến sĩ" },
  { id: "m4", hoTen: "Hoàng Văn Thái", maNhanVien: "NV-0120", soCCCD: "003096009876", ngaySinh: "1988-05-25", gioiTinh: 1, chucVu: "Dược sĩ trưởng", donViCongTac: "Khoa Dược", chucDanhChuyenMon: "Dược sĩ", maToCongDoan: "tcd-tructhuoc1", tenToCongDoan: "Tổ CĐ trực thuộc CĐCS số 1", vaiTro: "ToTruong", trangThai: "DangSinhHoat", ngayVaoCongDoan: "2014-03-01", dangVien: "Đảng viên dự bị", dienThoai: "0945678901", email: "thai.hv@bv108.vn", trinhDoHocVan: "Thạc sĩ" },
  { id: "m5", hoTen: "Bùi Thị Xuân", maNhanVien: "NV-1209", soCCCD: "004098006543", ngaySinh: "1995-11-30", gioiTinh: 0, chucVu: "Điều dưỡng", donViCongTac: "Khoa Khớp", chucDanhChuyenMon: "Điều dưỡng", maToCongDoan: "tcd-khop", tenToCongDoan: "Tổ CĐ Khoa Khớp", vaiTro: "DoanVien", trangThai: "TamDung", ngayVaoCongDoan: "2019-07-15", dangVien: "khác", dienThoai: "0956789012", email: "xuan.bt@bv108.vn", trinhDoHocVan: "Đại học" },
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

interface MemberLanguageItem {
  id?: string;
  ngoaiNgu: string;
  trinhDo: string;
  diemSo: number;
  ngayCap: string;
  donViCap: string;
  fileChungChiUrl: string;
}

interface AddMemberFormState {
  hoTen: string;
  ngaySinh: string;
  gioiTinh: number;
  soCCCD: string;
  maNhanVien: string;
  maToCongDoan: string;
  ngayVaoCongDoan: string;
  vaiTro: number;
  loaiCanBo: number;
  chucVu: string;
  donViCongTac: string;
  chucDanhChuyenMon: string;
  trinhDoHocVan: string;
  dangVien: string;
  dienThoai: string;
  email: string;
  danToc: string;
  tonGiao: string;
  queQuan: string;
  diaChiLienHe: string;
  soTheDoanVien: string;
  hocHam: string;
  hocVi: string;
  ghiChu: string;
  ngoaiNgus: MemberLanguageItem[];
}

const PAGE_SIZE = 15;

export default function MembersList() {
  const { user } = useAuth();
  const [members, setMembers] = useState<UnionMemberDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);

  const handleSearchChange = (val: string) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleGroupChange = (val: string) => {
    setSelectedGroup(val);
    setCurrentPage(1);
  };

  const handleRoleChange = (val: string) => {
    setSelectedRole(val);
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string) => {
    setSelectedStatus(val);
    setCurrentPage(1);
  };

  // Catalogs
  const [languagesList, setLanguagesList] = useState<CatalogDto[]>([]);
  const [levelsList, setLevelsList] = useState<CatalogDto[]>([]);
  const [chucVus, setChucVus] = useState<CatalogDto[]>([]);
  const [donViCongTacs, setDonViCongTacs] = useState<CatalogDto[]>([]);
  const [chuyenMons, setChuyenMons] = useState<CatalogDto[]>([]);
  const [educationList, setEducationList] = useState<CatalogDto[]>([]);
  const [danTocsList, setDanTocsList] = useState<CatalogDto[]>([]);
  const [tonGiaosList, setTonGiaosList] = useState<CatalogDto[]>([]);

  // Add member modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<AddMemberFormState>({
    hoTen: "", ngaySinh: "", gioiTinh: 1, soCCCD: "", maNhanVien: "", maToCongDoan: "",
    ngayVaoCongDoan: "", vaiTro: 1, loaiCanBo: 1, chucVu: "", donViCongTac: "",
    chucDanhChuyenMon: "", trinhDoHocVan: "", dangVien: "khác", dienThoai: "", email: "",
    danToc: "Kinh", tonGiao: "Không", queQuan: "",
    diaChiLienHe: "", soTheDoanVien: "", hocHam: "", hocVi: "", ghiChu: "",
    ngoaiNgus: []
  });
  const [addError, setAddError] = useState("");
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);

  // Transfer modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [activeMember, setActiveMember] = useState<UnionMemberDto | null>(null);
  const [targetGroup, setTargetGroup] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [transferFileMinhChungUrl, setTransferFileMinhChungUrl] = useState("");

  const loadMembers = useCallback(async () => {
    const data = await getMembers({
      search: searchTerm || undefined,
      toCongDoanId: selectedGroup || undefined,
      vaiTro: selectedRole || undefined,
      trangThai: selectedStatus || undefined,
      page: currentPage,
      pageSize: PAGE_SIZE
    });
    if (data !== null) {
      setMembers(data.items);
      setTotalCount(data.totalCount);
    } else {
      // Fallback mock data with client-side filtering (only if API fails)
      let filtered = [...mockMembers];
      
      // Filter mock data by organization scope
      if (user && user.phamVi !== "CDCS" && user.donViId) {
        const userOrg = user.donViId.toLowerCase();
        // Map mock unit IDs to CĐBP parent IDs to simulate scope
        // Khối Nội 1: 70967e9e-a3c3-4486-9cb0-65d150382d94
        // Khối Ngoại: d6e077b4-fd1b-49cc-ae92-32014b418b4c
        filtered = filtered.filter(m => {
          if (user.phamVi === "TOCD") {
            // Check direct match or mapped match
            if (m.maToCongDoan === userOrg) return true;
            if (userOrg.includes("tieuhoa") && m.maToCongDoan === "tcd-tieuhoa") return true;
            if (userOrg.includes("tim") && m.maToCongDoan === "tcd-tim") return true;
            if (userOrg.includes("chinhhinh") && m.maToCongDoan === "tcd-chinhhinh") return true;
            if (userOrg.includes("khop") && m.maToCongDoan === "tcd-khop") return true;
            if (userOrg.includes("tructhuoc") && m.maToCongDoan === "tcd-tructhuoc1") return true;
            return false;
          } else if (user.phamVi === "CDBP") {
            if (userOrg === "70967e9e-a3c3-4486-9cb0-65d150382d94") {
               return m.maToCongDoan === "tcd-tieuhoa" || m.maToCongDoan === "tcd-tim";
            }
            if (userOrg === "d6e077b4-fd1b-49cc-ae92-32014b418b4c") {
              return m.maToCongDoan === "tcd-chinhhinh" || m.maToCongDoan === "tcd-khop";
            }
            if (userOrg === "ccad961d-41db-4321-95c9-d317b6e4a93d") {
              // Liên cơ quan has no mock child units
              return false;
            }
          }
          return false;
        });
      }

      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        filtered = filtered.filter(m => m.hoTen.toLowerCase().includes(s) || m.maNhanVien.toLowerCase().includes(s) || m.soCCCD.includes(s));
      }
      if (selectedGroup) filtered = filtered.filter(m => m.maToCongDoan === selectedGroup);
      if (selectedRole) filtered = filtered.filter(m => m.vaiTro === selectedRole);
      if (selectedStatus) filtered = filtered.filter(m => m.trangThai === selectedStatus);
      
      setTotalCount(filtered.length);

      // Client-side pagination for mock fallback data
      const startIndex = (currentPage - 1) * PAGE_SIZE;
      const paginated = filtered.slice(startIndex, startIndex + PAGE_SIZE);
      setMembers(paginated);
    }
  }, [searchTerm, selectedGroup, selectedRole, selectedStatus, currentPage, user]);

  const loadGroups = useCallback(async () => {
    const tree = await getUnionTree();
    if (tree) {
      const collected = collectGroups(tree);
      setGroups(collected);
      const defaultId = user?.donViId && collected.some(g => g.id === user.donViId)
        ? user.donViId
        : collected[0]?.id || "";
      setAddForm((prev) => ({
        ...prev,
        maToCongDoan: defaultId
      }));
    } else {
      setGroups([
        { id: "tcd-tieuhoa", name: "Tổ CĐ Khoa Tiêu hóa" },
        { id: "tcd-tim", name: "Tổ CĐ Khoa Tim mạch" },
        { id: "tcd-chinhhinh", name: "Tổ CĐ Chấn thương chỉnh hình" },
        { id: "tcd-khop", name: "Tổ CĐ Khoa Khớp" },
        { id: "tcd-tructhuoc1", name: "Tổ CĐ trực thuộc CĐCS số 1" }
      ]);
    }
  }, [user]);

  const loadCatalogs = useCallback(async () => {
    try {
      const langs = await getCatalogsApi({ loai: "NgoaiNgu", activeOnly: true });
      setLanguagesList(langs);
      const lvls = await getCatalogsApi({ loai: "TrinhDoNgoaiNgu", activeOnly: true });
      setLevelsList(lvls);
      const cv = await getCatalogsApi({ loai: "ChucVu", activeOnly: true });
      setChucVus(cv);
      const dv = await getCatalogsApi({ loai: "DonViCongTac", activeOnly: true });
      setDonViCongTacs(dv);
      const cm = await getCatalogsApi({ loai: "ChuyenMon", activeOnly: true });
      setChuyenMons(cm);
      const edu = await getCatalogsApi({ loai: "HocHamHocVi", activeOnly: true });
      setEducationList(edu);
      const dt = await getCatalogsApi({ loai: "DanToc", activeOnly: true });
      setDanTocsList(dt);
      const tg = await getCatalogsApi({ loai: "TonGiao", activeOnly: true });
      setTonGiaosList(tg);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadMembers();
    });
  }, [loadMembers]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadGroups();
      loadCatalogs();
    });
  }, [loadGroups, loadCatalogs]);

  const handleAddLanguageRow = () => {
    setAddForm((prev) => ({
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
    setAddForm((prev) => ({
      ...prev,
      ngoaiNgus: prev.ngoaiNgus.filter((_, idx: number) => idx !== index)
    }));
  };

  const handleLanguageFieldChange = (index: number, field: keyof MemberLanguageItem, val: string | number) => {
    setAddForm((prev) => {
      const updated = [...prev.ngoaiNgus];
      updated[index] = { ...updated[index], [field]: val } as MemberLanguageItem;
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
        chucDanhChuyenMon: "", trinhDoHocVan: "", dangVien: "khác", dienThoai: "", email: "",
        danToc: "Kinh", tonGiao: "Không", queQuan: "",
        diaChiLienHe: "", soTheDoanVien: "", hocHam: "", hocVi: "", ghiChu: "",
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
        ngayHieuLuc: new Date().toISOString(),
        fileMinhChungUrl: transferFileMinhChungUrl || undefined
      });
      alert("Chuyển sinh hoạt thành công!");
      setShowTransferModal(false);
      setActiveMember(null);
      setTargetGroup("");
      setTransferReason("");
      setTransferFileMinhChungUrl("");
      await loadMembers();
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi chuyển sinh hoạt";
      alert(errorMsg);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đoàn viên "${name}" khỏi hệ thống?`)) return;
    try {
      await deleteMemberApi(id);
      alert("Xóa đoàn viên thành công!");
      await loadMembers();
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Lỗi khi xóa đoàn viên";
      alert(errorMsg);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader
        title="Hồ sơ & Biến động Đoàn viên"
        description={`Quản lý, tra cứu và xử lý điều động sinh hoạt — vai trò: ${user?.vaiTro}`}
      >
        <ActionButton
          type="primary"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Thêm Đoàn viên mới
        </ActionButton>
      </PageHeader>

      {/* Filter panel */}
      <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tìm kiếm nhanh</label>
          <input
            type="text" placeholder="Họ tên, mã NV, số CCCD..."
            value={searchTerm} onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Đơn vị Công đoàn</label>
          <select value={selectedGroup} onChange={(e) => handleGroupChange(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
            <option value="">Tất cả Đơn vị</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Vai trò công đoàn</label>
          <select value={selectedRole} onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
            <option value="">Tất cả vai trò</option>
            {Object.entries(vaiTroLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trạng thái</label>
          <select value={selectedStatus} onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(trangThaiLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* Members table */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Danh sách kết quả ({totalCount})</span>
          <span className="text-[10px] text-slate-450 font-medium">Mẹo: Bấm vào tên để xem chi tiết / sửa chứng chỉ ngoại ngữ</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs table-modern">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                <th className="px-6 py-3.5">Họ và Tên</th>
                <th className="px-6 py-3.5">Mã NV / CCCD</th>
                <th className="px-6 py-3.5">Tổ Công đoàn</th>
                <th className="px-6 py-3.5">Chức vụ / Đơn vị</th>
                <th className="px-6 py-3.5">Vai trò CĐ</th>
                <th className="px-6 py-3.5">Trạng thái</th>
                <th className="px-6 py-3.5 text-right">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {members.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-6 py-4">
                    <Link href={`/members/detail?id=${m.id}`} className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                      {m.hoTen}
                    </Link>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {m.dangVien && m.dangVien !== "khác" && (
                        <span className="text-red-500 font-semibold mr-2">★ {m.dangVien}</span>
                      )}
                      {m.gioiTinh === 0 ? "Nữ" : "Nam"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{m.maNhanVien}</div>
                    <div className="text-[10px] text-slate-400">{m.soCCCD}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-semibold">{m.tenToCongDoan}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-800 font-medium">{m.chucVu || "—"}</div>
                    <div className="text-[10px] text-slate-400">{m.donViCongTac || ""}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600 font-medium">
                      {vaiTroLabels[m.vaiTro] || m.vaiTro}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      m.trangThai === "DangSinhHoat"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {trangThaiLabels[m.trangThai] || m.trangThai}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link
                        href={`/members/detail?id=${m.id}&edit=true`}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-blue-100/50 transition-all flex items-center"
                      >
                        ✏️ Sửa
                      </Link>
                      {user?.phamVi !== "TOCD" && (
                        <button
                          onClick={() => { setActiveMember(m); setShowTransferModal(true); }}
                          className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer"
                        >
                          🔄 Điều động
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMember(m.id, m.hoTen)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold px-3 py-1.5 rounded-lg border border-red-100/50 transition-all cursor-pointer"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 italic">Không có dữ liệu đoàn viên</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalCount > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/10">
            <span className="text-slate-500 font-medium">
              Hiển thị <span className="font-semibold text-slate-800">{Math.min(totalCount, (currentPage - 1) * PAGE_SIZE + 1)}</span> - <span className="font-semibold text-slate-800">{Math.min(totalCount, currentPage * PAGE_SIZE)}</span> trong tổng số <span className="font-semibold text-slate-800">{totalCount}</span> đoàn viên
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="bg-white border border-slate-200 hover:bg-slate-55 text-slate-700 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                ⬅️ Trang trước
              </button>
              <span className="text-slate-600 font-semibold px-2">
                Trang {currentPage} / {Math.ceil(totalCount / PAGE_SIZE) || 1}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / PAGE_SIZE), prev + 1))}
                disabled={currentPage === Math.ceil(totalCount / PAGE_SIZE) || totalCount === 0}
                className="bg-white border border-slate-200 hover:bg-slate-55 text-slate-700 font-bold px-3 py-1.5 rounded-lg disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed transition-all cursor-pointer"
              >
                Trang sau ➡️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-150 p-6 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div>
              <h3 className="text-base font-bold text-slate-800">Thêm Đoàn viên công đoàn mới</h3>
              <p className="text-xs text-slate-500 mt-0.5">Điền đầy đủ thông tin cá nhân và tổ chức công đoàn</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Họ và tên *</label>
                <input type="text" value={addForm.hoTen} onChange={e => setAddForm({ ...addForm, hoTen: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ngày sinh *</label>
                <input type="date" value={addForm.ngaySinh} onChange={e => setAddForm({ ...addForm, ngaySinh: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Giới tính</label>
                <select value={addForm.gioiTinh} onChange={e => setAddForm({ ...addForm, gioiTinh: Number(e.target.value) })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value={1}>Nam</option><option value={0}>Nữ</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Số CCCD *</label>
                <input type="text" value={addForm.soCCCD} onChange={e => setAddForm({ ...addForm, soCCCD: e.target.value, maNhanVien: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="001095001234" required />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mã nhân viên (CCCD) *</label>
                <input type="text" value={addForm.soCCCD} disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-400 cursor-not-allowed transition-all" placeholder="Tự động đồng bộ theo CCCD" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Đơn vị Công đoàn *</label>
                <select value={addForm.maToCongDoan} onChange={e => setAddForm({ ...addForm, maToCongDoan: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn Đơn vị...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                  * Cho phép chọn Tổ công đoàn hoặc Công đoàn bộ phận (CĐBP) / Công đoàn cơ sở (CĐCS) trực tiếp.
                </p>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ngày vào CĐ *</label>
                <input type="date" value={addForm.ngayVaoCongDoan} onChange={e => setAddForm({ ...addForm, ngayVaoCongDoan: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Vai trò CĐ</label>
                <select value={addForm.vaiTro} onChange={e => setAddForm({ ...addForm, vaiTro: Number(e.target.value) })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value={1}>Đoàn viên</option><option value={2}>Tổ trưởng</option>
                  <option value={3}>CT CĐBP</option><option value={7}>UV BCH</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Chức vụ</label>
                <select value={addForm.chucVu} onChange={e => setAddForm({ ...addForm, chucVu: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn Chức vụ...</option>
                  {chucVus.map(c => <option key={c.id} value={c.ten}>{c.ten}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Đơn vị công tác</label>
                <select value={addForm.donViCongTac} onChange={e => setAddForm({ ...addForm, donViCongTac: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn Đơn vị công tác...</option>
                  {donViCongTacs.map(c => <option key={c.id} value={c.ten}>{c.ten}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Chuyên môn</label>
                <select value={addForm.chucDanhChuyenMon} onChange={e => setAddForm({ ...addForm, chucDanhChuyenMon: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn Chuyên môn...</option>
                  {chuyenMons.map(c => <option key={c.id} value={c.ten}>{c.ten}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trình độ học vấn</label>
                <select value={addForm.trinhDoHocVan} onChange={e => setAddForm({ ...addForm, trinhDoHocVan: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn Trình độ học vấn...</option>
                  {educationList.map(edu => (
                    <option key={edu.id} value={edu.ten}>{edu.ten}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Điện thoại</label>
                <input type="text" value={addForm.dienThoai} onChange={e => setAddForm({ ...addForm, dienThoai: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="0912345678" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email</label>
                <input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="email@bv108.vn" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Phân loại Đảng viên</label>
                <select
                  value={addForm.dangVien}
                  onChange={e => setAddForm({ ...addForm, dangVien: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                >
                  <option value="khác">Khác / Chưa vào Đảng</option>
                  <option value="Đảng viên chính thức">Đảng viên chính thức</option>
                  <option value="Đảng viên dự bị">Đảng viên dự bị</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Loại cán bộ</label>
                <select value={addForm.loaiCanBo} onChange={e => setAddForm({ ...addForm, loaiCanBo: Number(e.target.value) })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value={1}>Sĩ quan</option>
                  <option value={2}>QN chuyên nghiệp</option>
                  <option value={3}>CNV quốc phòng</option>
                  <option value={4}>Lao động hợp đồng</option>
                  <option value={5}>Khác</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Dân tộc</label>
                <select value={addForm.danToc} onChange={e => setAddForm({ ...addForm, danToc: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn Dân tộc...</option>
                  {danTocsList.map(c => <option key={c.id} value={c.ten}>{c.ten}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tôn giáo</label>
                <select value={addForm.tonGiao} onChange={e => setAddForm({ ...addForm, tonGiao: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn Tôn giáo...</option>
                  {tonGiaosList.map(c => <option key={c.id} value={c.ten}>{c.ten}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quê quán</label>
                <input type="text" value={addForm.queQuan} onChange={e => setAddForm({ ...addForm, queQuan: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="e.g. Hà Nội" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Địa chỉ liên hệ</label>
                <input type="text" value={addForm.diaChiLienHe} onChange={e => setAddForm({ ...addForm, diaChiLienHe: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="e.g. Ba Đình, Hà Nội" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Số thẻ đoàn viên</label>
                <input type="text" value={addForm.soTheDoanVien} onChange={e => setAddForm({ ...addForm, soTheDoanVien: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" placeholder="Số thẻ đoàn viên..." />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Học hàm / Học vị</label>
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Học hàm" value={addForm.hocHam} onChange={e => setAddForm({ ...addForm, hocHam: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" />
                  <input type="text" placeholder="Học vị" value={addForm.hocVi} onChange={e => setAddForm({ ...addForm, hocVi: e.target.value })}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all" />
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ghi chú bổ sung</label>
                <textarea value={addForm.ghiChu} onChange={e => setAddForm({ ...addForm, ghiChu: e.target.value })} rows={2}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none" placeholder="Nhập ghi chú (nếu có)" />
              </div>
            </div>

            {/* LANGUAGES SECTION */}
            <div className="border-t border-slate-150 pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chứng chỉ ngoại ngữ</label>
                <button
                  type="button"
                  onClick={handleAddLanguageRow}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100/50 px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer"
                >
                  ➕ Thêm ngoại ngữ
                </button>
              </div>

              <div className="space-y-3">
                {addForm.ngoaiNgus.map((lang, index: number) => (
                  <div key={index} className="grid grid-cols-3 gap-2 bg-slate-50/50 p-3 rounded-lg relative border border-slate-200/60">
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5 font-medium">Ngoại ngữ</span>
                      <select
                        value={lang.ngoaiNgu}
                        onChange={(e) => handleLanguageFieldChange(index, "ngoaiNgu", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 cursor-pointer"
                      >
                        {languagesList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {languagesList.length === 0 && <option value="TIENG_ANH">Tiếng Anh</option>}
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block mb-0.5 font-medium">Trình độ</span>
                      <select
                        value={lang.trinhDo}
                        onChange={(e) => handleLanguageFieldChange(index, "trinhDo", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 cursor-pointer"
                      >
                        {levelsList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {levelsList.length === 0 && <option value="CO_BAN">Cơ bản</option>}
                      </select>
                    </div>
                    <div className="flex gap-1 items-end">
                      <div className="flex-1">
                        <span className="text-[9px] text-slate-500 block mb-0.5 font-medium">Điểm số</span>
                        <input
                          type="number"
                          step="0.1"
                          value={lang.diemSo}
                          onChange={(e) => handleLanguageFieldChange(index, "diemSo", parseFloat(e.target.value) || 0)}
                          className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguageRow(index)}
                        className="bg-red-50 hover:bg-red-100 text-red-650 border border-red-100/60 p-1.5 rounded text-xs transition-all cursor-pointer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">⚠️ {addError}</div>
            )}

            <div className="flex gap-3 justify-end pt-3 border-t border-slate-150">
              <button onClick={() => setShowAddModal(false)} className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer">Hủy bỏ</button>
              <button onClick={handleAddMember} disabled={isAddSubmitting || !addForm.hoTen || !addForm.soCCCD || !addForm.maNhanVien}
                className={`text-xs font-bold px-5 py-2 rounded-xl transition-all cursor-pointer ${
                  addForm.hoTen && addForm.soCCCD && addForm.maNhanVien && !isAddSubmitting
                    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}>
                {isAddSubmitting ? "Đang lưu..." : "Xác nhận thêm đoàn viên"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && activeMember && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-white border border-slate-150 p-6 rounded-2xl w-full max-w-md space-y-6 shadow-2xl animate-in scale-in duration-200">
            <div>
              <h3 className="text-base font-bold text-slate-800">Chuyển sinh hoạt công đoàn</h3>
              <p className="text-xs text-slate-500 mt-0.5">Điều động đoàn viên <span className="text-blue-600 font-semibold">{activeMember.hoTen}</span> sang tổ CĐ mới.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Tổ CĐ đích</label>
                <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer">
                  <option value="">Chọn tổ CĐ đích...</option>
                  {groups.filter(g => g.id !== activeMember.maToCongDoan).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Lý do điều động</label>
                <textarea rows={3} value={transferReason} onChange={(e) => setTransferReason(e.target.value)} placeholder="Nhập lý do điều động..."
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Quyết định/Minh chứng điều chuyển (PDF)</label>
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
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer">Hủy bỏ</button>
              <button onClick={handleTransfer} disabled={!targetGroup || !transferReason}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  targetGroup && transferReason ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xs" : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                }`}>Xác nhận chuyển</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
