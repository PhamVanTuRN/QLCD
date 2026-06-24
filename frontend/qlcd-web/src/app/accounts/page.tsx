"use client";

import { useState, useEffect } from "react";
import { getAccountsApi, toggleAccountApi, resetAccountPasswordApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui-components";
import { Search, Key, Lock, Unlock, Copy } from "lucide-react";

export interface AccountDto {
  id: string;
  username: string;
  hoTen: string;
  vaiTro: string;
  organizationId: string | null;
  organizationName: string | null;
  passwordRaw: string | null;
  trangThai: boolean;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

export default function AccountsPage() {
  const { user, hasPermission } = useAuth();
  const router = useRouter();

  // Chỉ cho phép ADMIN (có quyền Users.Manage) vào quản lý tài khoản
  useEffect(() => {
    if (user && !hasPermission("Users.Manage")) {
      router.push("/");
    }
  }, [user, router, hasPermission]);

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const data = await getAccountsApi();
      setAccounts(data);
    } catch (err) {
      console.error(err);
      showAlert("error", "Lỗi tải danh sách tài khoản");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAccounts();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleAccountApi(id);
      showAlert("success", "Thay đổi trạng thái tài khoản thành công");
      loadAccounts();
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Lỗi thay đổi trạng thái tài khoản");
    }
  };

  const handleOpenReset = (acc: AccountDto) => {
    setSelectedAccountId(acc.id);
    setSelectedUsername(acc.username);
    setNewPassword("");
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showAlert("error", "Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }

    try {
      await resetAccountPasswordApi(selectedAccountId!, { password: newPassword });
      showAlert("success", `Đặt lại mật khẩu cho tài khoản ${selectedUsername} thành công`);
      setIsResetModalOpen(false);
      loadAccounts();
    } catch (err) {
      console.error(err);
      const apiError = err as ApiError;
      showAlert("error", apiError.response?.data?.message || "Lỗi đặt lại mật khẩu");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-50 text-red-750 border-red-200/60";
      case "CDCS": return "bg-emerald-50 text-emerald-750 border-emerald-200/60";
      case "CDBP": return "bg-blue-50 text-blue-750 border-blue-200/60";
      case "TOCD": return "bg-amber-50 text-amber-750 border-amber-200/60";
      default: return "bg-slate-50 text-slate-700 border-slate-200/60";
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.hoTen.toLowerCase().includes(search.toLowerCase()) ||
      (a.organizationName && a.organizationName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Alert Banner */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 transition-all animate-in slide-in-from-top duration-300 ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-250 text-emerald-800"
              : "bg-red-50 border-red-250 text-red-800"
          }`}
        >
          <span className="text-base">{alert.type === "success" ? "✅" : "⚠️"}</span>
          <span className="text-xs font-bold">{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader 
        title="Tài khoản & Phân quyền Truy cập" 
        description="Xem danh sách tài khoản được tự động cấp cho các đơn vị Công đoàn trực thuộc"
      >
        <div className="relative">
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản, đơn vị..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all min-w-[250px]"
          />
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400 shrink-0" />
        </div>
      </PageHeader>

      {/* Main card */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs table-modern">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-3.5">Tên đăng nhập</th>
                <th className="px-6 py-3.5">Họ và tên quản lý</th>
                <th className="px-6 py-3.5">Vai trò (Cấp)</th>
                <th className="px-6 py-3.5">Đơn vị liên kết</th>
                <th className="px-6 py-3.5">Mật khẩu ban đầu</th>
                <th className="px-6 py-3.5 text-center">Trạng thái</th>
                <th className="px-6 py-3.5 text-center w-48">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <span className="inline-block w-6 h-6 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
                      <span className="text-xs font-medium text-slate-400">Đang tải danh sách tài khoản...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    📂 Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-55/40 transition-all">
                    <td className="px-6 py-4 font-mono font-bold text-blue-600">{item.username}</td>
                    <td className="px-6 py-4 font-bold text-slate-805">{item.hoTen}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-lg text-[9px] font-bold border ${getRoleBadgeColor(item.vaiTro)}`}>
                        {item.vaiTro}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {item.organizationName || "Hệ thống chung"}
                    </td>
                    <td className="px-6 py-4">
                      {item.passwordRaw ? (
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-50 px-2 py-1 rounded text-amber-700 font-bold border border-slate-200 text-[10px] font-mono">
                            {item.passwordRaw}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.passwordRaw || "");
                              showAlert("success", "Đã sao chép mật khẩu");
                            }}
                            title="Copy mật khẩu"
                            className="text-slate-400 hover:text-blue-600 transition-all shrink-0 active:scale-90"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-medium">Đã đổi / Đã mã hóa</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                          item.trangThai
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                            : "bg-red-50 text-red-700 border-red-200/60"
                        }`}
                      >
                        {item.trangThai ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1 ${
                            item.trangThai
                              ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-250"
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-250"
                          }`}
                        >
                          {item.trangThai ? <Lock className="w-3 h-3 shrink-0" /> : <Unlock className="w-3 h-3 shrink-0" />}
                          {item.trangThai ? "Khóa" : "Mở khóa"}
                        </button>
                        <button
                          onClick={() => handleOpenReset(item)}
                          className="bg-blue-55 hover:bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                        >
                          <Key className="w-3.5 h-3.5 shrink-0" /> Đổi MK
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Password Reset Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsResetModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white border border-slate-150 rounded-2xl shadow-xl p-6 space-y-5 animate-in scale-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Đặt lại mật khẩu</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                Tài khoản: <span className="text-blue-650">{selectedUsername}</span>
              </p>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập tối thiểu 6 ký tự"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-all active:scale-98"
                >
                  Xác nhận đặt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
