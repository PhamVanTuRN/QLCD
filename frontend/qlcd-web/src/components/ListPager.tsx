"use client";

export default function ListPager({ page, hasMore, loading, onChange }: {
  page: number; hasMore: boolean; loading?: boolean; onChange: (page: number) => void;
}) {
  return <nav aria-label="Phân trang" className="flex items-center justify-end gap-3 px-4 py-3 text-sm text-copy">
    <button type="button" disabled={page === 1 || loading} onClick={() => onChange(page - 1)}
      className="rounded border border-line px-3 py-1 disabled:opacity-40">Trang trước</button>
    <span>Trang {page}</span>
    <button type="button" disabled={!hasMore || loading} onClick={() => onChange(page + 1)}
      className="rounded border border-line px-3 py-1 disabled:opacity-40">Trang sau</button>
  </nav>;
}
