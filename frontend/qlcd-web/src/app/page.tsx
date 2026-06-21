"use client";

import { useState, useEffect } from "react";
import { getStats, UnionStatsDto } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const COLORS = ["#3B82F6", "#EF4444", "#10B981"];

// Mock stats mặc định khi chưa có dữ liệu từ DB
const defaultStats: UnionStatsDto = {
  tongDoanVien: 2045, doanVienNam: 921, doanVienNu: 1124,
  doanVienDangSinhHoat: 2045, doanVienDangVien: 620,
  tiLeDangVien: 30.3, tiLeNu: 55.0,
  tongCDBP: 15, tongToCongDoan: 35,
  ketNapMoiThang: 12, chuyenDiThang: 3, nghiHuuThang: 2,
  
  // Scoped distributions
  doanVienTheoCdbp: [],
  doanVienTheoToCd: [],
  doanVienTheoKhoi: [],
  doanVienTheoGioiTinh: [],
  doanVienTheoTrangThai: [],
  doanVienTheoChucVu: [],
  doanVienTheoNgoaiNgu: [],
  doanVienTheoTrinhDo: [],

  // Scoped sub-modules
  tongThuDoanPhi: 450000000,
  tongChi: 120000000,
  tonQuy: 330000000,
  soHoatDong: 8,
  soLuotPhucLoi: 15,
  soSangKien: 6,
  soKetQuaThiDua: 12
};

export default function Dashboard() {
  const { user } = useAuth();
  const [activeLevel, setActiveLevel] = useState<"CDCS" | "CDBP" | "TOCD">("CDCS");
  const [stats, setStats] = useState<UnionStatsDto>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getStats();
      if (data) {
        setStats(data);
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (user?.phamVi) {
      if (user.phamVi === "CDBP") {
        setActiveLevel("CDBP");
      } else if (user.phamVi === "TOCD") {
        setActiveLevel("TOCD");
      } else {
        setActiveLevel("CDCS");
      }
    }
  }, [user]);

  // Tổng số lượng đoàn viên ở các cấp phân cấp (phục vụ thống kê động trên các tab)
  const totalCdbpMembers = stats.doanVienTheoCdbp && stats.doanVienTheoCdbp.length > 0
    ? stats.doanVienTheoCdbp.reduce((sum, item) => sum + item.count, 0)
    : 0;

  const totalTocdMembers = stats.doanVienTheoToCd && stats.doanVienTheoToCd.length > 0
    ? stats.doanVienTheoToCd.reduce((sum, item) => sum + item.count, 0)
    : 0;

  // Chuyển đổi dữ liệu biểu đồ phân bổ
  const cdbpChartData = stats.doanVienTheoCdbp && stats.doanVienTheoCdbp.length > 0
    ? stats.doanVienTheoCdbp.map(x => ({ name: x.name, doanVien: x.count }))
    : [];

  const tocdChartData = stats.doanVienTheoToCd && stats.doanVienTheoToCd.length > 0
    ? stats.doanVienTheoToCd.map(x => ({ name: x.name, doanVien: x.count }))
    : [];

  const barChartData = activeLevel === "CDCS" ? cdbpChartData : tocdChartData;
  const barChartTitle = activeLevel === "CDCS" 
    ? "Phân bổ đoàn viên theo Công đoàn bộ phận" 
    : "Phân bổ đoàn viên theo Tổ Công đoàn";

  // Dữ liệu biểu đồ tài chính
  const financialData = [
    { name: "Tổng thu quỹ", value: stats.tongThuDoanPhi || 0 },
    { name: "Tổng chi quỹ", value: stats.tongChi || 0 },
    { name: "Tồn quỹ CĐ", value: stats.tonQuy || 0 }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard Chỉ đạo & Thống kê</h2>
          <p className="text-xs text-slate-400">
            Xin chào <span className="text-emerald-400 font-semibold">{user?.hoTen}</span> — {user?.vaiTro} 
            {user?.donViTen ? ` • ${user.donViTen}` : ""} • Dữ liệu thời gian thực
          </p>
        </div>
        <div className="bg-slate-950 p-1.5 rounded-xl border border-slate-800 flex gap-1">
          {(!user || user.phamVi === "CDCS") && (
            <button onClick={() => setActiveLevel("CDCS")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeLevel === "CDCS" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" : "text-slate-400 hover:text-white"
              }`}>
              CĐCS (Bệnh viện)
            </button>
          )}
          {(!user || user.phamVi === "CDCS" || user.phamVi === "CDBP") && (
            <button onClick={() => setActiveLevel("CDBP")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeLevel === "CDBP" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" : "text-slate-400 hover:text-white"
              }`}>
              CĐBP (Bộ phận)
            </button>
          )}
          <button onClick={() => setActiveLevel("TOCD")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeLevel === "TOCD" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40" : "text-slate-400 hover:text-white"
            }`}>
            Tổ Công đoàn
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {activeLevel === "CDCS" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đoàn viên</span>
            <div className="text-3xl font-extrabold text-white mt-2">{stats.tongDoanVien.toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Nữ: <span className="text-emerald-400">{stats.doanVienNu} ({stats.tiLeNu}%)</span></p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cấu trúc Tổ chức</span>
            <div className="text-3xl font-extrabold text-white mt-2">{stats.tongCDBP} CĐBP</div>
            <p className="text-[10px] text-slate-400 mt-1">Gồm <span className="text-emerald-400">{stats.tongToCongDoan} Tổ CĐ</span> hoạt động</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đảng viên trong CĐ</span>
            <div className="text-3xl font-extrabold text-red-400 mt-2">{stats.doanVienDangVien}</div>
            <p className="text-[10px] text-slate-400 mt-1">Tỉ lệ: <span className="text-red-400">{stats.tiLeDangVien}%</span></p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hoạt động & Phúc lợi</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.soHoatDong} HĐ</div>
            <p className="text-[10px] text-slate-400 mt-1">Phúc lợi: <span className="text-emerald-400">{stats.soLuotPhucLoi} lượt</span> hỗ trợ</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-5 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Biến động (Tháng)</span>
            <div className="text-3xl font-extrabold text-blue-400 mt-2">+{stats.ketNapMoiThang} mới</div>
            <p className="text-[10px] text-slate-400 mt-1">Chuyển: <span className="text-red-400">{stats.chuyenDiThang}</span> • Hưu: <span className="text-slate-400">{stats.nghiHuuThang}</span></p>
          </div>
        </div>
      )}

      {activeLevel === "CDBP" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Đoàn viên BP</span>
            <div className="text-3xl font-extrabold text-white mt-2">{(user?.phamVi === "CDBP" ? stats.tongDoanVien : totalCdbpMembers).toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Đang hoạt động trong khối</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hoạt động Công đoàn</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.soHoatDong} Phong trào</div>
            <p className="text-[10px] text-slate-400 mt-1">Đã được ghi nhận triển khai</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tồn quỹ hiện có</span>
            <div className="text-3xl font-extrabold text-white mt-2">{(stats.tonQuy || 0).toLocaleString()} đ</div>
            <p className="text-[10px] text-slate-400 mt-1">Thu đoàn phí: {(stats.tongThuDoanPhi || 0).toLocaleString()} đ</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Phúc lợi & Cứu trợ</span>
            <div className="text-3xl font-extrabold text-amber-500 mt-2">{stats.soLuotPhucLoi} lượt nhận</div>
            <p className="text-[10px] text-slate-400 mt-1">Được cấp cho đoàn viên khó khăn</p>
          </div>
        </div>
      )}

      {activeLevel === "TOCD" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Đoàn viên thuộc Tổ</span>
            <div className="text-3xl font-extrabold text-white mt-2">{(user?.phamVi === "TOCD" ? stats.tongDoanVien : totalTocdMembers).toLocaleString()}</div>
            <p className="text-[10px] text-slate-400 mt-1">Sinh hoạt trực tiếp tại tổ</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sáng kiến cải tiến</span>
            <div className="text-3xl font-extrabold text-emerald-400 mt-2">{stats.soSangKien} Đăng ký</div>
            <p className="text-[10px] text-slate-400 mt-1">Được hội đồng nghiệm thu đánh giá</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thu đoàn phí</span>
            <div className="text-3xl font-extrabold text-white mt-2">{(stats.tongThuDoanPhi || 0).toLocaleString()} đ</div>
            <p className="text-[10px] text-slate-400 mt-1">Đã thu nộp lên cấp trên đúng thời hạn</p>
          </div>
          <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md hover:border-slate-700 transition-all">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kết quả thi đua</span>
            <div className="text-3xl font-extrabold text-blue-400 mt-2">{stats.soKetQuaThiDua} khen thưởng</div>
            <p className="text-[10px] text-slate-400 mt-1">Phong trào thi đua trực tuyến</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">{barChartTitle}</h3>
          <div className="h-80 flex items-center justify-center">
            {barChartData.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Không có dữ liệu phân bổ đoàn viên</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip contentStyle={{ backgroundColor: "#0F172A", borderColor: "#334155", fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="doanVien" name="Đoàn viên" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md flex flex-col">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider">Cơ cấu Tài chính công đoàn</h3>
          <div className="flex-1 h-60 min-h-[240px] flex items-center justify-center">
            {stats.tongThuDoanPhi === 0 && stats.tongChi === 0 && stats.tonQuy === 0 ? (
              <span className="text-xs text-slate-500 italic">Không có dữ liệu giao dịch tài chính</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={financialData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {financialData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value as number).toLocaleString()} đ`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="space-y-2 mt-4">
            {financialData.map((entry, index) => (
              <div key={entry.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-slate-400">{entry.name}</span>
                </div>
                <span className="font-semibold text-white">{entry.value.toLocaleString()} đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Member Structure Statistics */}
      <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md space-y-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Thống kê Chi tiết Cơ cấu & Tiêu chí Đoàn viên</h3>
          <p className="text-xs text-slate-400 mt-1">Dữ liệu thống kê phân tích từ các tiêu chí hồ sơ đoàn viên công đoàn</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* Giới tính */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Giới tính</span>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Nam:</span>
                <span className="font-semibold text-blue-400">{stats.doanVienNam}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Nữ:</span>
                <span className="font-semibold text-pink-400">{stats.doanVienNu}</span>
              </div>
            </div>
          </div>

          {/* Đảng viên */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Đảng viên</span>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Đảng viên:</span>
                <span className="font-semibold text-red-400">★ {stats.doanVienDangVien}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tỉ lệ:</span>
                <span className="font-semibold text-slate-200">{stats.tiLeDangVien}%</span>
              </div>
            </div>
          </div>

          {/* Trình độ học vấn */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Trình độ học vấn</span>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {stats.doanVienTheoTrinhDo && stats.doanVienTheoTrinhDo.length > 0 ? (
                stats.doanVienTheoTrinhDo.map(item => (
                  <div key={item.name} className="flex justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[100px]">{item.name}:</span>
                    <span className="font-semibold text-purple-400">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-[10px] italic">Không có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Ngoại ngữ */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ngoại ngữ</span>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {stats.doanVienTheoNgoaiNgu && stats.doanVienTheoNgoaiNgu.length > 0 ? (
                stats.doanVienTheoNgoaiNgu.map(item => (
                  <div key={item.name} className="flex justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[100px]">{item.name}:</span>
                    <span className="font-semibold text-emerald-400">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-[10px] italic">Không có dữ liệu</div>
              )}
            </div>
          </div>

          {/* Trạng thái sinh hoạt */}
          <div className="p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Trạng thái sinh hoạt</span>
            <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
              {stats.doanVienTheoTrangThai && stats.doanVienTheoTrangThai.length > 0 ? (
                stats.doanVienTheoTrangThai.map(item => (
                  <div key={item.name} className="flex justify-between text-xs">
                    <span className="text-slate-400 truncate max-w-[100px]">{item.name}:</span>
                    <span className="font-semibold text-amber-500">{item.count}</span>
                  </div>
                ))
              ) : (
                <div className="text-slate-600 text-[10px] italic">Không có dữ liệu</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
