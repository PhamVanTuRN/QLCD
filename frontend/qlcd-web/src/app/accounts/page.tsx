"use client";

import { useState, useEffect } from "react";
import { getAccountsApi, toggleAccountApi, resetAccountPasswordApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

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

export default function AccountsPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Chỉ cho phép CDCS/ADMIN vào xem tài khoản
  useEffect(() => {
    if (user && user.phamVi !== "CDCS") {
      router.push("/");
    }
  }, [user, router]);

  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Password Reset Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedUsername, setSelectedUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
    loadAccounts();
  }, []);

  const showAlert = (type: "success" | "error", message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleAccountApi(id);
      showAlert("success", "Thay đổi trạng thái tài khoản thành công");
      loadAccounts();
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Lỗi thay đổi trạng thái tài khoản");
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
    } catch (err: any) {
      console.error(err);
      showAlert("error", err.response?.data?.message || "Lỗi đặt lại mật khẩu");
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-red-500/10 text-red-400 border-red-500/20";
      case "CDCS": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "CDBP": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "TOCD": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const filteredAccounts = accounts.filter(
    (a) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.hoTen.toLowerCase().includes(search.toLowerCase()) ||
      (a.organizationName && a.organizationName.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Alert Banner */}
      {alert && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl border shadow-xl flex items-center gap-3 transition-all animate-bounce ${
            alert.type === "success"
              ? "bg-emerald-950 border-emerald-800 text-emerald-400"
              : "bg-red-950 border-red-900 text-red-400"
          }`}
        >
          <span>{alert.type === "success" ? "✅" : "⚠️"}</span>
          <span className="text-sm font-semibold">{alert.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tài khoản & Phân quyền Truy cập</h2>
          <p className="text-xs text-slate-400 mt-1">
            Xem danh sách tài khoản được tự động cấp cho các đơn vị Công đoàn trực thuộc
          </p>
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm tài khoản, đơn vị..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all min-w-[250px]"
        />
      </div>

      {/* Main card */}
      <div className="bg-slate-950/20 border border-slate-800 rounded-2xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Tên đăng nhập</th>
                <th className="py-3 px-4">Họ và tên quản lý</th>
                <th className="py-3 px-4">Vai trò (Cấp)</th>
                <th className="py-3 px-4">Đơn vị liên kết</th>
                <th className="py-3 px-4">Mật khẩu ban đầu</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    <span className="inline-block w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin mr-2" />
                    Đang tải danh sách tài khoản...
                  </td>
                </tr>
              ) : filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Không tìm thấy tài khoản nào.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40 text-slate-300">
                    <td className="py-3 px-4 font-mono font-bold text-white">{item.username}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{item.hoTen}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeColor(item.vaiTro)}`}>
                        {item.vaiTro}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {item.organizationName || "Hệ thống chung"}
                    </td>
                    <td className="py-3 px-4">
                      {item.passwordRaw ? (
                        <div className="flex items-center gap-2">
                          <code className="bg-slate-950 px-2 py-1 rounded text-amber-400 font-bold border border-slate-800 text-[10px]">
                            {item.passwordRaw}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.passwordRaw || "");
                              showAlert("success", "Đã sao chép mật khẩu");
                            }}
                            title="Copy mật khẩu"
                            className="text-slate-500 hover:text-white"
                          >
                            📋
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">Đã đổi / Đã mã hóa</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.trangThai
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {item.trangThai ? "Hoạt động" : "Bị khóa"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleStatus(item.id)}
                          className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-all ${
                            item.trangThai
                              ? "bg-amber-600/10 hover:bg-amber-600/20 border-amber-500/20 text-amber-400"
                              : "bg-emerald-600/10 hover:bg-emerald-600/20 border-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {item.trangThai ? "Khóa" : "Mở khóa"}
                        </button>
                        <button
                          onClick={() => handleOpenReset(item)}
                          className="bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 text-blue-400 hover:text-blue-300 px-2 py-1 rounded text-[10px] font-bold transition-all"
                        >
                          Đổi MK
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
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsResetModalOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white">Đặt lại mật khẩu</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Tài khoản: <span className="text-emerald-400 font-semibold">{selectedUsername}</span></p>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2.5 rounded-xl font-bold transition-all"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-900/30 transition-all active:scale-95"
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
