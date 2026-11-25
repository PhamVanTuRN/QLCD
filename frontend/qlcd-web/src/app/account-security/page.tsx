"use client";

import { ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import LoadState from "@/components/LoadState";
import { AuthenticatorQr, OtpField, RecoveryCodes, securityInput } from "@/components/AuthenticatorFields";
import {
  apiMessage, beginAuthenticatorSetup, confirmAuthenticatorSetup, rotateRecoveryCodes,
  getAuthenticatorStatus, type AuthenticatorSetup,
} from "@/lib/api";
import { useResource } from "@/lib/use-resource";
import { useAuth } from "@/lib/auth-context";

export default function AccountSecurity() {
  const { refreshSession, logout } = useAuth();
  const { data, loading, error: loadError, reload } = useResource(getAuthenticatorStatus);
  const [pending, setPending] = useState<AuthenticatorSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [rotating, setRotating] = useState(false);
  const [password, setPassword] = useState("");
  const [activation, setActivation] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function clearForm() {
    setPending(null);
    setPassword("");
    setActivation("");
    setCode("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !data) return;
    setError("");
    setBusy(true);
    try {
      if (!pending && data.needsAuthenticator) {
        setPending(await beginAuthenticatorSetup(password, activation.trim()));
        setPassword("");
        setActivation("");
        return;
      }
      const codes = pending
        ? (await confirmAuthenticatorSetup(pending.setup, code)).codes
        : await rotateRecoveryCodes(password, code);
      clearForm();
      setRecoveryCodes(codes);
    } catch (failure) {
      setError(apiMessage(failure, "Không thể cập nhật thiết lập Authenticator."));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  return <div className="mx-auto w-full max-w-3xl space-y-5 p-4 sm:p-6">
    <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Bảo mật tài khoản</h1>
    {loading || loadError || !data ? <LoadState loading={loading} retry={reload} /> :
      <section className="panel space-y-5 p-5 sm:p-6" aria-labelledby="authenticator-title">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-brand-soft text-brand"><ShieldCheck size={22} aria-hidden="true" /></span>
          <h2 id="authenticator-title" className="grow text-lg font-bold text-ink">Xác thực hai bước</h2>
          <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand-strong">
            {!data.needsAuthenticator || recoveryCodes ? "Đang bật" : "Cần thiết lập"}
          </span>
        </div>
        {recoveryCodes ? <RecoveryCodes codes={recoveryCodes} onContinue={async () => {
          await refreshSession();
          setRecoveryCodes(null);
          setRotating(false);
          if (!data.needsAuthenticator) reload();
        }} /> : (data.needsAuthenticator || rotating) ?
          <form className="space-y-4 border-t border-line pt-5 text-sm" onSubmit={submit}>
            <fieldset disabled={busy} className="min-w-0 space-y-4">
              {pending ? <AuthenticatorQr setup={pending} /> : <>
                {data.needsAuthenticator && <p className="text-copy">Nhập mật khẩu và mã kích hoạt do quản trị viên cung cấp qua kênh riêng.</p>}
                {data.needsAuthenticator && !data.requiresActivation &&
                  <p className="rounded-lg bg-gold-soft p-3 text-gold-ink">Tài khoản đang chờ cấp mã. Liên hệ quản trị viên để xác minh danh tính và nhận mã.</p>}
                {!data.needsAuthenticator && <p className="text-copy">Tạo bộ mã mới sẽ vô hiệu hóa bộ mã khôi phục hiện tại.</p>}
                <label className="block max-w-sm space-y-1">
                  <span className="font-semibold">Mật khẩu hiện tại</span>
                  <input type="password" className={securityInput} autoComplete="current-password" maxLength={128} required
                    value={password} onChange={event => setPassword(event.target.value)} />
                </label>
                {data.needsAuthenticator && <label className="block max-w-sm space-y-1">
                  <span className="font-semibold">Mã kích hoạt</span>
                  <input className={securityInput} autoComplete="off" spellCheck={false} maxLength={32} required
                    value={activation} onChange={event => setActivation(event.target.value)} pattern="[A-Fa-f0-9]{32}" />
                </label>}
              </>}
              {(pending || rotating) && <div className="max-w-sm"><OtpField value={code} onChange={setCode} autoFocus={!!pending} /></div>}
              {error && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-danger-strong">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={data.needsAuthenticator && !data.requiresActivation}
                  className="rounded-lg bg-brand px-4 py-2.5 font-semibold text-white hover:bg-brand-hover disabled:opacity-50">
                  {busy ? "Đang xử lý…" : pending ? "Xác nhận và bật" : rotating ? "Xác nhận tạo mã" : "Tạo mã QR"}
                </button>
                {(pending || rotating) && <button type="button" onClick={() => { clearForm(); setRotating(false); }}
                  className="rounded-lg border border-line px-4 py-2.5 font-semibold text-copy hover:bg-soft">Hủy</button>}
                {data.needsAuthenticator && <button type="button" onClick={async () => {
                  if (!await logout()) setError("Không thể đăng xuất. Vui lòng thử lại.");
                }} className="rounded-lg border border-line px-4 py-2.5 font-semibold text-copy">Đăng xuất</button>}
              </div>
            </fieldset>
          </form> : <>
            <p className="text-sm text-copy">Mã Authenticator là bước bắt buộc khi đăng nhập và đổi mật khẩu. Khi đổi điện thoại hoặc mất Authenticator, dùng mã khôi phục tại bước nhập mã đăng nhập.</p>
            <button type="button" onClick={() => setRotating(true)} className="rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover">
              {data.hasRecoveryCodes ? "Tạo lại mã khôi phục" : "Tạo mã khôi phục"}
            </button>
          </>}
      </section>}
  </div>;
}
