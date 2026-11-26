"use client";

import DialogCloseButton from "@/components/DialogCloseButton";
import { useEffect, useRef, type ReactNode } from "react";

export default function FormDialog({ label, onClose, busy, wide, children }: {
  label: string;
  onClose: () => void;
  busy?: boolean;
  wide?: boolean;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element || element.open) return;

    const trigger = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      if (document.activeElement === document.body && trigger instanceof HTMLElement && trigger.isConnected) {
        trigger.focus();
      }
    };
  }, []);

  return <dialog ref={dialog} aria-label={label} aria-busy={busy}
    onCancel={event => {
      event.preventDefault();
      event.stopPropagation();
      if (!busy) onClose();
    }}
    className={`form-dialog panel space-y-5 p-4 sm:p-6 ${wide ? "max-w-2xl" : "max-w-lg"}`}>
    <div className="sticky top-0 z-10 flex justify-end bg-surface">
      <DialogCloseButton onClose={onClose} disabled={busy} />
    </div>
    {children}
  </dialog>;
}
