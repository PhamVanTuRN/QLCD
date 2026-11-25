"use client";

import LoadState from "@/components/LoadState";

export default function PageError({ retry }: { retry: () => void }) {
  return <LoadState message="Trang gặp lỗi khi hiển thị." retry={retry} />;
}
