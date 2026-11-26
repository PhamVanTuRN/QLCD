"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { AuthenticatorQr, OtpField, RecoveryCodes, securityInput } from "@/components/AuthenticatorFields";
import { beginAuthenticatorRecovery, confirmAuthenticatorSetup, loginErrorMessage, type AuthenticatorSetup } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const passwordRules = [
  { label: "Từ 8 đến 128 ký tự", matches: (value: string) => value.length >= 8 && value.length <= 128 },
  { label: "Có chữ hoa", matches: (value: string) => upper.test(value) },
  { label: "Có chữ thường", matches: (value: string) => lower.test(value) },
  { label: "Có chữ số", matches: (value: string) => digit.test(value) },
  { label: "Có ký tự đặc biệt", matches: (value: string) => special.test(value) },
  { label: "Khác mật khẩu mặc định", matches: (value: string) => Boolean(value) && value !== "123456aA@" },
];
const upper = new RegExp("\\p{Lu}", "u");
const lower = new RegExp("\\p{Ll}", "u");
const digit = new RegExp("\\p{Nd}", "u");
const special = new RegExp("[\\p{P}\\p{S}]", "u");

export default function LoginPage() {
  const { login, verifyAuthenticator, logout, changePassword, user } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const changing = !!user && !user.needsAuthenticator && (user.mustChangePassword || search.get("change") === "1");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [challenge, setChallenge] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [setup, setSetup] = useState<AuthenticatorSetup | null>(null);
  const [replacementCodes, setReplacementCodes] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.needsAuthenticator) router.replace("/account-security");
    else if (user && !changing) router.replace("/");
  }, [user, changing, router]);

  function backToPassword() {
    setChallenge("");
    setRecovering(false);
    setRecoveryCode("");
    setSetup(null);
    setCode("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setNotice("");
    if (changing && nextPassword !== confirmation) {
      setError("Mật khẩu mới và xác nhận mật khẩu cần trùng khớp.");
      return;
    }
    if (changing && (nextPassword === password || !passwordRules.every(rule => rule.matches(nextPassword)))) {
      setError("Mật khẩu mới phải đáp ứng các điều kiện bên dưới và khác mật khẩu hiện tại.");
      return;
    }
    setBusy(true);
    try {
      if (recovering) {
        if (setup) {
          const result = await confirmAuthenticatorSetup(setup.setup, code, true);
          setSetup(null);
          setReplacementCodes(result.codes);
        } else {
          setSetup(await beginAuthenticatorRecovery(challenge, recoveryCode.trim()));
          setRecoveryCode("");
        }
        setCode("");
        return;
      }

      const result = changing ? await changePassword(password, nextPassword, confirmation, code)
        : challenge ? await verifyAuthenticator(challenge, code) : await login(username, password, enrolling ? activationCode.trim() : undefined);
      setCode("");
      if (!result.success) {
        if ("expired" in result && result.expired) backToPassword();
        setError(result.error ?? "Không thể xử lý yêu cầu.");
        return;
      }
      setPassword("");
      setEnrolling(false);
      setActivationCode("");
      setNextPassword("");
      setConfirmation("");
      if ("challenge" in result && typeof result.challenge === "string") setChallenge(result.challenge);
      else setChallenge("");
      if (changing) {
        setNotice("Đã đổi mật khẩu. Vui lòng đăng nhập lại.");
        router.replace("/login");
      }
    } catch (failure) {
      setError(loginErrorMessage(failure, "Không thể khôi phục Authenticator."));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  if (user && !changing) return null;

  const title = changing ? "Đổi mật khẩu" : recovering ? "Khôi phục Authenticator" : challenge ? "Xác thực hai bước" : "Đăng nhập";
  const action = busy ? "Đang xử lý…" : changing ? "Đổi mật khẩu" : recovering ? (setup ? "Xác nhận thiết bị mới" : "Tiếp tục khôi phục")
    : challenge ? "Xác nhận mã" : "Đăng nhập";

  return (
    <main className="min-h-dvh bg-surface lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:p-4">
      <div className="login-cover hidden min-h-[36rem] flex-col justify-end rounded-[1.35rem] p-10 lg:flex xl:p-14">
        <div className="mb-5 h-1 w-14 rounded-full bg-gold" aria-hidden="true" />
        <p className="max-w-lg text-4xl leading-tight font-bold tracking-tight xl:text-5xl">Công đoàn số 108</p>
        <p className="mt-3 max-w-md text-base font-medium text-blue-100 xl:text-lg">Bệnh viện Trung ương Quân đội 108</p>
      </div>
      <div className="grid min-h-dvh place-items-center border-t-4 border-brand bg-background px-5 py-10 sm:px-8 lg:min-h-0 lg:border-0 lg:bg-surface">
        <section className="w-full max-w-sm" aria-labelledby="login-title">
          <div className="mb-8 flex items-center gap-3 lg:mb-10">
            <BrandMark />
            <div className="lg:hidden">
              <p className="font-bold text-ink">Công đoàn số 108</p>
              <p className="text-sm text-muted">Bệnh viện Trung ương Quân đội 108</p>
            </div>
          </div>
          <h1 id="login-title" className="mb-6 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
          {changing && user?.mustChangePassword && <p role="status" className="mb-4 rounded-lg bg-gold-soft p-3 text-sm text-gold-ink">
            Bạn đang dùng mật khẩu tạm sau khi được đặt lại. Hãy đổi mật khẩu để tiếp tục và xác nhận bằng Authenticator đã đăng ký.
          </p>}
          {replacementCodes ? <RecoveryCodes codes={replacementCodes} onContinue={() => {
            setReplacementCodes(null);
            backToPassword();
            setNotice("Đã thay Authenticator. Hãy đăng nhập lại bằng mật khẩu và mã mới.");
          }} /> : <form onSubmit={submit}>
            <fieldset disabled={busy} className="min-w-0 space-y-4">
              {!changing && !challenge && <label className="block space-y-1 text-sm text-copy">
                <span>Tên đăng nhập</span>
                <input className={securityInput} value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" maxLength={50} required />
              </label>}
              {(changing || !challenge) && <label className="block space-y-1 text-sm text-copy">
                <span>{changing ? "Mật khẩu hiện tại" : "Mật khẩu"}</span>
                <input className={securityInput} type="password" value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password" maxLength={128} required />
              </label>}
              {!changing && !challenge && enrolling && <div className="space-y-1 text-sm text-copy">
                <label htmlFor="login-activation" className="block">Mã kích hoạt</label>
                <input id="login-activation" className={securityInput} type="password" value={activationCode} onChange={e => setActivationCode(e.target.value)}
                  autoComplete="off" spellCheck={false} maxLength={32} aria-describedby="activation-help" autoFocus required />
                <span id="activation-help" className="block text-muted">Nhập khi thiết lập Authenticator lần đầu hoặc sau khi được Reset 2FA.</span>
              </div>}
              {changing && <>
                <label className="block space-y-1 text-sm text-copy">
                  <span>Mật khẩu mới</span>
                  <input className={securityInput} type="password" value={nextPassword} onChange={e => setNextPassword(e.target.value)}
                    autoComplete="new-password" minLength={8} maxLength={128} aria-describedby="password-rules" required />
                </label>
                <ul id="password-rules" aria-label="Điều kiện mật khẩu" className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {passwordRules.map(({ label, matches }) => {
                    const met = matches(nextPassword);
                    return <li key={label} className={met ? "text-success" : "text-muted"}>
                      <span aria-hidden="true">{met ? "✓" : "○"} </span><span className="sr-only">{met ? "Đạt: " : "Chưa đạt: "}</span>{label}
                    </li>;
                  })}
                </ul>
                <label className="block space-y-1 text-sm text-copy">
                  <span>Xác nhận mật khẩu mới</span>
                  <input className={securityInput} type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)}
                    autoComplete="new-password" minLength={8} maxLength={128} required />
                </label>
              </>}
              {recovering && (setup ? <AuthenticatorQr setup={setup} /> :
                <label className="block space-y-1 text-sm text-copy">
                  <span>Mã khôi phục</span>
                  <input className={securityInput} value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)}
                    maxLength={32} pattern="[A-Fa-f0-9]{32}" autoComplete="off" spellCheck={false} required />
                </label>)}
              {(changing || (challenge && (!recovering || setup))) && <OtpField value={code} onChange={setCode} autoFocus={!!challenge} />}
              {error && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-sm text-danger-strong">{error}</p>}
              {notice && <p role="status" className="rounded-lg bg-success-soft p-3 text-sm text-success">{notice}</p>}
              <button type="submit" className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand p-3 text-sm font-bold text-white shadow-sm hover:bg-brand-hover">
                {action} {!changing && !challenge && !busy && <ArrowRight size={17} aria-hidden="true" />}
              </button>
            </fieldset>
          </form>}
          {challenge && !changing && !replacementCodes && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-brand">
            {!recovering && <button type="button" disabled={busy} onClick={() => { setRecovering(true); setError(""); setCode(""); }}>Dùng mã khôi phục</button>}
            <button type="button" disabled={busy} onClick={backToPassword}>Quay lại đăng nhập</button>
          </div>}
          {!challenge && !changing && <button type="button" disabled={busy} aria-expanded={enrolling}
            className="mt-4 text-left text-sm font-semibold text-brand hover:underline" onClick={() => {
              setEnrolling(!enrolling);
              setActivationCode("");
              setError("");
            }}>
            {enrolling ? "Quay lại đăng nhập thông thường" : "Thiết lập Authenticator bằng mã kích hoạt"}
          </button>}
          {!challenge && !changing && <details className="mt-4 text-sm text-copy">
            <summary className="cursor-pointer font-semibold text-brand">Quên mật khẩu hoặc mất Authenticator?</summary>
            <p className="mt-2">Nếu còn mật khẩu và mã khôi phục, hãy nhập mật khẩu trước rồi chọn Dùng mã khôi phục. Trường hợp khác, liên hệ quản trị viên qua kênh nội bộ để xác minh danh tính.</p>
          </details>}
          {changing && <button type="button" className="mt-4 text-sm text-copy" onClick={async () => {
            if (!await logout()) setError("Không thể thu hồi phiên. Vui lòng thử lại.");
          }}>Đăng xuất</button>}
        </section>
      </div>
    </main>
  );
}
