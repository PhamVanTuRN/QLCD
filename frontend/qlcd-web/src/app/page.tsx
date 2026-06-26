"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { 
  getStats, 
  UnionStatsDto, 
  getKhoiChuyenMonApi, 
  getUnionTree, 
  UnionUnitDto, 
  StatsFilter,
  KhoiChuyenMonDto
} from "@/lib/api";
import { useAuth, UserProfile } from "@/lib/auth-context";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from "recharts";
import { StatCard } from "@/components/ui-components";
import { Users, DollarSign, Calendar, Heart, Lightbulb, Award } from "lucide-react";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
const THI_DUA_COLORS = ["#10B981", "#3B82F6", "#EF4444"]; // DatGiai, DatYeuCau, ChuaDat

interface FlatUnit {
  id: string;
  tenDonVi: string;
  level: number;
  loaiToChuc: string;
}

function getSelectableUnits(tree: UnionUnitDto | null, user: UserProfile | null): FlatUnit[] {
  if (!tree) return [];
  
  let startNode: UnionUnitDto | null = tree;
  if (user?.phamVi === "CDBP" || user?.phamVi === "TOCD") {
    const targetId = user.donViId;
    const findNode = (node: UnionUnitDto): UnionUnitDto | null => {
      if (node.id === targetId) return node;
      for (const child of node.children || []) {
        const found = findNode(child);
        if (found) return found;
      }
      return null;
    };
    startNode = targetId ? findNode(tree) : null;
  }
  
  if (!startNode) return [];

  const list: FlatUnit[] = [];
  const traverse = (node: UnionUnitDto, indent: number) => {
    list.push({
      id: node.id,
      tenDonVi: "  ".repeat(indent) + node.tenDonVi,
      level: node.level,
      loaiToChuc: node.loaiToChuc
    });
    
    if (user?.phamVi !== "TOCD") {
      for (const child of node.children || []) {
        traverse(child, indent + 1);
      }
    }
  };
  
  traverse(startNode, 0);
  return list;
}

// Mock stats mặc định khi chưa có dữ liệu từ DB
const defaultStats: UnionStatsDto = {
  tongDoanVien: 0, doanVienNam: 0, doanVienNu: 0,
  doanVienDangSinhHoat: 0, doanVienDangVien: 0, doanVienDangVienDuBi: 0,
  tiLeDangVien: 0, tiLeDangVienDuBi: 0, tiLeNu: 0,
  tongCDBP: 0, tongToCongDoan: 0,
  ketNapMoiThang: 0, chuyenDiThang: 0, nghiHuuThang: 0,
  
  doanVienTheoCdbp: [],
  doanVienTheoToCd: [],
  doanVienTheoKhoi: [],
  doanVienTheoGioiTinh: [],
  doanVienTheoTrangThai: [],
  doanVienTheoChatLuong: [],
  doanVienTheoChucVu: [],
  doanVienTheoNgoaiNgu: [],
  doanVienTheoTrinhDo: [],
  doanVienTheoLoaiCanBo: [],
  doanVienTheoDanToc: [],
  doanVienTheoTonGiao: [],

  tongThuDoanPhi: 0,
  tongChi: 0,
  tonQuy: 0,
  soHoatDong: 0,
  soLuotPhucLoi: 0,
  soSangKien: 0,
  soKetQuaThiDua: 0,

  thuChiTheoThoiGian: [],
  hoatDongTheoThang: [],
  thiDuaTheoToChuc: []
};

export default function Dashboard() {
  const { user } = useAuth();
  
  // Filters State
  const [khoiList, setKhoiList] = useState<KhoiChuyenMonDto[]>([]);
  const [selectableOrgs, setSelectableOrgs] = useState<FlatUnit[]>([]);
  
  const [selectedKhoi, setSelectedKhoi] = useState<string>("");
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [searchKeyword, setSearchKeyword] = useState<string>("");
  
  // Time filters
  const [timeMode, setTimeMode] = useState<"YEAR" | "QUARTER" | "MONTH" | "RANGE">("YEAR");
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState<string>("1");
  const [selectedMonth, setSelectedMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  const [stats, setStats] = useState<UnionStatsDto>(defaultStats);
  const [loading, setLoading] = useState(true);

  // Helper to get combined or filtered chart data for Chart 1
  const getChartData = useCallback(() => {
    if (!stats) return [];
    
    // 1. If running new API, stats.doanVienTheoToCd is empty
    if (!stats.doanVienTheoToCd || stats.doanVienTheoToCd.length === 0) {
      return (stats.doanVienTheoCdbp || []).map(d => ({ name: d.name, doanVien: d.count }));
    }

    // 2. If running old API, merge arrays but avoid duplicates
    const activeOrgId = selectedOrg || user?.donViId;
    const currentOrg = selectableOrgs.find(o => o.id === activeOrgId);
    const currentLevel = currentOrg ? currentOrg.level : 1;
    const targetLevel = currentLevel + 1;

    // Filter combined list by target level units
    const targetOrgNames = selectableOrgs
      .filter(o => o.level === targetLevel)
      .map(o => o.tenDonVi.trim().toLowerCase());

    const combined = [...(stats.doanVienTheoCdbp || []), ...(stats.doanVienTheoToCd || [])];
    const filtered = combined.filter(item => {
      const trimmedName = item.name.trim().toLowerCase();
      return targetOrgNames.includes(trimmedName);
    });

    const finalData = filtered.length > 0 ? filtered : combined;
    const uniqueMap = new Map<string, number>();
    finalData.forEach(item => {
      uniqueMap.set(item.name, item.count);
    });

    return Array.from(uniqueMap.entries()).map(([name, count]) => ({
      name,
      doanVien: count
    }));
  }, [stats, selectedOrg, user, selectableOrgs]);

  // Dynamic width calculations for scrollable charts
  const chart1ContainerRef = useRef<HTMLDivElement>(null);
  const chart5ContainerRef = useRef<HTMLDivElement>(null);
  const [chart1Width, setChart1Width] = useState(600);
  const [chart5Width, setChart5Width] = useState(600);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (chart1ContainerRef.current) {
        const parentW = chart1ContainerRef.current.clientWidth;
        const dataLength = getChartData().length;
        const requiredW = dataLength * 85;
        setChart1Width(Math.max(parentW, requiredW, 600));
      }
      if (chart5ContainerRef.current) {
        const parentW = chart5ContainerRef.current.clientWidth;
        const dataLength = stats.thiDuaTheoToChuc.length || 0;
        const requiredW = dataLength * 85;
        setChart5Width(Math.max(parentW, requiredW, 600));
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [stats.doanVienTheoCdbp, stats.doanVienTheoToCd, stats.thiDuaTheoToChuc, getChartData]);

  // Load catalogs on mount
  useEffect(() => {
    (async () => {
      const khoiData = await getKhoiChuyenMonApi();
      setKhoiList(khoiData);
      
      const treeData = await getUnionTree();
      if (treeData) {
        const orgs = getSelectableUnits(treeData, user);
        setSelectableOrgs(orgs);
        // Mặc định chọn đơn vị quản lý của user nếu có
        if (user?.donViId) {
          setSelectedOrg(user.donViId);
        }
      }
    })();
  }, [user]);

  // Main data fetch function
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    const filter: StatsFilter = {};

    if (selectedKhoi) filter.maKhoi = selectedKhoi;
    if (selectedOrg) filter.filterOrgId = selectedOrg;
    if (searchKeyword.trim()) filter.searchKeyword = searchKeyword.trim();

    if (timeMode === "RANGE") {
      if (fromDate) filter.fromDate = fromDate;
      if (toDate) filter.toDate = toDate;
    } else if (timeMode === "MONTH") {
      filter.year = parseInt(selectedYear);
      filter.month = parseInt(selectedMonth);
    } else if (timeMode === "QUARTER") {
      filter.year = parseInt(selectedYear);
      filter.quarter = parseInt(selectedQuarter);
    } else {
      // YEAR
      filter.year = parseInt(selectedYear);
    }

    const data = await getStats(filter);
    if (data) {
      setStats(data);
    }
    setLoading(false);
  }, [selectedKhoi, selectedOrg, searchKeyword, timeMode, selectedYear, selectedQuarter, selectedMonth, fromDate, toDate]);

  // Refetch when filters change
  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDashboardData();
    });
  }, [fetchDashboardData]);

  // Generate Year Array
  const currentYr = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYr - i).toString());

  // Indent mapper for organization list
  const getOrgTypeLabel = (loai: string) => {
    switch (loai) {
      case "CDCS": return "CĐCS";
      case "CDBP": return "CĐBP";
      default: return "Tổ CĐ";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Dashboard Chỉ đạo & Thống kê</h2>
          <p className="text-xs text-slate-550 mt-1 font-medium">
            Xin chào <span className="text-blue-600 font-semibold">{user?.hoTen}</span> — {user?.vaiTro} 
            {user?.donViTen ? ` • ${user.donViTen}` : ""} • Hệ thống thông tin thời gian thực
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* Modern Advanced Filter Bar */}
      <div className="bg-white border border-slate-150 p-5 rounded-2xl shadow-xs space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Bộ lọc & Tìm kiếm Thống kê</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Search */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-500">Tìm kiếm nhanh</label>
            <input
              type="text"
              placeholder="Tên tổ chức, mã, khối..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none w-full transition-all"
            />
          </div>

          {/* Block Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-500">Khối chuyên môn</label>
            <select
              value={selectedKhoi}
              onChange={(e) => setSelectedKhoi(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-850 outline-none w-full cursor-pointer transition-all"
            >
              <option value="">Tất cả các khối</option>
              {khoiList.map(k => (
                <option key={k.id} value={k.id}>{k.tenKhoi}</option>
              ))}
            </select>
          </div>

          {/* Organization Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-500">Tổ chức công đoàn</label>
            <select
              value={selectedOrg}
              onChange={(e) => setSelectedOrg(e.target.value)}
              className="bg-slate-50/50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-850 outline-none w-full cursor-pointer transition-all"
            >
              {user?.phamVi !== "TOCD" && <option value="">Toàn hệ thống được quyền</option>}
              {selectableOrgs.map(org => (
                <option key={org.id} value={org.id}>
                  {org.tenDonVi} ({getOrgTypeLabel(org.loaiToChuc)})
                </option>
              ))}
            </select>
          </div>

          {/* Time Filter Mode */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-500">Chế độ lọc thời gian</label>
            <select
              value={timeMode}
              onChange={(e) => setTimeMode(e.target.value as "YEAR" | "QUARTER" | "MONTH" | "RANGE")}
              className="bg-slate-50/50 border border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl px-3 py-2 text-xs text-slate-850 outline-none w-full cursor-pointer transition-all"
            >
              <option value="YEAR">Theo Năm</option>
              <option value="QUARTER">Theo Quý</option>
              <option value="MONTH">Theo Tháng</option>
              <option value="RANGE">Tùy chọn khoảng ngày</option>
            </select>
          </div>
        </div>

        {/* Sub-Time Selectors depending on TimeMode */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100">
          {(timeMode === "YEAR" || timeMode === "QUARTER" || timeMode === "MONTH") && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Năm:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none cursor-pointer focus:border-blue-600 transition-all"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {timeMode === "QUARTER" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Quý:</span>
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none cursor-pointer focus:border-blue-600 transition-all"
              >
                <option value="1">Quý I</option>
                <option value="2">Quý II</option>
                <option value="3">Quý III</option>
                <option value="4">Quý IV</option>
              </select>
            </div>
          )}

          {timeMode === "MONTH" && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Tháng:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 outline-none cursor-pointer focus:border-blue-600 transition-all"
              >
                {Array.from({ length: 12 }, (_, i) => (i + 1).toString()).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
          )}

          {timeMode === "RANGE" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Từ ngày:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none cursor-pointer focus:border-blue-600 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Đến ngày:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none cursor-pointer focus:border-blue-600 transition-all"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-slate-100 p-5 rounded-2xl h-24 animate-pulse flex items-center justify-center">
              <span className="text-slate-400 text-xs font-semibold">Đang tải...</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Đoàn viên */}
          <StatCard
            title="Đoàn viên"
            value={stats.tongDoanVien.toLocaleString()}
            subtitle={
              <span>
                Nam: <span className="text-blue-600 font-semibold">{stats.doanVienNam}</span> • Nữ: <span className="text-pink-600 font-semibold">{stats.doanVienNu}</span>
              </span>
            }
            icon={Users}
            color="blue"
          />

          {/* Tài chính */}
          <StatCard
            title="Tồn quỹ"
            value={`${(stats.tonQuy || 0).toLocaleString()} đ`}
            subtitle={
              <span className="truncate block">
                Thu: <span className="text-emerald-600">{(stats.tongThuDoanPhi || 0).toLocaleString()}</span> • Chi: <span className="text-red-500">{(stats.tongChi || 0).toLocaleString()}</span>
              </span>
            }
            icon={DollarSign}
            color="emerald"
          />

          {/* Hoạt động */}
          <StatCard
            title="Hoạt động CĐ"
            value={stats.soHoatDong}
            subtitle="Sự kiện, phong trào"
            icon={Calendar}
            color="amber"
          />

          {/* Phúc lợi */}
          <StatCard
            title="Phúc lợi & Cứu trợ"
            value={stats.soLuotPhucLoi}
            subtitle="Lượt đoàn viên nhận hỗ trợ"
            icon={Heart}
            color="pink"
          />

          {/* Sáng kiến */}
          <StatCard
            title="Sáng kiến & Đề tài"
            value={stats.soSangKien}
            subtitle="Đề tài nghiệm thu đạt"
            icon={Lightbulb}
            color="sky"
          />

          {/* Thi đua */}
          <StatCard
            title="Thi đua trực tuyến"
            value={stats.soKetQuaThiDua}
            subtitle="Kết quả khen thưởng đánh giá"
            icon={Award}
            color="purple"
          />
        </div>
      )}

      {/* Visual Charts Layout */}
      {!loading && (
        <div className="space-y-6">
          {/* Row 1: Organisation allocation (Bar) & Block allocation (Pie) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Members by organisation */}
            <div className="lg:col-span-2 bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Đoàn viên theo Tổ chức Công đoàn</h3>
              <div ref={chart1ContainerRef} className="w-full overflow-x-auto pb-2">
                <div 
                  className="h-80 relative"
                  style={{ width: `${chart1Width}px` }}
                >
                  {getChartData().length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs text-slate-400 italic">Không có dữ liệu đơn vị công đoàn</span>
                    </div>
                  ) : (
                    <BarChart 
                      width={chart1Width} 
                      height={320} 
                      data={getChartData()}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} />
                      <YAxis stroke="#94A3B8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", fontSize: 11, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="doanVien" name="Đoàn viên" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </div>
              </div>
            </div>

            {/* Chart 2: Members by block */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs flex flex-col">
              <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Đoàn viên theo Khối chuyên môn</h3>
              <div className="flex-1 h-60 min-h-[240px] w-full relative">
                {stats.doanVienTheoKhoi.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-slate-400 italic">Không có dữ liệu khối chuyên môn</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={240} minWidth={0}>
                    <PieChart>
                      <Pie 
                        data={stats.doanVienTheoKhoi.map(k => ({ name: k.name, value: k.count }))} 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={75} 
                        paddingAngle={3} 
                        dataKey="value"
                      >
                        {stats.doanVienTheoKhoi.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${(value as number).toLocaleString()} đoàn viên`} contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="space-y-2 mt-4 max-h-24 overflow-y-auto pr-1">
                {stats.doanVienTheoKhoi.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-500">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{entry.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 2: Finances over time (Double Line) & Activities by month (Bar) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Revenue & Expense timeline */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Biến động Thu - Chi Tài chính</h3>
              <div className="h-80 w-full relative">
                {stats.thuChiTheoThoiGian.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-slate-400 italic">Không có dữ liệu biến động thu chi</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320} minWidth={0}>
                    <LineChart data={stats.thuChiTheoThoiGian}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="timeLabel" stroke="#94A3B8" fontSize={10} />
                      <YAxis stroke="#94A3B8" fontSize={10} />
                      <Tooltip formatter={(value) => `${(value as number).toLocaleString()} đ`} contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", fontSize: 11, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="thu" name="Tổng Thu" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="chi" name="Tổng Chi" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 4: Activities by month */}
            <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Hoạt động Công đoàn theo Tháng</h3>
              <div className="h-80 w-full relative">
                {stats.hoatDongTheoThang.length === 0 ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-slate-400 italic">Không có dữ liệu hoạt động công đoàn</span>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={320} minWidth={0}>
                    <BarChart data={stats.hoatDongTheoThang}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="timeLabel" stroke="#94A3B8" fontSize={10} />
                      <YAxis stroke="#94A3B8" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", fontSize: 11, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="count" name="Số hoạt động" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 mb-6 uppercase tracking-wider">Kết quả Thi đua khen thưởng theo Đơn vị</h3>
            <div ref={chart5ContainerRef} className="w-full overflow-x-auto pb-2">
              <div 
                className="h-80 relative"
                style={{ width: `${chart5Width}px` }}
              >
                {stats.thiDuaTheoToChuc.length === 0 ?
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs text-slate-400 italic">Không có dữ liệu thi đua khen thưởng</span>
                  </div>
                :
                  <BarChart 
                    width={chart5Width} 
                    height={320} 
                    data={stats.thiDuaTheoToChuc}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="organizationName" stroke="#94A3B8" fontSize={10} />
                    <YAxis stroke="#94A3B8" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0", borderRadius: "12px", color: "#0F172A", fontSize: 11, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="datGiai" name="Khen thưởng / Xuất sắc" stackId="a" fill={THI_DUA_COLORS[0]} />
                    <Bar dataKey="datYeuCau" name="Đạt yêu cầu / Khá" stackId="a" fill={THI_DUA_COLORS[1]} />
                    <Bar dataKey="chuaDat" name="Không đạt / Kém" stackId="a" fill={THI_DUA_COLORS[2]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Member Structure & Criteria Statistics */}
      {!loading && (
        <div className="bg-white border border-slate-150 p-6 rounded-2xl shadow-xs space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Phân tích Chi tiết Cơ cấu Đoàn viên</h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Các tiêu chí phân tích hồ sơ đoàn viên áp dụng theo điều kiện lọc hiện tại</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Phân loại cán bộ */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Phân loại cán bộ (Loại cán bộ)</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stats.doanVienTheoLoaiCanBo && stats.doanVienTheoLoaiCanBo.length > 0 ? (
                  stats.doanVienTheoLoaiCanBo.map(item => (
                    <div key={item.name} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">{item.name}:</span>
                      <span className="font-semibold text-blue-650">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[10px] italic">Không có dữ liệu loại cán bộ</div>
                )}
              </div>
            </div>

            {/* Đảng viên */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Đảng viên & Đoàn thể</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 truncate">Đảng viên chính thức:</span>
                  <span className="font-semibold text-red-650">
                    {stats.doanVienDangVien} <span className="text-[10px] text-slate-400 font-medium">({stats.tiLeDangVien}%)</span>
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 truncate">Đảng viên dự bị:</span>
                  <span className="font-semibold text-rose-500">
                    {stats.doanVienDangVienDuBi} <span className="text-[10px] text-slate-400 font-medium">({stats.tiLeDangVienDuBi}%)</span>
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 truncate">Quần chúng / Khác:</span>
                  <span className="font-semibold text-slate-700">
                    {stats.tongDoanVien - stats.doanVienDangVien - stats.doanVienDangVienDuBi} <span className="text-[10px] text-slate-400 font-medium">({stats.tongDoanVien > 0 ? (100 - stats.tiLeDangVien - stats.tiLeDangVienDuBi).toFixed(1) : "0.0"}%)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Trình độ chuyên môn */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Học văn & Học hàm học vị</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stats.doanVienTheoTrinhDo.length > 0 ? (
                  stats.doanVienTheoTrinhDo.map(item => (
                    <div key={item.name} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">{item.name}:</span>
                      <span className="font-semibold text-purple-650">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[10px] italic">Không có dữ liệu trình độ</div>
                )}
              </div>
            </div>

            {/* Chức danh / Vai trò */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chức vụ trong Công đoàn</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stats.doanVienTheoChucVu.length > 0 ? (
                  stats.doanVienTheoChucVu.map(item => (
                    <div key={item.name} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">{item.name}:</span>
                      <span className="font-semibold text-amber-600">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[10px] italic">Không có chức danh ghi nhận</div>
                )}
              </div>
            </div>

            {/* Dân tộc */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dân tộc</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stats.doanVienTheoDanToc && stats.doanVienTheoDanToc.length > 0 ? (
                  stats.doanVienTheoDanToc.map(item => (
                    <div key={item.name} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">{item.name}:</span>
                      <span className="font-semibold text-emerald-650">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[10px] italic">Không có dữ liệu dân tộc</div>
                )}
              </div>
            </div>

            {/* Tôn giáo */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tôn giáo</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stats.doanVienTheoTonGiao && stats.doanVienTheoTonGiao.length > 0 ? (
                  stats.doanVienTheoTonGiao.map(item => (
                    <div key={item.name} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">{item.name}:</span>
                      <span className="font-semibold text-rose-650">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[10px] italic">Không có dữ liệu tôn giáo</div>
                )}
              </div>
            </div>

            {/* Ngoại ngữ */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Kỹ năng ngoại ngữ</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stats.doanVienTheoNgoaiNgu.length > 0 ? (
                  stats.doanVienTheoNgoaiNgu.map(item => (
                    <div key={item.name} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">{item.name}:</span>
                      <span className="font-semibold text-sky-655">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[10px] italic">Không có chứng chỉ ghi nhận</div>
                )}
              </div>
            </div>

            {/* Chất lượng đoàn viên */}
            <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chất lượng đánh giá</span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {stats.doanVienTheoChatLuong.length > 0 ? (
                  stats.doanVienTheoChatLuong.map(item => (
                    <div key={item.name} className="flex justify-between text-xs">
                      <span className="text-slate-500 truncate max-w-[150px]">{item.name}:</span>
                      <span className="font-semibold text-pink-650">{item.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 text-[10px] italic">Không có dữ liệu đánh giá xếp loại</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
