"use client";

import { X } from "lucide-react";

export default function DialogCloseButton({ onClose, disabled = false }: {
  onClose: () => void;
  disabled?: boolean;
}) {
  return <button type="button" aria-label="Đóng hộp thoại" title={disabled ? "Đang xử lý, vui lòng chờ" : "Đóng hộp thoại"}
    disabled={disabled} onClick={() => { if (!disabled) onClose(); }}
    className="grid size-11 shrink-0 place-items-center rounded-lg border border-edge bg-surface text-ink hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-50">
    <X size={22} aria-hidden="true" />
  </button>;
}
