import Link from "next/link";

export default function NotFound() {
  return <section className="panel space-y-3 p-6">
    <h1 className="text-xl font-semibold">Không tìm thấy trang</h1>
    <p className="text-sm text-copy">Đường dẫn có thể đã thay đổi hoặc không còn tồn tại.</p>
    <Link href="/" className="inline-block text-sm font-semibold text-brand-hover underline">Về tổng quan</Link>
  </section>;
}
