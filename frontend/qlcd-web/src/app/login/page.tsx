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
    } catch {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(37,99,235,0.03),transparent_70%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white overflow-hidden border border-slate-100 shadow-md mb-4 p-1">
            <img src="/logo_108.png?v=3" className="w-full h-full object-contain rounded-full" alt="Logo Bệnh viện 108" />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Hệ thống Công đoàn số</h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">Bệnh viện Trung ương Quân đội 108</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-150 rounded-2xl p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-850">Đăng nhập</h2>
            <p className="text-xs text-slate-450 mt-0.5">Sử dụng tài khoản được cấp để truy cập hệ thống</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Tên đăng nhập</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 transition-all"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-1 focus:ring-blue-600/20 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-655 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                isLoading
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  : "bg-blue-600 text-white hover:bg-blue-700 shadow-xs hover:shadow-md active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                  Đang xác thực...
                </span>
              ) : (
                "Đăng nhập"
              )}
            </button>
          </form>
        </div>

        {/* Demo accounts info */}
        <div className="mt-6 bg-slate-50/80 border border-slate-150 rounded-xl p-5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">Tài khoản mặc định (Hệ thống)</span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <div><span className="text-blue-600 font-semibold">admin</span> — Quản trị viên</div>
              <span className="font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">admin123</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <div><span className="text-teal-600 font-semibold">cdcs_benhvien</span> — Chủ tịch CĐCS</div>
              <span className="font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-100">admin123</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-3 border-t border-slate-200/60 pt-2 italic leading-relaxed">
              * Khi thêm đơn vị Công đoàn (CĐBP/Tổ công đoàn), tài khoản truy cập tương ứng sẽ được tự động tạo. Thông tin tài khoản có thể xem trực tiếp ở trang Quản lý Tài khoản.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
