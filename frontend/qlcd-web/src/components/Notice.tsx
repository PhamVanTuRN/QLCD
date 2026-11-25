"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

type NoticeValue = { type: "success" | "error"; message: string };

export function useNotice() {
  const [notice, setNotice] = useState<NoticeValue | null>(null);
  useEffect(() => {
    if (!notice || notice.type === "error") return;
    const timer = setTimeout(() => setNotice(null), 5500);
    return () => clearTimeout(timer);
  }, [notice]);
  return {
    notice,
    dismiss: () => setNotice(null),
    showAlert: (type: NoticeValue["type"], message: string) => setNotice({ type, message }),
  };
}

export default function Notice({ value, dismiss }: { value: NoticeValue | null; dismiss: () => void }) {
  if (!value) return null;
  return <div className={`fixed inset-x-4 top-4 z-[60] ml-auto flex max-w-md items-center gap-3 rounded-lg border p-3 shadow-xl sm:left-auto
    ${value.type === "error" ? "border-danger-line bg-danger-soft text-danger-strong" : "border-success-line bg-success-soft text-success"}`}>
    <p role={value.type === "error" ? "alert" : "status"} className="grow text-sm">{value.message}</p>
    <button type="button" className="shrink-0 rounded p-1.5 hover:bg-white/10" aria-label="Đóng thông báo" onClick={dismiss}>
      <X size={16} aria-hidden="true" />
    </button>
  </div>;
}
