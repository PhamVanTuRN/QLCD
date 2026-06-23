"use client";

import { useState } from "react";
import { PageHeader, StatCard } from "@/components/ui-components";
import { Award, Users, TrendingUp, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

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
    case "Xuất sắc": return "bg-emerald-50 text-emerald-700 border-emerald-200/60";
    case "Vững mạnh": return "bg-blue-50 text-blue-700 border-blue-200/60";
    case "Hoàn thành tốt": return "bg-amber-50 text-amber-700 border-amber-200/60";
    case "Hoàn thành": return "bg-slate-50 text-slate-700 border-slate-200/60";
    default: return "bg-red-50 text-red-700 border-red-200/60";
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
    if (isInverse) {
      return actual <= target ? (
        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
      ) : (
        <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
      );
    }
    return actual >= target ? (
      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
    ) : actual >= target * 0.9 ? (
      <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />
    ) : (
      <XCircle className="w-4.5 h-4.5 text-red-500 shrink-0" />
    );
  };

  // Tính điểm tổng
  const totalPassed = qualityCriteria.filter(c =>
    c.id === "q8" ? c.actual <= c.target : c.actual >= c.target
  ).length;
  const overallRating = totalPassed >= 9 ? "Xuất sắc" : totalPassed >= 7 ? "Vững mạnh" : totalPassed >= 5 ? "Hoàn thành tốt" : "Chưa hoàn thành";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <PageHeader 
        title="Tiêu chuẩn Chất lượng Công đoàn" 
        description="Đánh giá, xếp loại CĐCS vững mạnh xuất sắc theo bộ tiêu chí của Tổng LĐLĐ Việt Nam"
      >
        <div className="flex gap-2">
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="2026">Năm 2026</option>
            <option value="2025">Năm 2025</option>
            <option value="2024">Năm 2024</option>
          </select>
          <select 
            value={selectedPeriod} 
            onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 shadow-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="Q1">Quý 1</option>
            <option value="Q2">Quý 2</option>
            <option value="Q3">Quý 3</option>
            <option value="Q4">Quý 4</option>
            <option value="YEAR">Cả năm</option>
          </select>
        </div>
      </PageHeader>

      {/* Overall Rating Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Xếp loại CĐCS"
          value={overallRating}
          subtitle={
            <span>
              Đạt <span className="font-bold text-emerald-600">{totalPassed}/{qualityCriteria.length}</span> tiêu chí — Kỳ {selectedPeriod}/{selectedYear}
            </span>
          }
          icon={Award}
          color={overallRating === "Xuất sắc" ? "emerald" : "blue"}
        />
        <StatCard
          title="CĐBP Xuất sắc"
          value={`${departmentRatings.filter(d => d.rating === "Xuất sắc").length} / ${departmentRatings.length}`}
          subtitle={`${departmentRatings.filter(d => d.rating === "Vững mạnh").length} Vững mạnh • ${departmentRatings.filter(d => d.rating === "Hoàn thành tốt").length} H.Thành Tốt`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Điểm trung bình"
          value={`${(departmentRatings.reduce((s, d) => s + d.score, 0) / departmentRatings.length).toFixed(1)}/100`}
          subtitle={
            <span>
              Điểm cao nhất: <span className="font-bold text-emerald-600">{Math.max(...departmentRatings.map(d => d.score))}</span>
            </span>
          }
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Quality Criteria Table */}
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Bộ Tiêu chí Đánh giá CĐCS ({qualityCriteria.length} tiêu chí)
          </span>
          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getRatingColor(overallRating)}`}>
            {overallRating}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs table-modern">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 font-semibold border-b border-slate-100 uppercase tracking-wider">
                <th className="px-6 py-3.5 w-8"></th>
                <th className="px-6 py-3.5">Tiêu chí</th>
                <th className="px-6 py-3.5">Phân loại</th>
                <th className="px-6 py-3.5">Mục tiêu</th>
                <th className="px-6 py-3.5">Thực tế</th>
                <th className="px-6 py-3.5 w-48">Tiến độ</th>
                <th className="px-6 py-3.5 text-center">Kết quả</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {qualityCriteria.map(c => {
                const isInverse = c.id === "q8";
                const percent = isInverse
                  ? (c.target === 0 && c.actual === 0 ? 100 : Math.max(0, 100 - (c.actual / Math.max(c.target, 1)) * 100))
                  : Math.min(100, (c.actual / c.target) * 100);
                const isPassed = isInverse ? c.actual <= c.target : c.actual >= c.target;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/40 transition-all">
                    <td className="px-6 py-4 text-center">{getStatusIcon(c.actual, c.target, isInverse)}</td>
                    <td className="px-6 py-4 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100/80 px-2 py-0.5 rounded-lg border border-slate-200/50 text-slate-600 font-medium">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">
                      {isInverse ? `≤ ${c.target}` : `≥ ${c.target}`} {c.unit}
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {c.actual} {c.unit}
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/30">
                        <div 
                          className={`h-2 rounded-full transition-all duration-700 ${getProgressColor(c.actual, c.target, isInverse)}`} 
                          style={{ width: `${percent}%` }} 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isPassed
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" 
                          : "bg-red-50 text-red-700 border-red-200/60"
                      }`}>
                        {isPassed ? "Đạt" : "Chưa đạt"}
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
      <div className="bg-white border border-slate-150 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/20">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Xếp hạng Chất lượng theo CĐBP
          </span>
        </div>
        <div className="p-6 space-y-4">
          {departmentRatings.map((dept, index) => (
            <div key={dept.name} className="bg-slate-50/30 border border-slate-100/80 p-4 rounded-2xl hover:shadow-xs hover:border-slate-200/50 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    index === 0 
                      ? "bg-emerald-50 text-emerald-750 border border-emerald-100" 
                      : index === 1 
                        ? "bg-blue-50 text-blue-750 border border-blue-100" 
                        : "bg-slate-100 text-slate-655 border border-slate-200/60"
                  }`}>
                    #{index + 1}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{dept.name}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRatingColor(dept.rating)}`}>
                      {dept.rating}
                    </span>
                  </div>
                </div>
                <span className="text-base font-extrabold text-slate-800">
                  {dept.score}
                  <span className="text-[10px] text-slate-400 font-bold ml-0.5">/100</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {dept.criteria.map(c => (
                  <div key={c.name} className="text-center bg-white p-2.5 rounded-xl border border-slate-100">
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">{c.name}</div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/30 mb-1">
                      <div 
                        className={`h-1.5 rounded-full ${
                          c.score / c.max >= 0.9 
                            ? "bg-emerald-500" 
                            : c.score / c.max >= 0.7 
                              ? "bg-amber-500" 
                              : "bg-red-500"
                        }`}
                        style={{ width: `${(c.score / c.max) * 100}%` }} 
                      />
                    </div>
                    <div className="text-[10px] text-slate-600 font-bold">{c.score}<span className="text-slate-400 font-medium">/{c.max}</span></div>
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
