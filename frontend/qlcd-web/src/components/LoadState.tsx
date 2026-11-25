import { CircleAlert, LoaderCircle } from "lucide-react";

export default function LoadState({ loading, message, retry }: { loading?: boolean; message?: string; retry?: () => void }) {
  if (loading) return <div role="status" className="panel flex items-center gap-3 p-5 text-sm text-copy">
    <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> Đang tải dữ liệu…
  </div>;
  return <div className="panel flex flex-wrap items-center gap-3 p-5 text-sm">
    <p role="alert" className="flex items-center gap-2 text-danger">
      <CircleAlert size={18} className="shrink-0" aria-hidden="true" /> {message ?? "Không thể tải dữ liệu."}
    </p>
    {retry && <button type="button" className="rounded-md bg-soft-strong px-3 py-2 font-semibold text-ink hover:bg-soft-strong"
      onClick={retry}>Thử lại</button>}
  </div>;
}
