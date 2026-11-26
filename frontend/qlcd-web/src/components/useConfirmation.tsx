"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import FormDialog from "@/components/FormDialog";

// Resolve only after an explicit choice; closing or leaving the page always refuses.
export default function useConfirmation() {
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<((accepted: boolean) => void) | null>(null);
  useEffect(() => () => {
    pending.current?.(false);
    pending.current = null;
  }, []);

  const confirm = useCallback((text: string) => {
    if (pending.current) return Promise.resolve(false);
    return new Promise<boolean>(resolve => {
      pending.current = resolve;
      setMessage(text);
    });
  }, []);

  const finish = (accepted: boolean) => {
    const resolve = pending.current;
    pending.current = null;
    setMessage(null);
    resolve?.(accepted);
  };

  const confirmationDialog = message !== null ? <FormDialog label="Xác nhận thao tác" onClose={() => finish(false)}>
    <h2 className="text-lg font-bold text-ink">Xác nhận thao tác</h2>
    <p className="text-sm text-copy">{message}</p>
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" onClick={() => finish(false)} className="min-h-11 rounded-lg border border-edge px-4 py-2 font-semibold text-copy hover:bg-soft">Hủy</button>
      <button type="button" onClick={() => finish(true)} className="min-h-11 rounded-lg bg-danger px-4 py-2 font-semibold text-white hover:bg-danger-strong">Đồng ý</button>
    </div>
  </FormDialog> : null;

  return { confirm, confirmationDialog };
}
