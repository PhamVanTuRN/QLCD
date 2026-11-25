"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import LoadState from "@/components/LoadState";
import { getEmulationSummary } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function QualityPage() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [yearInput, setYearInput] = useState(String(year));
  const load = useCallback((signal: AbortSignal) => getEmulationSummary(year, signal), [year]);
  const { data, error, loading, reload } = useResource(load);

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tổng hợp kết quả thi đua</h1>
        <p className="mt-1 text-sm text-copy">Hồ sơ thi đua theo năm trong phạm vi quản lý.</p>
      </div>
      <form className="flex flex-wrap items-end gap-2" onSubmit={event => {
        event.preventDefault();
        setYear(Number(yearInput));
      }}>
        <label className="space-y-1 text-sm text-copy">
          <span className="block">Năm báo cáo</span>
          <input type="number" inputMode="numeric" min={1900} max={2100} required
            className="w-28 rounded-lg border border-edge bg-surface p-2"
            value={yearInput} onChange={event => setYearInput(event.target.value)} />
        </label>
        <button type="submit" className="rounded-lg bg-brand px-3 py-2 font-semibold text-white hover:bg-brand-hover">
          Xem báo cáo
        </button>
      </form>
    </header>
    {loading || error ? <LoadState loading={loading} retry={reload} /> : data && <>
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Đã đăng ký", data.registered],
          ["Đã đánh giá", data.evaluated],
          ["Đã khen thưởng", data.awarded],
        ].map(([label, count]) => <div key={label} className="panel p-5">
          <dt className="text-sm text-copy">{label}</dt>
          <dd className="mt-2 text-3xl font-semibold tabular-nums text-brand-strong">{count}</dd>
        </div>)}
      </dl>
      <section className="panel p-4 sm:p-6">
        <h2 className="text-lg font-semibold">Xếp loại đã ghi nhận năm {data.year}</h2>
        {data.ratings.length === 0 ? (
          <p className="mt-3 text-sm text-copy">Chưa có kết quả đánh giá hoặc khen thưởng trong năm này.</p>
        ) : <dl className="mt-2 divide-y divide-line">
          {data.ratings.map(rating => <div key={rating.code} className="flex justify-between gap-4 py-3 text-sm">
            <dt className="min-w-0 break-words">{rating.name}</dt>
            <dd className="shrink-0 font-semibold tabular-nums">{rating.count} hồ sơ</dd>
          </div>)}
        </dl>}
        <Link href="/emulations" className="mt-4 inline-block text-sm font-semibold text-brand-hover underline">Xem hồ sơ thi đua</Link>
      </section>
    </>}
  </div>;
}
