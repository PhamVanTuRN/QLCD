"use client";

import { useState } from "react";

interface QualityCriteria {
  id: string;
  name: string;
  target: number;
  actual: number;
  unit: string;
  category: string;
}

interface DepartmentRating {
  name: string;
  score: number;
  rating: string;
  criteria: { name: string; score: number; max: number }[];
}

const qualityCriteria: QualityCriteria[] = [
  { id: "q1", name: "Tỉ lệ CNVCLĐ tham gia công đoàn", target: 95, actual: 97.2, unit: "%", category: "Tổ chức" },
  { id: "q2", name: "Tỉ lệ thu đoàn phí đầy đủ", target: 98, actual: 96.5, unit: "%", category: "Tài chính" },
  { id: "q3", name: "Tỉ lệ đoàn viên là Đảng viên", target: 30, actual: 30.3, unit: "%", category: "Chính trị" },
  { id: "q4", name: "Tỉ lệ giới thiệu kết nạp Đảng", target: 5, actual: 4.8, unit: "%", category: "Chính trị" },
  { id: "q5", name: "Tỉ lệ tham gia hoạt động phong trào", target: 90, actual: 92.1, unit: "%", category: "Hoạt động" },
  { id: "q6", name: "Số sáng kiến được công nhận", target: 15, actual: 18, unit: "sáng kiến", category: "Sáng kiến" },
  { id: "q7", name: "Tỉ lệ đoàn viên nữ tham gia BCH", target: 25, actual: 28.5, unit: "%", category: "Bình đẳng giới" },
  { id: "q8", name: "Số vụ vi phạm kỷ luật CĐ", target: 0, actual: 0, unit: "vụ", category: "Kỷ luật" },
  { id: "q9", name: "Tỉ lệ hoàn thành kế hoạch hoạt động", target: 100, actual: 95.0, unit: "%", category: "Hoạt động" },
  { id: "q10", name: "Tỉ lệ đoàn viên đánh giá hài lòng", target: 85, actual: 91.3, unit: "%", category: "Chất lượng" },
];

const departmentRatings: DepartmentRating[] = [
  { name: "CĐBP Khối Nội 1", score: 96.5, rating: "Xuất sắc", criteria: [
    { name: "Tổ chức", score: 19, max: 20 }, { name: "Tài chính", score: 18.5, max: 20 },
    { name: "Hoạt động", score: 28, max: 30 }, { name: "Sáng kiến", score: 14, max: 15 }, { name: "Chính trị", score: 17, max: 15 }
  ]},
  { name: "CĐBP Ngoại Chấn thương", score: 92.0, rating: "Xuất sắc", criteria: [
    { name: "Tổ chức", score: 18, max: 20 }, { name: "Tài chính", score: 18, max: 20 },
    { name: "Hoạt động", score: 27, max: 30 }, { name: "Sáng kiến", score: 13, max: 15 }, { name: "Chính trị", score: 16, max: 15 }
  ]},
  { name: "CĐBP Gây mê Hồi sức", score: 88.5, rating: "Vững mạnh", criteria: [
    { name: "Tổ chức", score: 17.5, max: 20 }, { name: "Tài chính", score: 17, max: 20 },
    { name: "Hoạt động", score: 26, max: 30 }, { name: "Sáng kiến", score: 12, max: 15 }, { name: "Chính trị", score: 16, max: 15 }
  ]},
  { name: "CĐBP Cận lâm sàng 1", score: 85.0, rating: "Vững mạnh", criteria: [
    { name: "Tổ chức", score: 17, max: 20 }, { name: "Tài chính", score: 16.5, max: 20 },
    { name: "Hoạt động", score: 25, max: 30 }, { name: "Sáng kiến", score: 11.5, max: 15 }, { name: "Chính trị", score: 15, max: 15 }
  ]},
  { name: "CĐBP Cơ quan Quản lý", score: 82.0, rating: "Hoàn thành tốt", criteria: [
    { name: "Tổ chức", score: 16, max: 20 }, { name: "Tài chính", score: 16, max: 20 },
    { name: "Hoạt động", score: 24, max: 30 }, { name: "Sáng kiến", score: 11, max: 15 }, { name: "Chính trị", score: 15, max: 15 }
  ]},
];

const getRatingColor = (rating: string) => {
  switch (rating) {
    case "Xuất sắc": return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Vững mạnh": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "Hoàn thành tốt": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Hoàn thành": return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    default: return "bg-red-500/10 text-red-400 border-red-500/20";
  }
};

export default function QualityPage() {
  const [selectedYear, setSelectedYear] = useState("2026");
  const [selectedPeriod, setSelectedPeriod] = useState("Q2");

  const getProgressColor = (actual: number, target: number, isInverse = false) => {
    if (isInverse) {
      return actual <= target ? "bg-emerald-500" : "bg-red-500";
    }
    const ratio = actual / target;
    if (ratio >= 1) return "bg-emerald-500";
    if (ratio >= 0.9) return "bg-amber-500";
    return "bg-red-500";
  };

  const getStatusIcon = (actual: number, target: number, isInverse = false) => {
    if (isInverse) return actual <= target ? "✅" : "❌";
    return actual >= target ? "✅" : actual >= target * 0.9 ? "⚠️" : "❌";
  };

  // Tính điểm tổng
  const totalPassed = qualityCriteria.filter(c =>
    c.id === "q8" ? c.actual <= c.target : c.actual >= c.target
  ).length;
  const overallRating = totalPassed >= 9 ? "Xuất sắc" : totalPassed >= 7 ? "Vững mạnh" : totalPassed >= 5 ? "Hoàn thành tốt" : "Chưa hoàn thành";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Tiêu chuẩn Chất lượng Công đoàn</h2>
          <p className="text-xs text-slate-400">Đánh giá, xếp loại CĐCS vững mạnh xuất sắc theo bộ tiêu chí của Tổng LĐLĐ Việt Nam</p>
        </div>
        <div className="flex gap-3">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
            <option value="2026">Năm 2026</option><option value="2025">Năm 2025</option><option value="2024">Năm 2024</option>
          </select>
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all">
            <option value="Q1">Quý 1</option><option value="Q2">Quý 2</option><option value="Q3">Quý 3</option><option value="Q4">Quý 4</option><option value="YEAR">Cả năm</option>
          </select>
        </div>
      </div>

      {/* Overall Rating Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950/60 border border-emerald-800/30 p-6 rounded-2xl backdrop-blur-md">
          <span className="text-[10px] font-bold text-emerald-500/70 uppercase tracking-wider">Xếp loại CĐCS</span>
          <div className="text-3xl font-extrabold text-emerald-400 mt-2">{overallRating}</div>
          <p className="text-[10px] text-slate-400 mt-1">Đạt <span className="text-emerald-400">{totalPassed}/{qualityCriteria.length}</span> tiêu chí — Kỳ {selectedPeriod}/{selectedYear}</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">CĐBP Xuất sắc</span>
          <div className="text-3xl font-extrabold text-white mt-2">{departmentRatings.filter(d => d.rating === "Xuất sắc").length} / {departmentRatings.length}</div>
          <p className="text-[10px] text-slate-400 mt-1">{departmentRatings.filter(d => d.rating === "Vững mạnh").length} Vững mạnh • {departmentRatings.filter(d => d.rating === "Hoàn thành tốt").length} Hoàn thành tốt</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-md">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Điểm trung bình</span>
          <div className="text-3xl font-extrabold text-blue-400 mt-2">{(departmentRatings.reduce((s, d) => s + d.score, 0) / departmentRatings.length).toFixed(1)}/100</div>
          <p className="text-[10px] text-slate-400 mt-1">Điểm cao nhất: <span className="text-emerald-400">{Math.max(...departmentRatings.map(d => d.score))}</span></p>
        </div>
      </div>

      {/* Quality Criteria Table */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80 flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Bộ Tiêu chí Đánh giá CĐCS ({qualityCriteria.length} tiêu chí)</span>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getRatingColor(overallRating)}`}>{overallRating}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="px-6 py-3.5 w-8"></th>
                <th className="px-6 py-3.5">Tiêu chí</th>
                <th className="px-6 py-3.5">Phân loại</th>
                <th className="px-6 py-3.5">Mục tiêu</th>
                <th className="px-6 py-3.5">Thực tế</th>
                <th className="px-6 py-3.5 w-48">Tiến độ</th>
                <th className="px-6 py-3.5 text-center">KQ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {qualityCriteria.map(c => {
                const isInverse = c.id === "q8";
                const percent = isInverse
                  ? (c.target === 0 && c.actual === 0 ? 100 : Math.max(0, 100 - (c.actual / Math.max(c.target, 1)) * 100))
                  : Math.min(100, (c.actual / c.target) * 100);
                return (
                  <tr key={c.id} className="hover:bg-slate-900/40 transition-all">
                    <td className="px-6 py-4 text-center">{getStatusIcon(c.actual, c.target, isInverse)}</td>
                    <td className="px-6 py-4 font-medium text-slate-100">{c.name}</td>
                    <td className="px-6 py-4"><span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-400">{c.category}</span></td>
                    <td className="px-6 py-4 text-slate-400">{isInverse ? `≤ ${c.target}` : `≥ ${c.target}`} {c.unit}</td>
                    <td className="px-6 py-4 font-semibold text-white">{c.actual} {c.unit}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className={`h-2 rounded-full transition-all duration-700 ${getProgressColor(c.actual, c.target, isInverse)}`} style={{ width: `${percent}%` }} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        (isInverse ? c.actual <= c.target : c.actual >= c.target)
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}>
                        {(isInverse ? c.actual <= c.target : c.actual >= c.target) ? "Đạt" : "Chưa đạt"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Department Comparison */}
      <div className="bg-slate-950/40 border border-slate-800 rounded-2xl backdrop-blur-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800/80">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Xếp hạng Chất lượng theo CĐBP</span>
        </div>
        <div className="p-6 space-y-4">
          {departmentRatings.map((dept, index) => (
            <div key={dept.name} className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                    index === 0 ? "bg-emerald-600/20 text-emerald-400" : index === 1 ? "bg-blue-600/20 text-blue-400" : "bg-slate-800 text-slate-400"
                  }`}>
                    #{index + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-slate-100">{dept.name}</span>
                    <span className={`ml-3 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRatingColor(dept.rating)}`}>{dept.rating}</span>
                  </div>
                </div>
                <span className="text-lg font-extrabold text-white">{dept.score}<span className="text-xs text-slate-500 font-normal">/100</span></span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {dept.criteria.map(c => (
                  <div key={c.name} className="text-center">
                    <div className="text-[9px] text-slate-500 mb-1">{c.name}</div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${c.score / c.max >= 0.9 ? "bg-emerald-500" : c.score / c.max >= 0.7 ? "bg-amber-500" : "bg-red-500"}`}
                        style={{ width: `${(c.score / c.max) * 100}%` }} />
                    </div>
                    <div className="text-[10px] text-slate-300 mt-0.5 font-medium">{c.score}/{c.max}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
