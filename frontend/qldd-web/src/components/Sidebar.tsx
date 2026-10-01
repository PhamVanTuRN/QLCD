"use client";

import { useState, useRef, useEffect } from "react";
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
  LogOut,
  ChevronUp
} from "lucide-react";

const mainNavItems = [
  { href: "/", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/events", label: "Quản lý Sự kiện", icon: Calendar },
  { href: "/locations", label: "Quản lý Địa điểm", icon: Network },
  { href: "/devices", label: "Quản lý Thiết bị", icon: Users },
  { href: "/logs", label: "Lịch sử Điểm danh", icon: ClipboardList },
  { href: "/results", label: "Kết quả Điểm danh", icon: Award },
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      case "GLOBAL": return "bg-red-50 text-red-600 border-red-100";
      case "EVENTS": return "bg-blue-50 text-blue-600 border-blue-100";
      case "LOCATIONS": return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const showAdminMenu = hasPermission("System.Manage");

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
      {/* Brand Header with Hospital 108 Logo */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center shadow-md p-0.5 border border-slate-100">
          <img src="/logo_108.png?v=3" className="w-full h-full object-contain rounded-full" alt="Logo Bệnh viện 108" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-slate-800">ĐIỂM DANH SỐ</h1>
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
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                ? "bg-emerald-50 text-emerald-800 border border-emerald-150/40 shadow-xs font-semibold"
                : "text-slate-600 hover:bg-slate-55 hover:text-emerald-700"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" /> {item.label}
            </Link>
          );
        })}



        {showAdminMenu && (
          <>
            <div className="pt-4 border-t border-slate-100 my-4">
              <span className="px-4 text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cấu hình hệ thống</span>
            </div>

            <Link
              href="/admin/users"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${pathname.startsWith("/admin/users")
                ? "bg-emerald-50 text-emerald-800 border border-emerald-150/40 shadow-xs font-semibold"
                : "text-slate-500 hover:bg-slate-50 hover:text-emerald-700"
                }`}
            >
              <Key className="w-4 h-4 shrink-0" /> Quản trị Người dùng
            </Link>
          </>
        )}
      </nav>

      {/* User panel */}
      {user && (
        <div className="relative border-t border-slate-100 bg-slate-50/50" ref={userMenuRef}>
          {/* Avatar dropdown menu - appears above the user panel */}
          {isUserMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1.5 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden animate-in slide-in-from-bottom-2 duration-150 z-20">
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  setPwdError("");
                  setPwdSuccess("");
                  setOldPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                  setIsChangePwdOpen(true);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
              >
                <Key className="w-3.5 h-3.5 shrink-0" /> Đổi mật khẩu
              </button>
              <div className="border-t border-slate-100" />
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[11px] font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" /> Đăng xuất
              </button>
            </div>
          )}

          {/* Clickable user info row */}
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="w-full p-4 flex items-center gap-3 hover:bg-slate-100/60 transition-colors cursor-pointer text-left"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs border border-blue-400/20 shadow-sm shrink-0">
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
            <ChevronUp className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isUserMenuOpen ? "" : "rotate-180"}`} />
          </button>
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
