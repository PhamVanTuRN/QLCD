"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { getMemberDetailApi, updateMemberApi, deleteMemberApi, getUnionTree, getCatalogsApi, CatalogDto, UnionUnitDto, UnionMemberDto } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface MemberLanguageItem {
  id?: string;
  ngoaiNgu: string;
  trinhDo: string;
  diemSo: number;
  ngayCap: string;
  donViCap: string;
  fileChungChiUrl: string;
}

interface ExtendedUnionMemberDto extends UnionMemberDto {
  danToc?: string | null;
  tonGiao?: string | null;
  queQuan?: string | null;
  diaChiLienHe?: string | null;
  soTheDoanVien?: string | null;
  trinhDoChuyenMon?: string | null;
  hocHam?: string | null;
  hocVi?: string | null;
  chuyenNganhDaoTao?: string | null;
  trinhDoLyLuanChinhTri?: string | null;
  ghiChu?: string | null;
  ngoaiNgus?: MemberLanguageItem[];
}

interface MemberFormStateDetail {
  hoTen: string;
  ngaySinh: string;
  gioiTinh: number;
  queQuan: string;
  danToc: string;
  tonGiao: string;
  soCCCD: string;
  dienThoai: string;
  email: string;
  diaChiLienHe: string;
  maNhanVien: string;
  chucVu: string;
  chucDanhChuyenMon: string;
  donViCongTac: string;
  loaiCanBo: number;
  maToCongDoan: string;
  ngayVaoCongDoan: string;
  soTheDoanVien: string;
  vaiTro: number;
  trangThai: number;
  trinhDoHocVan: string;
  trinhDoChuyenMon: string;
  hocHam: string;
  hocVi: string;
  chuyenNganhDaoTao: string;
  trinhDoLyLuanChinhTri: string;
  dangVien: boolean;
  ghiChu: string;
  ngoaiNgus: MemberLanguageItem[];
}

const trangThaiLabels: Record<string, string> = {
  DangSinhHoat: "Đang sinh hoạt",
  ChuyenDi: "Chuyển đi",
  NghiHuu: "Nghỉ hưu",
  RaKhoiCongDoan: "Ra khỏi công đoàn",
  TamDung: "Tạm dừng",
  KhoiPhuc: "Khôi phục"
};

const mapTrangThaiEnumToString = (val: number): string => {
  switch (val) {
    case 1: return "DangSinhHoat";
    case 2: return "ChuyenDi";
    case 3: return "NghiHuu";
    case 4: return "RaKhoiCongDoan";
    case 5: return "TamDung";
    case 6: return "KhoiPhuc";
    default: return "DangSinhHoat";
  }
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

const mapLoaiCanBoStringToEnum = (valStr: string): number => {
  switch (valStr) {
    case "SiQuan": return 1;
    case "QuanNhanChuyenNghiep": return 2;
    case "CongNhanVienChucQuocPhong": return 3;
    case "LaoDongHopDong": return 4;
    case "Khac": return 5;
    default: return 1;
  }
};

const mapVaiTroStringToEnum = (roleStr: string): number => {
  switch (roleStr) {
    case "DoanVien": return 1;
    case "ToTruong": return 2;
    case "ChuTichCDBP": return 3;
    case "PhoChuTichCDBP": return 4;
    case "ChuTichCDCS": return 5;
    case "PhoChuTichCDCS": return 6;
    case "UyVienBCH": return 7;
    default: return 1;
  }
};

const mapTrangThaiStringToEnum = (statusStr: string): number => {
  switch (statusStr) {
    case "DangSinhHoat": return 1;
    case "ChuyenDi": return 2;
    case "NghiHuu": return 3;
    case "RaKhoiCongDoan": return 4;
    case "TamDung": return 5;
    case "KhoiPhuc": return 6;
    default: return 1;
  }
};

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

function MemberDetailContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const router = useRouter();

  const [member, setMember] = useState<ExtendedUnionMemberDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Catalogs
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [languagesList, setLanguagesList] = useState<CatalogDto[]>([]);
  const [levelsList, setLevelsList] = useState<CatalogDto[]>([]);
  const [chucVus, setChucVus] = useState<CatalogDto[]>([]);
  const [donViCongTacs, setDonViCongTacs] = useState<CatalogDto[]>([]);
  const [chuyenMons, setChuyenMons] = useState<CatalogDto[]>([]);

  // Edit form state
  const [formData, setFormData] = useState<MemberFormStateDetail>({
    hoTen: "",
    ngaySinh: "",
    gioiTinh: 1,
    queQuan: "",
    danToc: "Kinh",
    tonGiao: "Không",
    soCCCD: "",
    dienThoai: "",
    email: "",
    diaChiLienHe: "",
    maNhanVien: "",
    chucVu: "",
    chucDanhChuyenMon: "",
    donViCongTac: "",
    loaiCanBo: 1,
    maToCongDoan: "",
    ngayVaoCongDoan: "",
    soTheDoanVien: "",
    vaiTro: 1,
    trangThai: 1,
    trinhDoHocVan: "",
    trinhDoChuyenMon: "",
    hocHam: "",
    hocVi: "",
    chuyenNganhDaoTao: "",
    trinhDoLyLuanChinhTri: "",
    dangVien: false,
    ghiChu: "",
    ngoaiNgus: [] as MemberLanguageItem[]
  });

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4500);
  };

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getMemberDetailApi(id);
      if (!data) {
        showAlert("error", "Không tìm thấy đoàn viên");
        router.push("/members");
        return;
      }
      setMember(data);

      // Parse data to Form State
      setFormData({
        hoTen: data.hoTen || "",
        ngaySinh: data.ngaySinh ? data.ngaySinh.split("T")[0] : "",
        gioiTinh: data.gioiTinh ?? 1,
        queQuan: data.queQuan || "",
        danToc: data.danToc || "Kinh",
        tonGiao: data.tonGiao || "Không",
        soCCCD: data.soCCCD || "",
        dienThoai: data.dienThoai || "",
        email: data.email || "",
        diaChiLienHe: data.diaChiLienHe || "",
        maNhanVien: data.maNhanVien || "",
        chucVu: data.chucVu || "",
        chucDanhChuyenMon: data.chucDanhChuyenMon || "",
        donViCongTac: data.donViCongTac || "",
        loaiCanBo: mapLoaiCanBoStringToEnum(data.loaiCanBo),
        maToCongDoan: data.maToCongDoan || "",
        ngayVaoCongDoan: data.ngayVaoCongDoan ? data.ngayVaoCongDoan.split("T")[0] : "",
        soTheDoanVien: data.soTheDoanVien || "",
        vaiTro: mapVaiTroStringToEnum(data.vaiTro),
        trangThai: mapTrangThaiStringToEnum(data.trangThai),
        trinhDoHocVan: data.trinhDoHocVan || "",
        trinhDoChuyenMon: data.trinhDoChuyenMon || "",
        hocHam: data.hocHam || "",
        hocVi: data.hocVi || "",
        chuyenNganhDaoTao: data.chuyenNganhDaoTao || "",
        trinhDoLyLuanChinhTri: data.trinhDoLyLuanChinhTri || "",
        dangVien: data.dangVien ?? false,
        ghiChu: data.ghiChu || "",
        ngoaiNgus: data.ngoaiNgus ? data.ngoaiNgus.map((l: Partial<MemberLanguageItem>) => ({
          ngoaiNgu: l.ngoaiNgu,
          trinhDo: l.trinhDo,
          diemSo: l.diemSo ?? 0,
          ngayCap: l.ngayCap ? l.ngayCap.split("T")[0] : "",
          donViCap: l.donViCap || "",
          fileChungChiUrl: l.fileChungChiUrl || ""
        })) : []
      });

      // Load Catalogs
      const tree = await getUnionTree();
      if (tree) setGroups(collectGroups(tree));
      
      const langs = await getCatalogsApi({ loai: "NgoaiNgu", activeOnly: true });
      setLanguagesList(langs);

      const levels = await getCatalogsApi({ loai: "TrinhDoNgoaiNgu", activeOnly: true });
      setLevelsList(levels);

      const cv = await getCatalogsApi({ loai: "ChucVu", activeOnly: true });
      setChucVus(cv);

      const dv = await getCatalogsApi({ loai: "DonViCongTac", activeOnly: true });
      setDonViCongTacs(dv);

      const cm = await getCatalogsApi({ loai: "ChuyenMon", activeOnly: true });
      setChuyenMons(cm);

    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải thông tin chi tiết đoàn viên");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    Promise.resolve().then(() => {
      loadData();
    });
  }, [loadData]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("edit") === "true") {
          setIsEditing(true);
        }
      }
    });
  }, []);

  const handleAddLanguageRow = () => {
    setFormData((prev) => ({
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
    setFormData((prev) => ({
      ...prev,
      ngoaiNgus: prev.ngoaiNgus.filter((_, idx: number) => idx !== index)
    }));
  };

  const handleLanguageFieldChange = (index: number, field: keyof MemberLanguageItem, val: string | number) => {
    setFormData((prev) => {
      const updated = [...prev.ngoaiNgus];
      updated[index] = { ...updated[index], [field]: val } as MemberLanguageItem;
      return { ...prev, ngoaiNgus: updated };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.hoTen || !formData.soCCCD || !formData.maNhanVien || !formData.maToCongDoan) {
      showAlert("error", "Vui lòng nhập đầy đủ các trường thông tin bắt buộc (*)");
      return;
    }

    try {
      const payload = {
        id,
        ...formData,
        gioiTinh: Number(formData.gioiTinh),
        loaiCanBo: mapLoaiCanBoEnumToString(Number(formData.loaiCanBo)),
        vaiTro: mapVaiTroEnumToString(Number(formData.vaiTro)),
        trangThai: mapTrangThaiEnumToString(Number(formData.trangThai))
      };

      await updateMemberApi(id, payload);
      showAlert("success", "Cập nhật hồ sơ đoàn viên thành công");
      setIsEditing(false);
      loadData();
    } catch (err) {
      console.error(err);
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Đã xảy ra lỗi khi lưu thông tin";
      showAlert("error", errorMsg);
    }
  };

  const handleDelete = async () => {
    if (!member) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa hồ sơ đoàn viên "${member.hoTen}" khỏi hệ thống?`)) return;
    try {
      await deleteMemberApi(id);
      window.alert("Xóa hồ sơ đoàn viên thành công!");
      router.push("/members");
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Đã xảy ra lỗi khi xóa hồ sơ";
      window.alert(errorMsg);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-450 gap-3">
        <span className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <span>Đang tải thông tin hồ sơ...</span>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
        <span>Không tìm thấy thông tin đoàn viên.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Alert Header */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 transition-all animate-bounce ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-250 text-emerald-700"
              : "bg-red-50 border-red-250 text-red-700"
          }`}
        >
          <span>{alert.type === "success" ? "✅" : "⚠️"}</span>
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      {/* Nav breadcrumb & Actions */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-5">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Link href="/members" className="hover:text-blue-600 transition-all">Quản lý Đoàn viên</Link>
          <span>/</span>
          <span className="text-slate-800 font-semibold">Hồ sơ chi tiết</span>
        </div>
        <div className="flex gap-2">
          <Link
            href="/members"
            className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 shadow-xs transition-all"
          >
            ⬅️ Quay lại
          </Link>
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                📝 Chỉnh sửa
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-55 hover:bg-red-100 text-red-600 px-5 py-2 rounded-xl text-xs font-bold border border-red-100 shadow-xs transition-all cursor-pointer"
              >
                🗑️ Xóa Hồ Sơ
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-red-50 hover:bg-red-100 text-red-650 px-4 py-2 rounded-xl text-xs font-bold border border-red-150 transition-all cursor-pointer"
            >
              Hủy sửa
            </button>
          )}
        </div>
      </div>

      {!isEditing ? (
        // VIEW DETAILS SCREEN
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left card: avatar & general */}
          <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs space-y-6 flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-650 flex items-center justify-center font-bold text-white text-3xl shadow-md relative">
              {member.hoTen.split(" ").map((w: string) => w[0]).slice(-2).join("")}
              {member.dangVien && (
                <span className="absolute bottom-1 right-1 bg-red-500 border-2 border-white rounded-full w-7 h-7 flex items-center justify-center text-white text-[10px] shadow-sm" title="Đảng viên">
                  ★
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">{member.hoTen}</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">Mã NV: {member.maNhanVien} • {member.gioiTinh === 0 ? "Nữ" : "Nam"}</p>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold mt-2.5 border ${
                member.trangThai === "DangSinhHoat"
                  ? "bg-emerald-50 text-emerald-705 border-emerald-150"
                  : "bg-amber-50 text-amber-705 border-amber-150"
              }`}>
                {trangThaiLabels[member.trangThai] || member.trangThai}
              </span>
            </div>

            <div className="w-full border-t border-slate-100 pt-4 text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Tổ Công đoàn</span>
                <span className="font-semibold text-blue-600">{member.tenToCongDoan || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Vai trò CĐ</span>
                <span className="font-semibold text-slate-800">{member.vaiTro}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Chức vụ</span>
                <span className="font-semibold text-slate-700">{member.chucVu || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Đơn vị công tác</span>
                <span className="font-semibold text-slate-750 text-right">{member.donViCongTac || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-medium">Ngày vào CĐ</span>
                <span className="font-semibold text-slate-700">
                  {member.ngayVaoCongDoan ? new Date(member.ngayVaoCongDoan).toLocaleDateString("vi-VN") : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Right section: details and certifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Details */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Thông tin cá nhân & Học vấn
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Số CCCD</span>
                  <span className="text-slate-800 font-semibold">{member.soCCCD}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Ngày sinh</span>
                  <span className="text-slate-800 font-semibold">
                    {member.ngaySinh ? new Date(member.ngaySinh).toLocaleDateString("vi-VN") : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Dân tộc / Tôn giáo</span>
                  <span className="text-slate-800 font-semibold">{member.danToc || "Kinh"} / {member.tonGiao || "Không"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Quê quán</span>
                  <span className="text-slate-800 font-semibold">{member.queQuan || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Điện thoại / Email</span>
                  <span className="text-slate-800 font-semibold">
                    {member.dienThoai || "—"} {member.email ? `• ${member.email}` : ""}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Địa chỉ liên hệ</span>
                  <span className="text-slate-800 font-semibold">{member.diaChiLienHe || "—"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Trình độ học vấn / Chuyên môn</span>
                  <span className="text-slate-800 font-semibold">
                    {member.trinhDoHocVan || "—"} / {member.trinhDoChuyenMon || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-medium">Học hàm / Học vị</span>
                  <span className="text-slate-800 font-semibold">
                    {member.hocHam || "—"} / {member.hocVi || "—"}
                  </span>
                </div>
              </div>

              {member.ghiChu && (
                <div className="pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-400 block mb-0.5 font-medium">Ghi chú</span>
                  <p className="text-slate-600 italic">{member.ghiChu}</p>
                </div>
              )}
            </div>

            {/* Foreign languages certifications */}
            <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Trình độ Ngoại ngữ & Chứng chỉ
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse table-modern">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-semibold bg-slate-50/50">
                      <th className="py-2.5">Ngoại ngữ</th>
                      <th className="py-2.5">Trình độ</th>
                      <th className="py-2.5 text-center">Điểm số (Nếu có)</th>
                      <th className="py-2.5">Ngày cấp chứng chỉ</th>
                      <th className="py-2.5">Đơn vị cấp</th>
                      <th className="py-2.5 text-right">Chứng chỉ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {member.ngoaiNgus && member.ngoaiNgus.length > 0 ? (
                      member.ngoaiNgus.map((lang: MemberLanguageItem) => (
                        <tr key={lang.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3 font-semibold text-blue-600">{lang.ngoaiNgu}</td>
                          <td className="py-3 font-medium">{lang.trinhDo}</td>
                          <td className="py-3 text-center font-mono">{lang.diemSo > 0 ? lang.diemSo : "—"}</td>
                           <td className="py-3">
                            {lang.ngayCap ? new Date(lang.ngayCap).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="py-3 text-slate-500">{lang.donViCap || "—"}</td>
                          <td className="py-3 text-right">
                            {lang.fileChungChiUrl ? (
                              <a
                                href={lang.fileChungChiUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                              >
                                Xem file 📁
                              </a>
                            ) : (
                              <span className="text-slate-400 italic">Không có file</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-400 italic">
                          Chưa cập nhật thông tin chứng chỉ ngoại ngữ.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // EDIT MODE FORM SCREEN
        <form onSubmit={handleSave} className="bg-white border border-slate-150 p-6 rounded-2xl space-y-6 shadow-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
            <span>📝</span> Chỉnh sửa thông tin đoàn viên
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* General Info */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Họ và tên *</label>
              <input
                type="text"
                value={formData.hoTen}
                onChange={(e) => setFormData({ ...formData, hoTen: e.target.value })}
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ngày sinh *</label>
              <input
                type="date"
                value={formData.ngaySinh}
                onChange={(e) => setFormData({ ...formData, ngaySinh: e.target.value })}
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Giới tính</label>
              <select
                value={formData.gioiTinh}
                onChange={(e) => setFormData({ ...formData, gioiTinh: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value={1}>Nam</option>
                <option value={0}>Nữ</option>
                <option value={2}>Khác</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Số CCCD / CMTQĐ *</label>
              <input
                type="text"
                value={formData.soCCCD}
                onChange={(e) => setFormData({ ...formData, soCCCD: e.target.value, maNhanVien: e.target.value })}
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mã nhân viên (CCCD) *</label>
              <input
                type="text"
                value={formData.soCCCD}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-400 cursor-not-allowed focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Đơn vị Công đoàn *</label>
              <select
                value={formData.maToCongDoan}
                onChange={(e) => setFormData({ ...formData, maToCongDoan: e.target.value })}
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Chọn Đơn vị...</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
              <p className="text-[9px] text-slate-400 mt-1 leading-relaxed">
                * Cho phép chọn Tổ công đoàn hoặc Công đoàn bộ phận (CĐBP) / Công đoàn cơ sở (CĐCS) trực tiếp.
              </p>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Điện thoại</label>
              <input
                type="text"
                value={formData.dienThoai}
                onChange={(e) => setFormData({ ...formData, dienThoai: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Địa chỉ liên hệ</label>
              <input
                type="text"
                value={formData.diaChiLienHe}
                onChange={(e) => setFormData({ ...formData, diaChiLienHe: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quê quán</label>
              <input
                type="text"
                value={formData.queQuan}
                onChange={(e) => setFormData({ ...formData, queQuan: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Dân tộc</label>
              <input
                type="text"
                value={formData.danToc}
                onChange={(e) => setFormData({ ...formData, danToc: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tôn giáo</label>
              <input
                type="text"
                value={formData.tonGiao}
                onChange={(e) => setFormData({ ...formData, tonGiao: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Professional Info */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Chức vụ chính quyền</label>
              <select
                value={formData.chucVu}
                onChange={(e) => setFormData({ ...formData, chucVu: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Chọn Chức vụ...</option>
                {chucVus.map((c) => (
                  <option key={c.id} value={c.ten}>{c.ten}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Chức danh chuyên môn (Chuyên môn)</label>
              <select
                value={formData.chucDanhChuyenMon}
                onChange={(e) => setFormData({ ...formData, chucDanhChuyenMon: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Chọn Chuyên môn...</option>
                {chuyenMons.map((c) => (
                  <option key={c.id} value={c.ten}>{c.ten}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Khoa/Phòng công tác (Đơn vị công tác)</label>
              <select
                value={formData.donViCongTac}
                onChange={(e) => setFormData({ ...formData, donViCongTac: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">Chọn Đơn vị công tác...</option>
                {donViCongTacs.map((c) => (
                  <option key={c.id} value={c.ten}>{c.ten}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Loại cán bộ</label>
              <select
                value={formData.loaiCanBo}
                onChange={(e) => setFormData({ ...formData, loaiCanBo: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value={1}>Sĩ quan</option>
                <option value={2}>QN chuyên nghiệp</option>
                <option value={3}>CNV quốc phòng</option>
                <option value={4}>Lao động hợp đồng</option>
                <option value={5}>Khác</option>
              </select>
            </div>

            {/* Union Info */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Vai trò công đoàn</label>
              <select
                value={formData.vaiTro}
                onChange={(e) => setFormData({ ...formData, vaiTro: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value={1}>Đoàn viên</option>
                <option value={2}>Tổ trưởng Tổ CĐ</option>
                <option value={3}>Chủ tịch CĐBP</option>
                <option value={4}>Phó Chủ tịch CĐBP</option>
                <option value={5}>Chủ tịch CĐCS</option>
                <option value={6}>Phó Chủ tịch CĐCS</option>
                <option value={7}>Ủy viên BCH</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trạng thái sinh hoạt</label>
              <select
                value={formData.trangThai}
                onChange={(e) => setFormData({ ...formData, trangThai: Number(e.target.value) })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value={1}>Đang sinh hoạt</option>
                <option value={2}>Chuyển đi</option>
                <option value={3}>Nghỉ hưu</option>
                <option value={4}>Ra khỏi công đoàn</option>
                <option value={5}>Tạm dừng</option>
                <option value={6}>Khôi phục</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ngày vào công đoàn *</label>
              <input
                type="date"
                value={formData.ngayVaoCongDoan}
                onChange={(e) => setFormData({ ...formData, ngayVaoCongDoan: e.target.value })}
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            {/* Academic Info */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trình độ học vấn</label>
              <input
                type="text"
                value={formData.trinhDoHocVan}
                onChange={(e) => setFormData({ ...formData, trinhDoHocVan: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Học hàm / Học vị</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Học hàm"
                  value={formData.hocHam}
                  onChange={(e) => setFormData({ ...formData, hocHam: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
                <input
                  type="text"
                  placeholder="Học vị"
                  value={formData.hocVi}
                  onChange={(e) => setFormData({ ...formData, hocVi: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Đảng viên</label>
              <div className="flex items-center gap-3 mt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dangVien}
                    onChange={(e) => setFormData({ ...formData, dangVien: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500" />
                  <span className="ml-2 text-xs font-semibold text-slate-600">Là Đảng viên</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Ghi chú bổ sung</label>
            <textarea
              value={formData.ghiChu}
              onChange={(e) => setFormData({ ...formData, ghiChu: e.target.value })}
              rows={2}
              className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2 text-slate-850 focus:outline-none focus:border-blue-600 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* DYNAMIC LANGUAGES EDITING */}
          <div className="border-t border-slate-150 pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Danh sách Chứng chỉ Ngoại ngữ</span>
              <button
                type="button"
                onClick={handleAddLanguageRow}
                className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                ➕ Thêm ngoại ngữ
              </button>
            </div>

            <div className="space-y-4">
              {formData.ngoaiNgus && formData.ngoaiNgus.length > 0 ? (
                formData.ngoaiNgus.map((lang: MemberLanguageItem, index: number) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-50/55 border border-slate-200 p-4 rounded-xl items-end">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ngoại ngữ</label>
                      <select
                        value={lang.ngoaiNgu}
                        onChange={(e) => handleLanguageFieldChange(index, "ngoaiNgu", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                      >
                        {languagesList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {languagesList.length === 0 && <option value="TIENG_ANH">Tiếng Anh</option>}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Trình độ</label>
                      <select
                        value={lang.trinhDo}
                        onChange={(e) => handleLanguageFieldChange(index, "trinhDo", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
                      >
                        {levelsList.map((l) => (
                          <option key={l.ma} value={l.ma}>{l.ten}</option>
                        ))}
                        {levelsList.length === 0 && <option value="CO_BAN">Cơ bản</option>}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Điểm số</label>
                      <input
                        type="number"
                        step="0.1"
                        value={lang.diemSo}
                        onChange={(e) => handleLanguageFieldChange(index, "diemSo", parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Ngày cấp</label>
                      <input
                        type="date"
                        value={lang.ngayCap}
                        onChange={(e) => handleLanguageFieldChange(index, "ngayCap", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Đơn vị cấp</label>
                      <input
                        type="text"
                        value={lang.donViCap}
                        onChange={(e) => handleLanguageFieldChange(index, "donViCap", e.target.value)}
                        placeholder="e.g. British Council"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="URL chứng chỉ"
                        value={lang.fileChungChiUrl}
                        onChange={(e) => handleLanguageFieldChange(index, "fileChungChiUrl", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-600 focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLanguageRow(index)}
                        className="bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 px-3 py-2 rounded-xl transition-all cursor-pointer font-bold"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                  Đoàn viên chưa có chứng chỉ ngoại ngữ nào. Bấm nút Thêm ngoại ngữ ở trên để bổ sung.
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
            >
              Hủy chỉnh sửa
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            >
              Lưu thay đổi
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function MemberDetailPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
        <span className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
        <span>Đang tải thông tin...</span>
      </div>
    }>
      <MemberDetailContent />
    </Suspense>
  );
}
