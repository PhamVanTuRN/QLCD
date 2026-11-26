"use client";

import FormDialog from "@/components/FormDialog";
import { OtpField, securityInput } from "@/components/AuthenticatorFields";

import { useResource } from "@/lib/use-resource";
import LoadState from "@/components/LoadState";
import Notice, { useNotice } from "@/components/Notice";
import ListPager from "@/components/ListPager";

import { useState, useCallback } from "react";
import { Search } from "lucide-react";
import { apiMessage, getAccountsApi, toggleAccountApi, unlockAccountApi, issueAccountActivation, resetAccountAuthenticator, resetAccountPassword } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const credentialLabels = { unlock: "Mở khóa tài khoản", activate: "Cấp mã kích hoạt", password: "Reset mật khẩu", authenticator: "Reset 2FA" };
const roleNames: Record<string, string> = { ADMIN: "ADMIN", CDCS: "CĐCS", CDBP: "CĐBP", TOCD: "TCĐ" };
const credentialButton = "min-h-8 rounded-md border border-brand-line bg-brand-soft px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-brand hover:bg-soft-strong";
type CredentialAction = keyof typeof credentialLabels;

export interface AccountDto {
  id: string;
  username: string;
  hoTen: string;
  vaiTro: string;
  organizationId: string | null;
  organizationActive: boolean;
  accountArchived: boolean;
  canSignIn: boolean;
  donViTen: string | null;
  mustChangePassword: boolean;
  trangThai: boolean;
  authenticatorEnabled: boolean;
  activationPending: boolean;
  canIssueActivation: boolean;
}

export default function AccountsPage() {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { notice, dismiss, showAlert } = useNotice();

  const [selectedAccount, setSelectedAccount] = useState<AccountDto | null>(null);
  const [action, setAction] = useState<CredentialAction>("activate");
  const [confirmed, setConfirmed] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [activation, setActivation] = useState("");
  const [activationError, setActivationError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const readPage = useCallback((signal: AbortSignal) => getAccountsApi<AccountDto>({ search: search.trim() || undefined, page }, signal), [search, page]);
  const { data: list, loading, error: listError, reload: loadAccounts } = useResource(readPage, search ? 200 : 0);
  const policy = list?.credentialPolicy;
  const accounts = list?.data ?? [];
  const hasMore = list?.hasMore ?? false;

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleAccountApi(id);
      showAlert("success", "Đã đổi trạng thái khóa tài khoản. Thao tác khóa không thay đổi trạng thái đơn vị. Mở khóa dùng xác thực admin và khôi phục đơn vị đang ngừng/ẩn.");
      loadAccounts();
    } catch (err) {
      showAlert("error", apiMessage(err, "Lỗi thay đổi trạng thái tài khoản"));
    }
  };

  const openActivation = (account: AccountDto, selectedAction: CredentialAction) => {
    setSelectedAccount(account);
    setAction(selectedAction);
    setConfirmed(false);
    setCurrentPassword("");
    setOtp("");
    setActivation("");
    setActivationError("");
  };

  const closeActivation = () => {
    if (submitting) return;
    setSelectedAccount(null);
    setConfirmed(false);
    setCurrentPassword("");
    setOtp("");
    setActivation("");
    setActivationError("");
  };

  const handleActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !selectedAccount || !confirmed || !policy) return;

    setActivationError("");
    setSubmitting(true);
    try {
      if (action === "unlock") {
        const result = await unlockAccountApi(selectedAccount.id, confirmed, currentPassword, otp);
        setSelectedAccount(null);
        showAlert("success", result.organizationRestored
          ? `Đã mở khóa ${selectedAccount.username} và khôi phục đơn vị trên Cây tổ chức theo ID cũ. Các tài khoản khác giữ nguyên cờ khóa.`
          : `Đã mở khóa ${selectedAccount.username}. Đơn vị đang hoạt động, dữ liệu và Khối được giữ nguyên.`);
      } else if (action === "password") {
        await resetAccountPassword(selectedAccount.id, confirmed, currentPassword, otp);
        setSelectedAccount(null);
        showAlert("success", `Đã đặt lại mật khẩu của ${selectedAccount.username} thành ${policy?.initialPassword}. Có hiệu lực ${policy?.temporaryPasswordLifetimeHours} giờ; bắt buộc đổi trước khi vào nghiệp vụ. Authenticator và trạng thái khóa được giữ nguyên.`);
      } else {
        const code = action === "activate"
          ? await issueAccountActivation(selectedAccount.id, confirmed)
          : await resetAccountAuthenticator(selectedAccount.id, confirmed, currentPassword, otp);
        setActivation(code);
      }
      setCurrentPassword("");
      setOtp("");
      loadAccounts();
    } catch (err) {
      setActivationError(apiMessage(err, "Không thể cập nhật thông tin xác thực."));
    } finally { setSubmitting(false); }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-danger-soft text-danger border-danger-line";
      case "CDCS": return "bg-brand-soft text-brand border-brand-line";
      case "CDBP": return "bg-teal-soft text-teal-ink border-teal-ink/20";
      case "TOCD": return "bg-gold-soft text-gold-ink border-gold-line";
      default: return "bg-soft text-muted border-line";
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      <Notice value={notice} dismiss={dismiss} />

      {/* Header */}
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Tài khoản và phân quyền</h1>
          <p className="mt-1 text-sm text-muted">Quản lý truy cập và mật khẩu của tài khoản công đoàn.</p>
        </div>
        <div className="relative w-full md:max-w-70">
          <Search size={17} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
          type="text"
          aria-label="Tìm kiếm" maxLength={100}
          placeholder="Tìm kiếm tài khoản, đơn vị..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="min-h-11 w-full rounded-xl border border-edge bg-surface py-2.5 pr-3 pl-10 text-sm text-ink placeholder:text-muted focus:border-brand"
          />
        </div>
      </header>

      {policy && <section aria-label="Mật khẩu khởi tạo" className="rounded-xl border border-brand-line bg-brand-soft p-4 text-sm text-copy">
        <p>Mật khẩu khởi tạo dùng chung cho tài khoản mới và reset mật khẩu: <code className="font-bold text-ink">{policy.initialPassword}</code>.</p>
        <p>Khóa tài khoản không ngừng đơn vị. Mở khóa có xác thực admin sẽ khôi phục chính đơn vị liên kết đang ngừng/ẩn; tài khoản khác giữ cờ khóa riêng. Tài khoản mới được tạo ở trạng thái khóa. Sau khi xác minh danh tính và cấp mã kích hoạt, tài khoản được mở để thiết lập Authenticator và đổi mật khẩu trong {policy.temporaryPasswordLifetimeHours} giờ. Reset mật khẩu không mở khóa tài khoản và không thay Authenticator.</p>
      </section>}

      {/* Main card */}
      <div className="panel overflow-hidden">
        <div className="overflow-x-auto" role="region" aria-label="Bảng tài khoản" tabIndex={0}>
          <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
            <thead className="bg-soft">
              <tr className="border-b border-line font-semibold text-copy">
                <th scope="col" className="py-3 px-4">Tên đăng nhập</th>
                <th scope="col" className="py-3 px-4">Họ và tên quản lý</th>
                <th scope="col" className="py-3 px-4">Vai trò</th>
                <th scope="col" className="py-3 px-4">Đơn vị liên kết</th>
                <th scope="col" className="py-3 px-4">Authenticator</th>
                <th scope="col" className="py-3 px-4 text-center">Trạng thái</th>
                <th scope="col" className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {listError ? (
                <tr><td colSpan={7}><LoadState retry={loadAccounts} /></td></tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    <span className="inline-block w-4 h-4 border-2 border-edge border-t-brand rounded-full animate-spin mr-2" />
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                accounts.map((item) => (
                  <tr key={item.id} className="hover:bg-soft text-copy">
                    <td className="py-3 px-4 font-mono font-bold text-ink">{item.username}</td>
                    <td className="py-3 px-4 font-medium text-ink">{item.hoTen}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold ${getRoleBadgeColor(item.vaiTro)}`}>
                        {roleNames[item.vaiTro] ?? item.vaiTro}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-brand">
                      {item.donViTen || "Hệ thống chung"}
                      {!item.organizationActive && <span className="block text-xs font-normal text-danger">Đơn vị ngừng hoạt động / bị ẩn</span>}
                    </td>
                    <td className="py-3 px-4">
                      {item.authenticatorEnabled ? "Đang bật" : item.activationPending ? "Đã cấp mã" : "Chưa thiết lập"}
                      {item.mustChangePassword && <span className="block text-xs text-muted">Cần đổi mật khẩu</span>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                          item.trangThai
                            ? "bg-success-soft text-success border-success-line"
                            : "bg-danger-soft text-danger border-danger-line"
                        }`}
                      >
                        {item.accountArchived ? "Tài khoản lưu trữ cũ" : item.trangThai ? "Đã mở khóa" : "Bị khóa"}
                      </span>
                      {!item.canSignIn && !item.organizationActive && <p className="mt-1 text-xs text-danger">Bị chặn truy cập do đơn vị</p>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={item.vaiTro === "ADMIN"}
                          onClick={() => item.trangThai && !item.accountArchived ? handleToggleStatus(item.id) : openActivation(item, "unlock")}
                          className={`min-h-8 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-45 ${
                            item.trangThai
                              ? "bg-gold-soft hover:bg-gold-soft border-gold-line text-gold-ink"
                              : "bg-brand-soft hover:bg-soft-strong border-brand-line text-brand"
                          }`}
                        >
                          {item.trangThai && !item.accountArchived ? "Khóa" : "Mở khóa"}
                        </button>
                        {item.trangThai && !item.accountArchived && !item.organizationActive && item.vaiTro !== "ADMIN" && <button type="button" className={credentialButton}
                          onClick={() => openActivation(item, "unlock")}>Mở khóa &amp; khôi phục đơn vị</button>}
                        {item.organizationActive && item.canIssueActivation && item.vaiTro !== "ADMIN" && <button type="button" className={credentialButton}
                          onClick={() => openActivation(item, "activate")}>{credentialLabels.activate}</button>}
                        {list?.canResetCredentials && user && user.id !== item.id && <>
                          <button type="button" className={credentialButton} disabled={item.accountArchived} title={item.accountArchived ? "Khôi phục tài khoản trước khi reset" : undefined}
                            onClick={() => openActivation(item, "password")}>{credentialLabels.password}</button>
                          <button type="button" className={credentialButton} disabled={item.accountArchived} title={item.accountArchived ? "Khôi phục tài khoản trước khi reset" : undefined}
                            onClick={() => openActivation(item, "authenticator")}>{credentialLabels.authenticator}</button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <ListPager page={page} hasMore={hasMore} loading={loading} onChange={setPage} />
        </div>
      </div>

      {selectedAccount && (
        <FormDialog label={credentialLabels[action]} onClose={closeActivation} busy={submitting}>
          <h2 className="text-lg font-bold text-ink">{credentialLabels[action]}</h2>
          <p className="break-all text-sm text-muted">{selectedAccount.username}</p>
          {activation ? <div className="space-y-3 text-sm text-copy">
            <p>Gửi mã này cho đúng chủ tài khoản qua kênh riêng đã xác minh. Mã chỉ hiển thị ở đây và có hiệu lực trong {policy?.activationCodeLifetimeHours} giờ.</p>
            {action === "authenticator" ? <p>Mật khẩu hiện tại và trạng thái khóa được giữ nguyên. Mã này chỉ dùng để thiết lập lại Authenticator.</p>
              : <p>Mật khẩu tài khoản mới là <code>{policy?.initialPassword}</code>. Tài khoản cũ dùng mật khẩu hiện tại; cấp mã không đặt lại mật khẩu.</p>}
            <code data-testid="activation-code" className="block rounded-lg bg-soft p-3 break-all text-ink">{activation}</code>
            <button type="button" className="rounded-lg bg-brand px-4 py-2 font-bold text-white" onClick={closeActivation}>Đã lưu mã</button>
          </div> : <form onSubmit={handleActivation} className="space-y-4 text-sm">
            <fieldset disabled={submitting} className="space-y-4">
              {action === "unlock" && <p className="text-muted">Nhập mật khẩu và OTP mới của admin. Tài khoản này sẽ được mở khóa; nếu đơn vị đang ngừng hoặc bị ẩn, chính đơn vị đó sẽ được khôi phục trên cây với ID, Khối và dữ liệu cũ. Đơn vị cha phải hoạt động trước. Không mở khóa tài khoản khác; những tài khoản khác đang mở có thể truy cập lại khi đơn vị hoạt động. Mật khẩu và Authenticator không đổi.</p>}
              {action === "password" && <p className="text-muted">Mật khẩu sẽ được đặt lại thành <strong className="text-ink">{policy?.initialPassword}</strong>, có hiệu lực {policy?.temporaryPasswordLifetimeHours} giờ. Chủ tài khoản phải đổi mật khẩu trước khi vào nghiệp vụ. Authenticator và trạng thái khóa được giữ nguyên.</p>}
              {action === "authenticator" && <p className="text-muted">Authenticator và mã khôi phục cũ sẽ hết hiệu lực. Chủ tài khoản dùng mật khẩu hiện tại và mã kích hoạt mới để đăng ký lại.</p>}
              <label className="flex items-start gap-2">
                <input type="checkbox" required checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />
                <span>{action === "unlock" ? "Tôi xác nhận mở khóa tài khoản và khôi phục chính đơn vị liên kết nếu đang ngừng/ẩn."
                  : action === "password" ? "Tôi xác nhận đặt lại mật khẩu và thu hồi các phiên của tài khoản này."
                  : "Tôi đã đối chiếu danh tính chủ tài khoản qua hồ sơ và kênh liên hệ nội bộ."}</span>
              </label>
              {action !== "activate" && <>
                <label className="block space-y-1">
                  <span>Mật khẩu quản trị viên</span>
                  <input className={securityInput} type="password" autoComplete="current-password" maxLength={128} required
                    value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} />
                </label>
                <OtpField value={otp} onChange={setOtp} />
              </>}
              {activationError && <p role="alert" className="rounded-lg bg-danger-soft p-3 text-danger-strong">{activationError}</p>}
              <button type="submit" className="rounded-lg bg-brand px-4 py-2 font-bold text-white">
                {submitting ? "Đang xử lý…" : action === "activate" ? "Xác nhận cấp mã" : action === "unlock" ? "Xác nhận mở khóa" : "Xác nhận reset"}
              </button>
            </fieldset>
          </form>}
        </FormDialog>
      )}
    </div>
  );
}
