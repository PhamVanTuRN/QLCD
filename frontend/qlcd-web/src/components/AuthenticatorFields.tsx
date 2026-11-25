"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { AuthenticatorSetup } from "@/lib/api";

export const securityInput = "min-h-11 w-full min-w-0 rounded-lg border border-edge bg-surface px-3 py-2 text-ink";

export function OtpField({ value, onChange, autoFocus }: { value: string; onChange: (value: string) => void; autoFocus?: boolean }) {
  const id = useId();
  return <div className="space-y-1 text-sm text-copy">
    <label htmlFor={id} className="block font-semibold">Mã Authenticator</label>
    <input id={id} className={`${securityInput} font-mono text-lg tracking-[0.25em]`} inputMode="numeric"
      autoComplete="one-time-code" pattern="[0-9]{6}" autoFocus={autoFocus} required value={value}
      aria-describedby={`${id}-help`} onChange={event => onChange(event.target.value.replace(/[^0-9]/g, "").slice(0, 6))} />
    <p id={`${id}-help`} className="text-muted">Nhập hoặc dán 6 chữ số từ ứng dụng Authenticator.</p>
  </div>;
}

export function AuthenticatorQr({ setup }: { setup: AuthenticatorSetup }) {
  return <div className="flex flex-wrap items-start gap-4 text-sm text-copy">
    <Image src={setup.qrImage} alt="Mã QR để thêm Công đoàn số 108 vào Authenticator" width={168} height={168}
      unoptimized className="rounded-lg border border-line" />
    <div className="min-w-0 flex-1 basis-40 space-y-2">
      <p>Cài hoặc mở Google Authenticator hay Microsoft Authenticator. Chọn thêm tài khoản và quét mã QR.</p>
      <details>
        <summary className="cursor-pointer font-semibold text-brand">Nhập khóa thiết lập thủ công</summary>
        <p className="mt-2">Chọn loại mã theo thời gian và giữ riêng khóa bên dưới.</p>
        <code className="mt-2 block rounded-lg bg-soft p-2 break-all text-ink">{setup.key}</code>
      </details>
      <p className="text-muted">Mã thiết lập có hiệu lực trong 10 phút.</p>
    </div>
  </div>;
}

export function RecoveryCodes({ codes, onContinue }: { codes: string[]; onContinue: () => void }) {
  const [copied, setCopied] = useState(false);
  return <section className="space-y-3" aria-label="Mã khôi phục">
    <h2 className="text-lg font-bold text-ink">Lưu mã khôi phục</h2>
    <p className="text-sm text-copy">Lưu ở nơi riêng tư. Mỗi mã chỉ dùng cho một lần khôi phục Authenticator. Sau khi khôi phục, bộ mã cũ hết hiệu lực.</p>
    <ul className="grid gap-1 rounded-lg bg-soft p-3 text-xs text-ink sm:grid-cols-2">
      {codes.map(code => <li key={code} className="break-all"><code>{code}</code></li>)}
    </ul>
    <div className="flex flex-wrap gap-2">
      <button type="button" className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-brand" onClick={async () => {
        try { await navigator.clipboard.writeText(codes.join("\n")); setCopied(true); }
        catch { setCopied(false); }
      }}>Sao chép bộ mã</button>
      <button type="button" onClick={onContinue} className="rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white">Tôi đã lưu mã</button>
    </div>
    {copied && <p role="status" className="text-sm text-success">Đã sao chép.</p>}
  </section>;
}
