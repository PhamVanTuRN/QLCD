"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, ListTree, UserRoundPlus, Users } from "lucide-react";
import LoadState from "@/components/LoadState";
import { getStats } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useResource } from "@/lib/use-resource";

const number = new Intl.NumberFormat("vi-VN");
const currency = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });
const percent = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 });
const roleLabels: Record<string, string> = {
  DoanVien: "Đoàn viên", ToTruong: "Tổ trưởng", UyVienBCH: "Ủy viên BCH",
  ChuTichCDBP: "Chủ tịch CĐBP", PhoChuTichCDBP: "Phó chủ tịch CĐBP",
  ChuTichCDCS: "Chủ tịch CĐCS", PhoChuTichCDCS: "Phó chủ tịch CĐCS",
};

function Distribution({ title, rows }: { title: string; rows: { name: string; count: number }[] }) {
  const maximum = Math.max(1, ...rows.map(row => row.count));
  return <section className="panel min-w-0 p-4 sm:p-6">
    <h2 className="flex items-center gap-2.5 text-base font-bold text-ink">
      <span aria-hidden="true" className="h-4 w-1 shrink-0 rounded-full bg-brand" />{title}
    </h2>
    {rows.length === 0 ? <p className="mt-4 rounded-lg bg-soft px-3 py-3 text-sm text-muted">Chưa có dữ liệu.</p> :
      <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
        {rows.map((row, index) => <li key={`${row.name}-${index}`} className="space-y-1">
          <div className="flex justify-between gap-3 text-sm">
            <span className="min-w-0 break-words text-copy">{row.name}</span>
            <strong className="tabular-nums">{number.format(row.count)}</strong>
          </div>
          <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-soft">
            <div className="h-full rounded-full bg-brand" style={{ width: `${row.count / maximum * 100}%` }} />
          </div>
        </li>)}
      </ul>}
  </section>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useResource(getStats);
  const admin = user?.role === "ADMIN";
  const team = user?.role === "TOCD";
  const metrics = data ? [
    { label: "Đoàn viên đang sinh hoạt", value: data.tongDoanVien, detail: `${number.format(data.doanVienNu)} nữ (${percent.format(data.tiLeNu)}%)`,
      Icon: Users, color: "bg-brand-soft text-brand" },
    { label: "Tổ công đoàn", value: data.tongToCongDoan, detail: `${number.format(data.tongCDBP)} công đoàn bộ phận`,
      Icon: ListTree, color: "bg-teal-soft text-teal-ink" },
    { label: "Đoàn viên là đảng viên", value: data.doanVienDangVien, detail: `${percent.format(data.tiLeDangVien)}% đoàn số`,
      Icon: BadgeCheck, color: "bg-danger-soft text-danger" },
    { label: "Kết nạp tháng này", value: data.ketNapMoiThang, detail: `${number.format(data.chuyenDiThang)} chuyển đi · ${number.format(data.nghiHuuThang)} nghỉ hưu`,
      Icon: UserRoundPlus, color: "bg-gold-soft text-gold-ink" },
  ] : [];

  return <div className="space-y-5 sm:space-y-6">
    <header className="dashboard-hero flex min-h-52 items-center px-5 py-7 text-white sm:min-h-60 sm:px-8 lg:px-10">
      <div className="dashboard-hero-photo" aria-hidden="true" />
      <div className="min-w-0 sm:max-w-[56%]">
        <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-blue-50 sm:text-sm">
          <span className="h-0.5 w-5 shrink-0 rounded-full bg-gold" aria-hidden="true" />
          {user?.donViTen ?? "Bệnh viện Trung ương Quân đội 108"}
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Tổng quan công đoàn</h1>
        <Link href="/members" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-3.5 py-2.5 text-sm font-bold text-brand-strong hover:bg-brand-soft">
          Xem đoàn viên <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </header>
    {loading || error ? <LoadState loading={loading} retry={reload} /> : data && <>
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {metrics.map(({ label, value, detail, Icon, color }) => <div key={label} className="panel flex min-w-0 flex-col p-3.5 sm:p-5">
          <dt className="flex flex-col items-start gap-2 text-sm font-semibold text-copy">
            <span className={`grid size-9 place-items-center rounded-lg ${color}`}><Icon size={19} aria-hidden="true" /></span>
            {label}
          </dt>
          <dd className="my-1.5 text-3xl font-bold tabular-nums text-ink">{number.format(value)}</dd>
          <dd className="mt-auto text-xs text-muted sm:text-sm">{detail}</dd>
        </div>)}
      </dl>
      <div className="grid gap-4 lg:grid-cols-2">
        {(admin || user?.role === "CDCS") &&
          <Distribution title="Đoàn viên theo công đoàn bộ phận" rows={data.doanVienTheoCdbp} />}
        <Distribution title="Đoàn viên theo tổ công đoàn" rows={data.doanVienTheoToCd} />
        <Distribution title="Tình trạng sinh hoạt" rows={data.doanVienTheoTrangThai} />
        <Distribution title="Trình độ học vấn" rows={data.doanVienTheoTrinhDo} />
      </div>
      <section className="panel p-4 sm:p-6">
        <h2 className="text-base font-semibold">Hoạt động và nghiệp vụ</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div><dt className="text-sm text-copy">Hoạt động đã ghi nhận</dt><dd className="mt-1 text-xl font-semibold">{number.format(data.soHoatDong)}</dd></div>
          {!admin && <>
            <div><dt className="text-sm text-copy">Hồ sơ phúc lợi</dt><dd className="mt-1 text-xl font-semibold">{number.format(data.soLuotPhucLoi)}</dd></div>
            <div><dt className="text-sm text-copy">Hồ sơ sáng kiến</dt><dd className="mt-1 text-xl font-semibold">{number.format(data.soSangKien)}</dd></div>
            <div><dt className="text-sm text-copy">{team ? "Thu đoàn phí" : "Chênh lệch thu chi"}</dt>
              <dd className="mt-1 text-xl font-semibold">{currency.format(team ? data.tongThuDoanPhi : data.tonQuy)}</dd></div>
          </>}
        </dl>
      </section>
      <details className="panel p-4 sm:p-6">
        <summary className="cursor-pointer font-semibold text-ink">Xem phân bổ và số liệu nghiệp vụ</summary>
        <div className="mt-4 grid gap-3 xl:grid-cols-2">
          {(admin || user?.role === "CDCS") &&
            <Distribution title="Đoàn viên theo khối chuyên môn" rows={data.doanVienTheoKhoi} />}
          <Distribution title="Giới tính" rows={data.doanVienTheoGioiTinh.filter(row => row.count > 0)} />
          <Distribution title="Vai trò công đoàn" rows={data.doanVienTheoChucVu.map(row => ({
            ...row, name: roleLabels[row.name] ?? row.name,
          }))} />
          <Distribution title="Chứng chỉ theo ngoại ngữ" rows={data.doanVienTheoNgoaiNgu} />
          {!admin && <section className="panel p-4 sm:p-6">
            <h2 className="text-base font-semibold">Thi đua và tài chính</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt>Hồ sơ thi đua</dt><dd className="font-semibold">{number.format(data.soKetQuaThiDua)}</dd></div>
              <div className="flex justify-between gap-3">
                <dt>{team ? "Thu đoàn phí" : "Tổng thu"}</dt><dd className="font-semibold">{currency.format(data.tongThuDoanPhi)}</dd>
              </div>
              {!team && <div className="flex justify-between gap-3">
                <dt>Tổng chi</dt><dd className="font-semibold">{currency.format(data.tongChi)}</dd>
              </div>}
            </dl>
          </section>}
        </div>
      </details>
    </>}
  </div>;
}
