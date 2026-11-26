/** A keyboard/touch alternative to hover-only titles for long table content. */
export default function TableText({ text }: { text?: string | null }) {
  if (!text || text.length <= 120) return <>{text || "—"}</>;
  return <details className="table-text">
    <summary>
      <span className="table-text-preview line-clamp-3">{text.slice(0, 120)}… </span>
      <span className="table-text-more text-brand underline">Xem đầy đủ</span>
      <span className="table-text-less text-brand underline">Thu gọn</span>
    </summary>
    <p className="mt-2 whitespace-pre-wrap">{text}</p>
  </details>;
}
