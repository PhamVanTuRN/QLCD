"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Nếu đã đăng nhập thì chuyển về Dashboard sử dụng useEffect
  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(username, password);
      if (result.success) {
        router.replace("/");
      } else {
        setError(result.error || "Đăng nhập thất bại");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi trong quá trình đăng nhập.");
    } finally {
      setIsLoading(false);
    }
  };

  // Tránh hiển thị form đăng nhập khi đã xác thực và đang chuyển hướng
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.05),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white overflow-hidden border border-slate-700/50 shadow-2xl mb-6 p-1">
            <img src="/logo_108.png?v=3" className="w-full h-full object-contain rounded-full" alt="Logo Bệnh viện 108" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Hệ thống Công đoàn số</h1>
          <p className="text-sm text-slate-400 mt-2">Bệnh viện Trung ương Quân đội 108</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white">Đăng nhập</h2>
            <p className="text-xs text-slate-400 mt-1">Sử dụng tài khoản được cấp để truy cập hệ thống</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${
                isLoading
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-lg shadow-emerald-900/30 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-slate-600 border-t-slate-300 rounded-full animate-spin" />
                  Đang xác thực...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts info */}
        <div className="mt-6 bg-slate-900/40 border border-slate-800/60 rounded-xl p-5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-3">Tài khoản mặc định (Hệ thống)</span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <div><span className="text-emerald-400 font-semibold">admin</span> — Quản trị viên hệ thống</div>
              <span className="text-slate-600">admin123</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <div><span className="text-blue-400 font-semibold">cdcs_benhvien</span> — Chủ tịch CĐCS</div>
              <span className="text-slate-600">admin123</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-3 border-t border-slate-800/60 pt-2 italic">
              * Khi thêm đơn vị Công đoàn (CĐBP/Tổ công đoàn), tài khoản truy cập tương ứng sẽ được tự động tạo. Thông tin tài khoản có thể xem trực tiếp ở trang Quản lý Tài khoản.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
