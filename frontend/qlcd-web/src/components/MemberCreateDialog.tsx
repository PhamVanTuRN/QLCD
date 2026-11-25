"use client";

import Link from "next/link";
import { useCallback, useRef, useState, type FormEvent } from "react";
import FormDialog from "@/components/FormDialog";
import LoadState from "@/components/LoadState";
import { apiMessage, createMember, getCatalogsApi } from "@/lib/api";
import type { MemberInput, MemberLanguageInput } from "@/lib/business-types";
import { useResource } from "@/lib/use-resource";

const control = "min-h-10 w-full min-w-0 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-ink";
const roles = [
  ["DoanVien", "Đoàn viên"], ["ToTruong", "Tổ trưởng"], ["ChuTichCDBP", "Chủ tịch CĐBP"],
  ["PhoChuTichCDBP", "Phó chủ tịch CĐBP"], ["ChuTichCDCS", "Chủ tịch CĐCS"],
  ["PhoChuTichCDCS", "Phó chủ tịch CĐCS"], ["UyVienBCH", "Ủy viên BCH"],
];
const staffTypes = [
  ["SiQuan", "Sĩ quan"], ["QuanNhanChuyenNghiep", "Quân nhân chuyên nghiệp"],
  ["CongNhanVienChucQuocPhong", "Công nhân, viên chức quốc phòng"],
  ["LaoDongHopDong", "Lao động hợp đồng"], ["Khac", "Khác"],
];

type LanguageRow = MemberLanguageInput & { key: number };

function vietnamToday() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function isAdultAtJoining(birth: string, joining: string) {
  const [year, month, day] = birth.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year + 18, month, 0)).getUTCDate();
  const birthday = new Date(Date.UTC(year + 18, month - 1, Math.min(day, lastDay)));
  return birthday.getTime() <= Date.parse(joining);
}

export default function MemberCreateDialog({
  units, defaultUnitId, loadingUnits, unitLoadFailed, reloadUnits, canManageTeams, onCreated, onClose,
}: {
  units: { id: string; name: string }[];
  defaultUnitId?: string;
  loadingUnits: boolean;
  unitLoadFailed: boolean;
  reloadUnits: () => void;
  canManageTeams: boolean;
  onCreated: (id: string) => void;
  onClose: () => void;
}) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [languages, setLanguages] = useState<LanguageRow[]>([]);
  const inFlight = useRef(false);
  const nextKey = useRef(0);
  const today = vietnamToday();
  const initialUnit = units.find(unit => unit.id === defaultUnitId)?.id ?? (units.length === 1 ? units[0].id : "");

  const readCatalogs = useCallback((signal: AbortSignal) => Promise.all([
    getCatalogsApi({ loai: "NgoaiNgu", activeOnly: true }, signal),
    getCatalogsApi({ loai: "TrinhDoNgoaiNgu", activeOnly: true }, signal),
  ]), []);
  const { data: catalogs, error: catalogError, loading: loadingCatalogs, reload: reloadCatalogs } = useResource(readCatalogs);
  const [languageOptions, levelOptions] = catalogs ?? [[], []];

  function addLanguage() {
    if (!languageOptions.length || !levelOptions.length || languages.length >= 20) return;
    const key = nextKey.current++;
    setLanguages(rows => [...rows, {
      key, ngoaiNgu: languageOptions[0].ma, trinhDo: levelOptions[0].ma, diemSo: 0,
      ngayCap: "", donViCap: "", fileChungChiUrl: null,
    }]);
  }

  function updateLanguage(key: number, change: Partial<MemberLanguageInput>) {
    setLanguages(rows => rows.map(row => row.key === key ? { ...row, ...change } : row));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const form = new FormData(event.currentTarget);
    const field = (name: string) => String(form.get(name) ?? "").trim();
    if (!field("hoTen") || !field("maNhanVien")) {
      setError("Nhập họ và tên và mã nhân viên.");
      return;
    }
    if (!isAdultAtJoining(field("ngaySinh"), field("ngayVaoCongDoan"))) {
      setError("Đoàn viên phải đủ 18 tuổi vào ngày vào công đoàn.");
      return;
    }
    const payload: MemberInput = {
      hoTen: field("hoTen"), ngaySinh: field("ngaySinh"), gioiTinh: Number(field("gioiTinh")),
      soCCCD: field("soCCCD"), maNhanVien: field("maNhanVien"), maToCongDoan: field("maToCongDoan"),
      ngayVaoCongDoan: field("ngayVaoCongDoan"), vaiTro: field("vaiTro"), loaiCanBo: field("loaiCanBo"),
      chucVu: field("chucVu") || null, donViCongTac: field("donViCongTac") || null,
      chucDanhChuyenMon: field("chucDanhChuyenMon") || null, trinhDoHocVan: field("trinhDoHocVan") || null,
      dienThoai: field("dienThoai") || null, email: field("email") || null, dangVien: form.has("dangVien"),
      ngoaiNgus: languages.map(({ ngoaiNgu, trinhDo, diemSo, ngayCap, donViCap, fileChungChiUrl }) => ({
        ngoaiNgu, trinhDo, diemSo, ngayCap, donViCap: donViCap?.trim() || null, fileChungChiUrl,
      })),
    };
    inFlight.current = true;
    setSubmitting(true);
    setError("");
    try {
      onCreated(await createMember(payload));
    } catch (error) {
      setError(apiMessage(error, "Không thể lưu hồ sơ đoàn viên. Vui lòng thử lại."));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return <FormDialog label="Thêm đoàn viên" onClose={onClose} busy={submitting} wide>
    <h2 className="text-lg font-semibold text-ink">Thêm đoàn viên mới</h2>
    {loadingUnits || unitLoadFailed ? (
      <LoadState loading={loadingUnits} message="Không thể tải danh sách đơn vị công đoàn." retry={reloadUnits} />
    ) : units.length === 0 ? (
      <div className="space-y-4 text-sm text-copy">
        <p>Chưa có đơn vị đủ điều kiện tiếp nhận đoàn viên trong phạm vi tài khoản.</p>
        {canManageTeams ? <>
          <p>Vào Cây tổ chức để tạo một tổ dưới CĐCS hoặc CĐBP, hoặc mở lại tổ đã ngừng hoạt động.</p>
          <Link href="/organizations" className="inline-block rounded-lg bg-brand px-4 py-2 font-semibold text-white">
            Mở Cây tổ chức
          </Link>
        </> : <p>Liên hệ quản trị viên để kiểm tra đơn vị được phân công.</p>}
        <button type="button" onClick={onClose} className="ml-2 rounded-lg border border-edge px-4 py-2">Đóng</button>
      </div>
    ) : <form onSubmit={submit} className="space-y-5">
      <fieldset disabled={submitting} className="min-w-0 space-y-5">
        <legend className="sr-only">Thông tin hồ sơ đoàn viên</legend>
        <div className="grid gap-4 text-sm sm:grid-cols-2 [&>label]:space-y-1 [&>label>span]:block">
          <label><span>Họ và tên *</span><input className={control} name="hoTen" required maxLength={100} /></label>
          <label><span>Ngày sinh *</span><input className={control} name="ngaySinh" type="date" required max={today} /></label>
          <label><span>Số CCCD/CMTQĐ *</span><input className={control} name="soCCCD" inputMode="numeric"
            required maxLength={12} pattern="[0-9]{9,12}" title="Nhập từ 9 đến 12 chữ số" /></label>
          <label><span>Mã nhân viên *</span><input className={control} name="maNhanVien" required maxLength={20} /></label>
          <div className="space-y-1">
            <label className="block" htmlFor="member-admission-unit">Đơn vị Công đoàn *</label>
            <select className={control} id="member-admission-unit" name="maToCongDoan" defaultValue={initialUnit}
              required aria-describedby="member-admission-note">
            <option value="">Chọn đơn vị tiếp nhận</option>
            {units.map(unit => <option key={unit.id} value={unit.id}>{unit.name}</option>)}
            </select>
            <p id="member-admission-note" className="text-xs text-muted">
              Có thể chọn trực tiếp Công đoàn bộ phận đang hoạt động nếu chưa có tổ.
            </p>
          </div>
          <label><span>Ngày vào CĐ *</span><input className={control} name="ngayVaoCongDoan" type="date" required max={today} /></label>
          <label><span>Giới tính</span><select className={control} name="gioiTinh" defaultValue="1">
            <option value="1">Nam</option><option value="0">Nữ</option><option value="2">Khác</option>
          </select></label>
          <label><span>Loại cán bộ</span><select className={control} name="loaiCanBo" defaultValue="Khac">
            {staffTypes.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select></label>
          <label><span>Vai trò công đoàn</span><select className={control} name="vaiTro">
            {roles.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
          </select></label>
          <label><span>Điện thoại</span><input className={control} name="dienThoai" type="tel" maxLength={16}
            pattern="[+]?[0-9]{9,15}" title="9 đến 15 chữ số, có thể bắt đầu bằng dấu cộng" /></label>
          <label><span>Email</span><input className={control} name="email" type="email" maxLength={254} /></label>
          <label><span>Chức vụ</span><input className={control} name="chucVu" /></label>
          <label><span>Đơn vị công tác</span><input className={control} name="donViCongTac" /></label>
          <label><span>Chuyên môn</span><input className={control} name="chucDanhChuyenMon" /></label>
          <label><span>Trình độ học vấn</span><select className={control} name="trinhDoHocVan">
            <option value="">Chọn trình độ</option>
            {["Trung cấp", "Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ"].map(level => <option key={level}>{level}</option>)}
          </select></label>
          <label className="flex items-center gap-2 !space-y-0"><input name="dangVien" type="checkbox" /> Là Đảng viên</label>
        </div>

        <section className="space-y-3 border-t border-line pt-4" aria-labelledby="create-member-languages">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id="create-member-languages" className="text-sm font-semibold">Chứng chỉ ngoại ngữ</h3>
            <button type="button" onClick={addLanguage} disabled={!languageOptions.length || !levelOptions.length || languages.length >= 20}
              className="rounded-lg border border-edge px-3 py-2 text-sm text-brand-strong disabled:opacity-50">Thêm ngoại ngữ</button>
          </div>
          {loadingCatalogs && <p role="status" className="text-sm text-muted">Đang tải danh mục ngoại ngữ…</p>}
          {Boolean(catalogError) && <LoadState message="Không thể tải danh mục ngoại ngữ." retry={reloadCatalogs} />}
          {catalogs && (!languageOptions.length || !levelOptions.length) &&
            <p className="text-sm text-muted">Cần có danh mục ngoại ngữ và trình độ để thêm chứng chỉ.</p>}
          {languages.map((language, index) => <fieldset key={language.key}
            className="grid min-w-0 gap-3 rounded-lg border border-line p-3 text-sm sm:grid-cols-2 [&>label]:space-y-1 [&>label>span]:block">
            <legend className="px-1 text-copy">Chứng chỉ {index + 1}</legend>
            <label><span>Ngoại ngữ</span><select className={control} value={language.ngoaiNgu}
              onChange={event => updateLanguage(language.key, { ngoaiNgu: event.target.value })}>
              {languageOptions.map(item => <option key={item.ma} value={item.ma}>{item.ten}</option>)}
            </select></label>
            <label><span>Trình độ</span><select className={control} value={language.trinhDo}
              onChange={event => updateLanguage(language.key, { trinhDo: event.target.value })}>
              {levelOptions.map(item => <option key={item.ma} value={item.ma}>{item.ten}</option>)}
            </select></label>
            <label><span>Điểm số</span><input className={control} type="number" min={0} step="0.01" value={language.diemSo}
              onChange={event => updateLanguage(language.key, { diemSo: Number(event.target.value) })} /></label>
            <label><span>Ngày cấp *</span><input className={control} type="date" required max={today} value={language.ngayCap}
              onChange={event => updateLanguage(language.key, { ngayCap: event.target.value })} /></label>
            <label><span>Đơn vị cấp</span><input className={control} value={language.donViCap ?? ""}
              onChange={event => updateLanguage(language.key, { donViCap: event.target.value })} /></label>
            <button type="button" className="justify-self-start self-end rounded-lg px-3 py-2 text-danger"
              onClick={() => setLanguages(rows => rows.filter(row => row.key !== language.key))}>Xóa chứng chỉ {index + 1}</button>
          </fieldset>)}
        </section>
      </fieldset>
      {error && <p role="alert" className="rounded-lg border border-danger-line bg-danger-soft p-3 text-sm text-danger-strong">{error}</p>}
      <div className="flex flex-wrap justify-end gap-3 border-t border-line pt-3 text-sm">
        <button type="button" disabled={submitting} onClick={onClose} className="rounded-lg border border-edge px-4 py-2">Hủy bỏ</button>
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand px-4 py-2 font-semibold text-white disabled:opacity-50">
          {submitting ? "Đang lưu…" : "Xác nhận thêm đoàn viên"}
        </button>
      </div>
    </form>}
  </FormDialog>;
}
