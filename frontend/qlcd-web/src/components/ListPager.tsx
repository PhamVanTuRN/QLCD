"use client";

export default function ListPager({ page, hasMore, loading, onChange, totalCount, pageSize }: {
  page: number; hasMore: boolean; loading?: boolean; onChange: (page: number) => void;
  totalCount?: number; pageSize?: number;
}) {
  const counted = totalCount !== undefined && pageSize !== undefined;
  return <nav aria-label="Phân trang" className="list-pager">
    {counted && <span className="mr-auto" role="status">
      {totalCount === 0 ? "0 bản ghi" : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} / ${totalCount.toLocaleString("vi-VN")} bản ghi`}
    </span>}
    <button type="button" disabled={page <= 1 || loading} onClick={() => onChange(page - 1)}
      className="rounded-lg border border-line px-3 py-2 disabled:opacity-40">Trang trước</button>
    <span aria-live="polite" aria-atomic="true">Trang {page}{counted && ` / ${Math.max(1, Math.ceil(totalCount / pageSize))}`}</span>
    <button type="button" disabled={!hasMore || loading} onClick={() => onChange(page + 1)}
      className="rounded-lg border border-line px-3 py-2 disabled:opacity-40">Trang sau</button>
  </nav>;
}
