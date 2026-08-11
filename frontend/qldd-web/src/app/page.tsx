"use client";

import { useAuth } from "@/lib/auth-context";

export default function Dashboard() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard Tổng quan</h2>
          <p className="text-xs text-slate-550 mt-1 font-medium">
            Xin chào <span className="text-blue-600 font-semibold">{user?.hoTen}</span> — {user?.vaiTro} 
            {user?.donViTen ? ` • ${user.donViTen}` : ""}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-150 p-10 rounded-2xl shadow-xs text-center">
        <h3 className="text-lg font-bold text-slate-700 mb-2">Hệ thống đang được cập nhật</h3>
        <p className="text-sm text-slate-500">Các tính năng nghiệp vụ Quản lý điểm danh sẽ sớm được hiển thị tại đây.</p>
      </div>
    </div>
  );
}
