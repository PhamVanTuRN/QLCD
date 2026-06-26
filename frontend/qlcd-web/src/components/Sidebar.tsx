"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { changePasswordApi } from "@/lib/api";
import { 
  LayoutDashboard, 
  Network, 
  Users, 
  ClipboardList, 
  Calendar, 
  DollarSign, 
  Heart, 
  Lightbulb, 
  Award, 
  Folder, 
  Key,
  LogOut
} from "lucide-react";

const mainNavItems = [
  { href: "/", label: "Dashboard Tổng quan", icon: LayoutDashboard },
  { href: "/organizations", label: "Cây Tổ chức", icon: Network },
  { href: "/members", label: "Quản lý Đoàn viên", icon: Users },
  { href: "/quality", label: "Chất lượng Công đoàn", icon: ClipboardList },
];

const extraNavItems = [
  { href: "/activities", label: "Hoạt động Công đoàn", icon: Calendar },
  { href: "/finance", label: "Tài chính & Đoàn phí", icon: DollarSign },
  { href: "/welfare", label: "Phúc lợi & Cứu trợ", icon: Heart },
  { href: "/initiatives", label: "Sáng kiến & Đề tài", icon: Lightbulb },
  { href: "/emulations", label: "Thi đua Trực tuyến", icon: Award },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasPermission } = useAuth();

  const [isChangePwdOpen, setIsChangePwdOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError("");
    setPwdSuccess("");

    if (newPassword.length < 6) {
      setPwdError("Mật khẩu mới phải từ 6 ký tự trở lên");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwdError("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    setSubmitting(true);
    try {
      await changePasswordApi({ oldPassword, newPassword });
      setPwdSuccess("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setIsChangePwdOpen(false), 2000);
    } catch (err) {
      console.error(err);
      const apiError = err as { response?: { data?: { message?: string } } };
      setPwdError(apiError.response?.data?.message || "Đã xảy ra lỗi khi đổi mật khẩu");
    } finally {
      setSubmitting(false);
    }
  };

  const getScopeBadgeColor = (scope: string) => {
    switch (scope) {
      case "CDCS": return "bg-red-50 text-red-600 border-red-100";
      case "CDBP": return "bg-blue-50 text-blue-600 border-blue-100";
      case "TOCD": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const showCatalogs = hasPermission("Dictionaries.View") && user?.phamVi === "CDCS";
  const showAccounts = hasPermission("Users.Manage");

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Brand Header with Hospital 108 Logo */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-md p-0.5 border border-slate-100">
          <img src="/logo_108.png?v=3" className="w-full h-full object-contain rounded-full" alt="Logo Bệnh viện 108" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-slate-800">QLCD SỐ 108</h1>
          <p className="text-[10px] text-slate-400 uppercase font-semibold">Bệnh viện TWQĐ 108</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {mainNavItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-150/40 shadow-xs font-semibold"
                  : "text-slate-600 hover:bg-slate-55 hover:text-emerald-700"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" /> {item.label}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-slate-100 my-4">
          <span className="px-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Phân hệ nghiệp vụ</span>
        </div>

        {extraNavItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-150/40 shadow-xs font-semibold"
                  : "text-slate-550 hover:bg-slate-55 hover:text-emerald-700"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" /> {item.label}
            </Link>
          );
        })}

        {(showCatalogs || showAccounts) && (
          <>
            <div className="pt-4 border-t border-slate-100 my-4">
              <span className="px-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cấu hình hệ thống</span>
            </div>
            
            {showCatalogs && (
              <Link
                href="/catalogs"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  pathname.startsWith("/catalogs")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-150/40 shadow-xs font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
                }`}
              >
                <Folder className="w-4 h-4 shrink-0" /> Quản lý Danh mục
              </Link>
            )}

            {showAccounts && (
              <Link
                href="/accounts"
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  pathname.startsWith("/accounts")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-150/40 shadow-xs font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
                }`}
              >
                <Key className="w-4 h-4 shrink-0" /> Tài khoản Tổ chức
              </Link>
            )}
          </>
        )}
      </nav>

      {/* User panel */}
      {user && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs border border-blue-400/20 shadow-sm">
              {user.hoTen.split(" ").map(w => w[0]).slice(-2).join("")}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user.hoTen}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${getScopeBadgeColor(user.phamVi)}`}>
                  {user.phamVi}
                </span>
                <span className="text-[10px] text-blue-600 font-medium truncate">{user.vaiTro}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => {
                setPwdError("");
                setPwdSuccess("");
                setOldPassword("");
                setNewPassword("");
                setConfirmPassword("");
                setIsChangePwdOpen(true);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-blue-50 text-slate-650 hover:text-blue-650 text-[10px] font-bold py-2 rounded-lg border border-slate-200 hover:border-blue-150 transition-all cursor-pointer"
            >
              <Key className="w-3 h-3 shrink-0" /> Đổi mật khẩu
            </button>
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-[10px] font-bold py-2 rounded-lg border border-slate-200 hover:border-red-100 transition-all cursor-pointer"
            >
              <LogOut className="w-3 h-3 shrink-0" /> Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {isChangePwdOpen && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setIsChangePwdOpen(false)} />
          <div className="relative z-10 w-full max-w-sm bg-white border border-slate-150 rounded-2xl shadow-xl p-6 space-y-5 animate-in scale-in duration-200">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Đổi mật khẩu tài khoản</h3>
              <p className="text-[10px] text-slate-400 mt-0.5 font-bold uppercase tracking-wider">
                Tài khoản: <span className="text-blue-650">{user.id}</span>
              </p>
            </div>

            {pwdError && (
              <div className="bg-red-50 border border-red-150 text-red-700 px-3 py-2 rounded-xl text-[11px] font-semibold">
                ⚠️ {pwdError}
              </div>
            )}

            {pwdSuccess && (
              <div className="bg-emerald-50 border border-emerald-150 text-emerald-700 px-3 py-2 rounded-xl text-[11px] font-semibold">
                ✅ {pwdSuccess}
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mật khẩu cũ <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-normal"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-normal"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-normal"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePwdOpen(false)}
                  disabled={submitting}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-xs transition-all active:scale-98 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {submitting && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
}
